import { Field as BaseField } from "@base-ui/react/field";
import { arrowDown, arrowUp, danger, plus, trash } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { canAdd, joinLines, moveItem } from "@tailor/packs/forms/list-editor/logic";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { useFieldControl } from "../../core/field/field";
import { Input } from "../../core/input/input";
import { Select, type SelectOption } from "../../core/select/select";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface ListEditorProps {
  /** The accessible name of the list; row n is named "<label> n". */
  label: string;
  value?: readonly string[];
  defaultValue?: readonly string[];
  /** The values without the empty rows. */
  onValueChange?: (items: string[]) => void;
  /** Known values: each row is a select of them, and a value that another row holds cannot be picked twice. */
  options?: readonly SelectOption[];
  placeholder?: string;
  /** The most rows. */
  max?: number;
  /** Sends each value as a hidden input named `name[]`. */
  name?: string;
  /** The error text of one value, or undefined when it is valid. */
  validate?: (item: string) => string | undefined;
  id?: string;
  disabled?: boolean;
}

interface Row {
  readonly key: number;
  readonly value: string;
}

type Focus = { key: number; part: "item" | "up" | "down" } | "add" | null;

/** The focusable control of a row: the input or the select trigger. */
const ITEM = ".t-list-editor-item .t-control:not([data-t-upgraded])";

const filled = (rows: readonly Row[]): string[] =>
  rows.map((row) => row.value).filter((v) => v.trim() !== "");
const same = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((item, i) => item === b[i]);

/** Edits a list of values as rows, with keyboard-friendly reordering. */
export function ListEditor({
  label,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  max,
  name,
  validate,
  id,
  disabled,
}: ListEditorProps) {
  const isStatic = useIsStatic();
  const ids = useId();
  const field = useFieldControl({ id, name, disabled });
  const root = useRef<HTMLFieldSetElement>(null);
  const next = useRef(0);
  const make = (items: readonly string[]): Row[] =>
    items.map((item) => ({ key: next.current++, value: item }));
  const [rows, setRows] = useState<Row[]>(() => make(value ?? defaultValue ?? []));
  const focus = useRef<Focus>(null);
  // A new value from outside replaces the rows.
  if (value !== undefined && !same(value, filled(rows))) setRows(make(value));

  useEffect(() => {
    const target = focus.current;
    focus.current = null;
    if (!target || !root.current) return;
    const selector =
      target === "add"
        ? '[data-part="add"]'
        : `[data-row="${target.key}"] ${target.part === "item" ? ITEM : `[data-part="${target.part}"]`}`;
    root.current.querySelector<HTMLElement>(selector)?.focus();
  });

  if (isStatic) {
    return (
      <textarea
        {...field}
        className="t-control t-textarea"
        data-t="list-editor"
        aria-label={label}
        data-options={options ? JSON.stringify(options) : undefined}
        data-placeholder={placeholder}
        data-max={max}
        rows={Math.max(3, (value ?? defaultValue ?? []).length)}
        defaultValue={joinLines(value ?? defaultValue ?? [])}
      />
    );
  }

  const update = (changed: Row[], then: Focus): void => {
    focus.current = then;
    setRows(changed);
    const items = filled(changed);
    if (!same(items, filled(rows))) onValueChange?.(items);
  };
  const add = (): void => {
    const row = { key: next.current++, value: "" };
    update([...rows, row], { key: row.key, part: "item" });
  };
  const used = new Set(rows.map((row) => row.value));

  return (
    <fieldset className="t-list-editor" aria-label={label} ref={root}>
      {rows.length > 0 ? (
        <ul className="t-list-editor-list">
          {rows.map((row, index) => {
            const rowName = `${label} ${index + 1}`;
            const error = row.value.trim() === "" ? undefined : validate?.(row.value);
            const errorId = `${ids}-${row.key}-error`;
            const set = (text: string): void =>
              update(
                rows.map((r) => (r.key === row.key ? { ...r, value: text } : r)),
                null,
              );
            const move = (by: -1 | 1): void => {
              const to = index + by;
              const edge = to === 0 || to === rows.length - 1;
              update(moveItem(rows, index, to), {
                key: row.key,
                part: edge ? (by < 0 ? "down" : "up") : by < 0 ? "up" : "down",
              });
            };
            const remove = (): void => {
              const rest = rows.filter((r) => r.key !== row.key);
              const neighbour = rest[index] ?? rest[index - 1];
              update(rest, neighbour ? { key: neighbour.key, part: "item" } : "add");
            };
            // The row's own state; the props of the field around the editor do not apply to a row.
            const state = {
              "aria-invalid": error ? true : undefined,
              "aria-describedby": error ? errorId : undefined,
            };
            return (
              <li className="t-list-editor-row" key={row.key} data-row={row.key}>
                <BaseField.Root className="t-list-editor-item">
                  {options ? (
                    <Select
                      {...state}
                      id={index === 0 ? field.id : `${ids}-${row.key}`}
                      name=""
                      options={options.map((o) => ({
                        ...o,
                        disabled: o.disabled || (o.value !== row.value && used.has(o.value)),
                      }))}
                      value={row.value || null}
                      onValueChange={set}
                      placeholder={placeholder}
                      disabled={field.disabled}
                      aria-label={rowName}
                    />
                  ) : (
                    <Input
                      {...state}
                      id={index === 0 ? field.id : `${ids}-${row.key}`}
                      name=""
                      value={row.value}
                      onValueChange={set}
                      placeholder={placeholder}
                      disabled={field.disabled}
                      autoComplete="off"
                      aria-label={rowName}
                    />
                  )}
                </BaseField.Root>
                <Button
                  variant="ghost"
                  icon={<Glyph body={arrowUp} />}
                  label={`${t("listMoveUp")} ${rowName}`}
                  data-part="up"
                  disabled={field.disabled || index === 0}
                  onClick={() => move(-1)}
                />
                <Button
                  variant="ghost"
                  icon={<Glyph body={arrowDown} />}
                  label={`${t("listMoveDown")} ${rowName}`}
                  data-part="down"
                  disabled={field.disabled || index === rows.length - 1}
                  onClick={() => move(1)}
                />
                <Button
                  variant="ghost"
                  icon={<Glyph body={trash} />}
                  label={`${t("listRemove")} ${rowName}`}
                  disabled={field.disabled}
                  onClick={remove}
                />
                {error ? (
                  <p className="t-list-editor-error" id={errorId}>
                    <Glyph body={danger} />
                    <span>{error}</span>
                  </p>
                ) : null}
                {field.name && row.value.trim() !== "" ? (
                  <input type="hidden" name={`${field.name}[]`} value={row.value.trim()} />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <Button
        icon={<Glyph body={plus} />}
        data-part="add"
        disabled={field.disabled || !canAdd(rows.length, max)}
        onClick={add}
      >
        {t("listAdd")}
      </Button>
    </fieldset>
  );
}
