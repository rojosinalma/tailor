import { Combobox as Base } from "@base-ui/react/combobox";
import { check, chevronExpand, close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { customText } from "@tailor/packs/core/combobox/logic";
import type spec from "@tailor/packs/core/multi-select/spec";
import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import type { ComboboxOption } from "../combobox/combobox";
import { useFieldControl } from "../field/field";

export interface MultiSelectProps {
  options: readonly ComboboxOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** A generic example of what to type, never a value. Shown while nothing is picked. */
  placeholder?: string;
  /** The form name: the form gets one entry per picked value. */
  name?: string;
  id?: string;
  size?: (typeof spec.props.size)[number];
  disabled?: boolean;
  required?: boolean;
  /** The most values that can be picked. */
  max?: number;
  /** Enter on text that matches no choice adds that text as a value. */
  allowCustom?: boolean;
  /** Shows a loading line in the list, while the choices load. */
  loading?: boolean;
  /** The typed text, so the caller can load choices. */
  onInputChange?: (text: string) => void;
  /** false: the list shows the options as given; filtering is the caller's job. */
  filter?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Picks several values from a known set by typing to filter; the values show as chips. */
export function MultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = t("nothingSelected"),
  name,
  id,
  size = "md",
  disabled,
  required,
  max,
  allowCustom,
  loading,
  onInputChange,
  filter = true,
  ...aria
}: MultiSelectProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  const dataSize = size === "md" ? undefined : size;
  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const current = value ?? inner;
  // Values typed with allowCustom become choices of their own.
  const [custom, setCustom] = useState<ComboboxOption[]>(() =>
    current.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v, label: v })),
  );
  const all = useMemo(() => [...options, ...custom], [options, custom]);
  const full = max !== undefined && current.length >= max;
  const items = useMemo(
    () => Base.createItems(all, { getValue: (o) => o.value, getLabel: (o) => o.label }),
    [all],
  );
  const shown = all.map((o) => o.value).filter((v) => current.includes(v));
  const labelOf = (v: string): string => all.find((o) => o.value === v)?.label ?? v;
  const text = useRef("");
  const highlighted = useRef<string | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);

  // The values keep the order of the options, as a native select keeps them in the HTML kit.
  const set = (next: string[]): void => {
    const ordered = all.map((o) => o.value).filter((v) => next.includes(v));
    if (value === undefined) setInner(ordered);
    onValueChange?.(ordered);
  };

  if (isStatic) {
    return (
      <select
        {...field}
        {...aria}
        multiple
        className="t-control"
        data-t="multi-select"
        data-size={dataSize}
        data-placeholder={placeholder}
        data-max={max}
        data-allow-custom={allowCustom ? "" : undefined}
        data-loading={loading ? "" : undefined}
        defaultValue={current}
      >
        {all.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            data-description={option.description}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!allowCustom || full || event.key !== "Enter" || highlighted.current !== undefined) return;
    const typed = customText(text.current, all);
    if (typed === null) return;
    event.preventDefault();
    setCustom((list) => [...list, { value: typed, label: typed }]);
    // The new choice is not in the options yet when set() orders the values.
    const next = [...current, typed];
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  return (
    <Base.Root
      items={items}
      multiple
      value={current}
      onValueChange={(next: string[]) => set(max === undefined ? next : next.slice(0, max))}
      onInputValueChange={(next: string) => {
        text.current = next;
        onInputChange?.(next);
      }}
      onItemHighlighted={(next: string | undefined) => {
        highlighted.current = next;
      }}
      onOpenChange={(open: boolean, details: Base.Root.OpenChangeEventDetails) => {
        // The list stays open while picking.
        if (!open && details.reason === "item-press") details.cancel();
        if (open && box.current && matchMedia("(max-width: 40rem)").matches)
          box.current.scrollIntoView({ block: "start" });
      }}
      filter={filter ? undefined : null}
      disabled={field.disabled}
      required={field.required}
    >
      <Base.InputGroup
        ref={box}
        className="t-control t-multi-select"
        data-size={dataSize}
        data-invalid={field["aria-invalid"] ? "" : undefined}
        data-disabled={field.disabled ? "" : undefined}
      >
        <Base.Chips className="t-multi-select-chips">
          {shown.map((v) => {
            const label = labelOf(v);
            return (
              <Base.Chip key={v} className="t-chip">
                <span className="t-chip-label">{label}</span>
                <Base.ChipRemove
                  className="t-chip-remove"
                  aria-label={t("removeItem").replace("{label}", label)}
                >
                  <Glyph body={close} />
                </Base.ChipRemove>
              </Base.Chip>
            );
          })}
          <Base.Input
            className="t-multi-select-input"
            id={field.id}
            placeholder={current.length > 0 ? undefined : placeholder}
            aria-invalid={field["aria-invalid"]}
            aria-describedby={field["aria-describedby"]}
            onKeyDown={onKeyDown}
            {...aria}
          />
        </Base.Chips>
        <Base.Trigger className="t-input-action t-multi-select-trigger" aria-label={t("showOptions")}>
          <Glyph body={chevronExpand} />
        </Base.Trigger>
      </Base.InputGroup>
      {field.name ? shown.map((v) => <input key={v} type="hidden" name={field.name} value={v} />) : null}
      <Base.Portal>
        <Base.Positioner className="t-popup-positioner" sideOffset={4}>
          <Base.Popup className="t-popup t-multi-select-popup">
            <Base.Status className="t-multi-select-status">
              {loading ? (
                <>
                  <span className="t-spinner" data-size="sm" aria-hidden="true" />
                  {t("loading")}
                </>
              ) : null}
            </Base.Status>
            {loading ? null : <Base.Empty className="t-multi-select-empty">{t("noResults")}</Base.Empty>}
            <Base.List className="t-listbox">
              {(option: ComboboxOption) => (
                <Base.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled || (full && !current.includes(option.value))}
                  className="t-option"
                >
                  <span className="t-option-check">
                    <Base.ItemIndicator>
                      <Glyph body={check} />
                    </Base.ItemIndicator>
                  </span>
                  <span className="t-option-label">
                    {option.label}
                    {option.description ? (
                      <span className="t-multi-select-description">{option.description}</span>
                    ) : null}
                  </span>
                </Base.Item>
              )}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
