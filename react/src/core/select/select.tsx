import { Select as Base } from "@base-ui/react/select";
import { check, chevronExpand } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/select/spec";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps {
  options: readonly SelectOption[];
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shown while no value is set. */
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  size?: (typeof spec.props.size)[number];
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = t("nothingSelected"),
  name,
  id,
  disabled,
  required,
  size = "md",
  ...aria
}: SelectProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  const describe = { "aria-invalid": field["aria-invalid"], "aria-describedby": field["aria-describedby"] };
  const dataSize = size === "md" ? undefined : size;

  if (isStatic) {
    return (
      <select
        className="t-control t-select"
        data-t="select"
        data-size={dataSize}
        data-placeholder={placeholder}
        {...field}
        defaultValue={value ?? defaultValue ?? ""}
        {...aria}
      >
        <option value="" hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Base.Root
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next: string | null) => {
        if (next !== null) onValueChange?.(next);
      }}
      name={field.name}
      id={field.id}
      disabled={field.disabled}
      required={field.required}
    >
      <Base.Trigger className="t-control t-select-trigger" data-size={dataSize} {...describe} {...aria}>
        <Base.Value className="t-select-value" placeholder={placeholder} />
        <Base.Icon className="t-select-icon">
          <Glyph body={chevronExpand} />
        </Base.Icon>
      </Base.Trigger>
      <Base.Portal>
        <Base.Positioner className="t-popup-positioner" sideOffset={4} alignItemWithTrigger={false}>
          <Base.Popup className="t-popup t-select-popup">
            <Base.List className="t-listbox">
              {options.map((option) => (
                <Base.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="t-option"
                >
                  <span className="t-option-check">
                    <Base.ItemIndicator>
                      <Glyph body={check} />
                    </Base.ItemIndicator>
                  </span>
                  <Base.ItemText className="t-option-label">{option.label}</Base.ItemText>
                </Base.Item>
              ))}
            </Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
