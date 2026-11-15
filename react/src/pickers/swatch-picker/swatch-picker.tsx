import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { check } from "@tailor/core/glyphs.gen";
import type spec from "@tailor/packs/pickers/swatch-picker/spec";
import { type CSSProperties, useId } from "react";
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
  /** The field name in a form. */
  name: string;
  /** The accessible name of the group. */
  label: string;
  size?: (typeof spec.props.size)[number];
  disabled?: boolean;
}

/** The colour of a swatch as the one custom property that its stylesheet reads. */
const swatch = (option: SwatchOption): CSSProperties | undefined => {
  const color = option.token ? `var(--t-${option.token})` : option.color;
  return color ? ({ "--t-swatch": color } as CSSProperties) : undefined;
};

function Content({ option }: { option: SwatchOption }) {
  return (
    <>
      <span className="t-swatches-check" aria-hidden="true">
        <Glyph body={check} />
      </span>
      <span className="t-sr-only">{option.label}</span>
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
}: SwatchPickerProps) {
  const isStatic = useIsStatic();
  const fallback = useId();
  const dataSize = size === "md" ? undefined : size;

  if (isStatic) {
    return (
      <div className="t-swatches" role="radiogroup" aria-label={label} data-size={dataSize}>
        {options.map((option) => (
          <label className="t-swatches-option" key={option.value} style={swatch(option)}>
            <input
              type="radio"
              className="t-swatches-input"
              name={name || fallback}
              value={option.value}
              defaultChecked={option.value === (value ?? defaultValue)}
              disabled={disabled}
            />
            <Content option={option} />
          </label>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      className="t-swatches"
      aria-label={label}
      data-size={dataSize}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange?.(next);
      }}
      name={name}
      disabled={disabled}
    >
      {options.map((option) => (
        <Radio.Root
          className="t-swatches-option"
          key={option.value}
          value={option.value}
          style={swatch(option)}
        >
          <Content option={option} />
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
