import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { check } from "@tailor/core/glyphs.gen";
import type spec from "@tailor/packs/pickers/swatch-picker/spec";
import { type CSSProperties, useId } from "react";
import { useFieldControl, useFieldGroup } from "../../core/field/field";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface SwatchOption {
  readonly value: string;
  /** The name of the colour, read out by a screen reader. */
  readonly label: string;
  /** A free colour, e.g. "#3366cc". Use `token` for a palette colour. */
  readonly color?: string;
  /** A tailor colour token: the swatch follows the palette. */
  readonly token?: (typeof spec.props.token)[number];
}

export interface SwatchPickerProps {
  options: readonly SwatchOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The field name in a form; a Field around it can give it. */
  name?: string;
  /** The accessible name of the group; inside a Field the field's label names it. */
  label?: string;
  size?: (typeof spec.props.size)[number];
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-describedby"?: string;
}

/** The colour of a swatch as the one custom property that its stylesheet reads. */
const swatch = (option: SwatchOption): CSSProperties | undefined => {
  const color = option.token ? `var(--t-${option.token})` : option.color;
  return color ? ({ "--t-swatch": color } as CSSProperties) : undefined;
};

function Content({ option, id }: { option: SwatchOption; id?: string }) {
  return (
    <>
      <span className="t-swatches-check" aria-hidden="true">
        <Glyph body={check} />
      </span>
      <span className="t-sr-only" id={id}>
        {option.label}
      </span>
    </>
  );
}

/** One colour from a fixed set, drawn as swatches. */
export function SwatchPicker({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  label,
  size = "md",
  disabled,
  required,
  id,
  "aria-describedby": describedBy,
}: SwatchPickerProps) {
  const isStatic = useIsStatic();
  const fallback = useId();
  const field = useFieldControl({ id, name, disabled, required, "aria-describedby": describedBy });
  // Inside a Field, its label names the group.
  const inField = useFieldGroup();
  const labelledBy = label ? undefined : inField?.["aria-labelledby"];
  const dataSize = size === "md" ? undefined : size;
  const root = {
    className: "t-swatches",
    id: field.id,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": field["aria-describedby"],
    "aria-invalid": field["aria-invalid"],
    "aria-required": field.required,
    "data-size": dataSize,
  };

  if (isStatic) {
    return (
      <div role="radiogroup" {...root}>
        {options.map((option) => (
          <label className="t-swatches-option" key={option.value} style={swatch(option)}>
            <input
              type="radio"
              className="t-swatches-input"
              name={field.name || fallback}
              value={option.value}
              defaultChecked={option.value === (value ?? defaultValue)}
              disabled={field.disabled}
              required={field.required}
            />
            <Content option={option} />
          </label>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      {...root}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange?.(next);
      }}
      name={field.name}
      disabled={field.disabled}
      required={field.required}
    >
      {options.map((option) => (
        // Inside a Field, Base UI would name each radio by the field's label: each names itself.
        <Radio.Root
          className="t-swatches-option"
          key={option.value}
          value={option.value}
          style={swatch(option)}
          aria-labelledby={`${fallback}-${option.value}`}
        >
          <Content option={option} id={`${fallback}-${option.value}`} />
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
