import { Field as BaseField } from "@base-ui/react/field";
import { danger, plus, trash } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  duplicateKeys,
  isSecretKey,
  joinPairs,
  type Pair,
  pastedPairs,
} from "@tailor/packs/forms/key-value-editor/logic";
import { type ClipboardEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { useFieldControl } from "../../core/field/field";
import { Input } from "../../core/input/input";
import { Secret } from "../../core/secret/secret";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export type { Pair };

export interface KeyValueEditorProps {
  /** The accessible name of the editor. */
  label: string;
  value?: readonly Pair[];
  defaultValue?: readonly Pair[];
  /** The pairs without the empty rows. */
  onValueChange?: (pairs: Pair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** Words that mark a secret key, such as ["PASSWORD", "TOKEN"]: the value of such a key is hidden. */
  secretKeys?: readonly string[];
  /** Sends the pairs as one value of KEY=value lines. */
  name?: string;
  id?: string;
  disabled?: boolean;
}

interface Row extends Pair {
  readonly id: number;
}

const filled = (rows: readonly Pair[]): Pair[] =>
  rows.filter((row) => row.key.trim() !== "" || row.value !== "").map(({ key, value }) => ({ key, value }));
const same = (a: readonly Pair[], b: readonly Pair[]): boolean => joinPairs(a) === joinPairs(b);

/** Edits pairs of a key and a value as rows. */
export function KeyValueEditor({
  label,
  value,
  defaultValue,
  onValueChange,
  keyPlaceholder,
  valuePlaceholder,
  secretKeys,
  name,
  id,
  disabled,
}: KeyValueEditorProps) {
  const isStatic = useIsStatic();
  const ids = useId();
  const field = useFieldControl({ id, name, disabled });
  const root = useRef<HTMLFieldSetElement>(null);
  const next = useRef(0);
  const make = (pairs: readonly Pair[]): Row[] => pairs.map((pair) => ({ ...pair, id: next.current++ }));
  const [rows, setRows] = useState<Row[]>(() => make(value ?? defaultValue ?? []));
  const focus = useRef<string | null>(null);
  // A new value from outside replaces the rows.
  if (value !== undefined && !same(value, filled(rows))) setRows(make(value));

  useEffect(() => {
    const target = focus.current;
    focus.current = null;
    if (target) root.current?.querySelector<HTMLElement>(target)?.focus();
  });

  if (isStatic) {
    const pairs = value ?? defaultValue ?? [];
    return (
      <textarea
        {...field}
        className="t-control t-textarea"
        data-t="key-value-editor"
        data-mono=""
        aria-label={label}
        data-key-placeholder={keyPlaceholder}
        data-value-placeholder={valuePlaceholder}
        data-secret-keys={secretKeys?.join(" ")}
        rows={Math.max(3, pairs.length)}
        defaultValue={joinPairs(pairs)}
      />
    );
  }

  const update = (changed: Row[], then: string | null): void => {
    focus.current = then;
    setRows(changed);
    const pairs = filled(changed);
    if (!same(pairs, filled(rows))) onValueChange?.(pairs);
  };
  const add = (): void => {
    const row = { key: "", value: "", id: next.current++ };
    update([...rows, row], `[data-row="${row.id}"] .t-kv-editor-key .t-control`);
  };
  const twice = duplicateKeys(rows);

  return (
    <fieldset className="t-kv-editor" aria-label={label} ref={root}>
      {rows.length > 0 ? (
        <ul className="t-kv-editor-list">
          {rows.map((row, index) => {
            const n = index + 1;
            const errorId = `${ids}-${row.id}-error`;
            const duplicate = twice.has(row.key.trim());
            const set = (change: Partial<Pair>): void =>
              update(
                rows.map((r) => (r.id === row.id ? { ...r, ...change } : r)),
                null,
              );
            const paste = (event: ClipboardEvent<HTMLDivElement>): void => {
              const pairs = pastedPairs(event.clipboardData.getData("text"));
              if (!pairs) return;
              event.preventDefault();
              const added = make(pairs);
              const last = added[added.length - 1];
              update(
                [...rows.slice(0, index), ...added, ...rows.slice(index + 1)],
                last ? `[data-row="${last.id}"] .t-kv-editor-value input` : null,
              );
            };
            const remove = (): void => {
              const rest = rows.filter((r) => r.id !== row.id);
              const neighbour = rest[index] ?? rest[index - 1];
              update(
                rest,
                neighbour ? `[data-row="${neighbour.id}"] .t-kv-editor-key .t-control` : '[data-part="add"]',
              );
            };
            const valueProps = {
              id: `${ids}-${row.id}-value`,
              name: "",
              value: row.value,
              onValueChange: (text: string) => set({ value: text }),
              placeholder: valuePlaceholder,
              disabled: field.disabled,
              "aria-label": `${t("kvValue")} ${n}`,
            };
            return (
              <li className="t-kv-editor-row" key={row.id} data-row={row.id}>
                <BaseField.Root className="t-kv-editor-key" onPaste={paste}>
                  <Input
                    // The row's own state; the props of the field around the editor do not apply to a row.
                    {...{
                      "aria-invalid": duplicate ? true : undefined,
                      "aria-describedby": duplicate ? errorId : undefined,
                    }}
                    id={index === 0 ? field.id : `${ids}-${row.id}-key`}
                    name=""
                    value={row.key}
                    onValueChange={(text) => set({ key: text })}
                    placeholder={keyPlaceholder}
                    disabled={field.disabled}
                    autoComplete="off"
                    aria-label={`${t("kvKey")} ${n}`}
                  />
                </BaseField.Root>
                <BaseField.Root className="t-kv-editor-value">
                  {isSecretKey(row.key, secretKeys) ? (
                    <Secret {...valueProps} />
                  ) : (
                    <Input {...valueProps} autoComplete="off" />
                  )}
                </BaseField.Root>
                <Button
                  variant="ghost"
                  icon={<Glyph body={trash} />}
                  label={`${t("kvRemove")} ${n}`}
                  disabled={field.disabled}
                  onClick={remove}
                />
                {duplicate ? (
                  <p className="t-kv-editor-error" id={errorId}>
                    <Glyph body={danger} />
                    <span>{t("kvDuplicate")}</span>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <Button icon={<Glyph body={plus} />} data-part="add" disabled={field.disabled} onClick={add}>
        {t("listAdd")}
      </Button>
      {field.name ? <input type="hidden" name={field.name} value={joinPairs(rows)} /> : null}
    </fieldset>
  );
}
