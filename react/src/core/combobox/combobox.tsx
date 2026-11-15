import { Combobox as Base } from "@base-ui/react/combobox";
import { check, chevronExpand, clear } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { customText } from "@tailor/packs/core/combobox/logic";
import type spec from "@tailor/packs/core/combobox/spec";
import { type KeyboardEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  /** A line under the label. */
  readonly description?: string;
  readonly disabled?: boolean;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  /** A generic example of what to type, never a value. */
  placeholder?: string;
  name?: string;
  id?: string;
  size?: (typeof spec.props.size)[number];
  disabled?: boolean;
  required?: boolean;
  /** Enter on text that matches no choice keeps that text as the value. */
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

/** On a phone the list is a sheet over the lower part of the screen: the box moves to the top to stay in view. */
const keepInView = (box: HTMLElement | null): void => {
  if (box && matchMedia("(max-width: 40rem)").matches) box.scrollIntoView({ block: "start" });
};

/** The parts of one choice. */
function OptionContent({ option }: { option: ComboboxOption }) {
  return (
    <>
      <span className="t-option-check">
        <Base.ItemIndicator>
          <Glyph body={check} />
        </Base.ItemIndicator>
      </span>
      <span className="t-option-label">
        {option.label}
        {option.description ? <span className="t-combobox-description">{option.description}</span> : null}
      </span>
    </>
  );
}

/** The list surface. */
function ComboboxPopup({
  loading,
  children,
}: {
  loading?: boolean;
  children: (option: ComboboxOption) => ReactNode;
}) {
  return (
    <Base.Portal>
      <Base.Positioner className="t-popup-positioner" sideOffset={4}>
        <Base.Popup className="t-popup t-combobox-popup">
          <Base.Status className="t-combobox-status">
            {loading ? (
              <>
                <span className="t-spinner" data-size="sm" aria-hidden="true" />
                {t("loading")}
              </>
            ) : null}
          </Base.Status>
          {loading ? null : <Base.Empty className="t-combobox-empty">{t("noResults")}</Base.Empty>}
          <Base.List className="t-listbox">{children}</Base.List>
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

/** Picks one value from a known set by typing to filter it. */
export function Combobox({
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
  allowCustom,
  loading,
  onInputChange,
  filter = true,
  ...aria
}: ComboboxProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  const dataSize = size === "md" ? undefined : size;
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const current = value !== undefined ? value : inner;
  // Values typed with allowCustom become choices of their own.
  const [custom, setCustom] = useState<ComboboxOption[]>(() =>
    current && !options.some((o) => o.value === current) ? [{ value: current, label: current }] : [],
  );
  const all = useMemo(() => [...options, ...custom], [options, custom]);
  const items = useMemo(
    () => Base.createItems(all, { getValue: (o) => o.value, getLabel: (o) => o.label }),
    [all],
  );
  const text = useRef("");
  const box = useRef<HTMLDivElement>(null);
  const highlighted = useRef<string | undefined>(undefined);

  const set = (next: string | null): void => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  if (isStatic) {
    return (
      <select
        {...field}
        {...aria}
        className="t-control t-select"
        data-t="combobox"
        data-size={dataSize}
        data-placeholder={placeholder}
        data-allow-custom={allowCustom ? "" : undefined}
        data-loading={loading ? "" : undefined}
        defaultValue={current ?? ""}
      >
        <option value="">{placeholder}</option>
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
    if (!allowCustom || event.key !== "Enter" || highlighted.current !== undefined) return;
    const typed = customText(text.current, all);
    if (typed === null) return;
    event.preventDefault();
    setCustom((list) => [...list, { value: typed, label: typed }]);
    set(typed);
  };

  return (
    <Base.Root
      items={items}
      value={current}
      onValueChange={(next: string | null) => set(next)}
      onInputValueChange={(next: string) => {
        text.current = next;
        onInputChange?.(next);
      }}
      onItemHighlighted={(next: string | undefined) => {
        highlighted.current = next;
      }}
      filter={filter ? undefined : null}
      onOpenChange={(open: boolean) => {
        if (open) keepInView(box.current);
      }}
      name={field.name}
      disabled={field.disabled}
      required={field.required}
    >
      <Base.InputGroup
        ref={box}
        className="t-control t-input-group t-combobox"
        data-size={dataSize}
        data-invalid={field["aria-invalid"] ? "" : undefined}
        data-disabled={field.disabled ? "" : undefined}
      >
        <Base.Input
          className="t-input-native"
          id={field.id}
          placeholder={placeholder}
          aria-invalid={field["aria-invalid"]}
          aria-describedby={field["aria-describedby"]}
          onKeyDown={onKeyDown}
          {...aria}
        />
        <Base.Clear className="t-input-action t-combobox-clear" aria-label={t("clear")}>
          <Glyph body={clear} />
        </Base.Clear>
        <Base.Trigger className="t-input-action t-combobox-trigger" aria-label={t("showOptions")}>
          <Glyph body={chevronExpand} />
        </Base.Trigger>
      </Base.InputGroup>
      <ComboboxPopup loading={loading}>
        {(option) => (
          <Base.Item key={option.value} value={option.value} disabled={option.disabled} className="t-option">
            <OptionContent option={option} />
          </Base.Item>
        )}
      </ComboboxPopup>
    </Base.Root>
  );
}
