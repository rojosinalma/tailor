import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type spec from "@tailor/packs/core/segmented/spec";
import { type ReactNode, useId } from "react";
import { useIsStatic } from "../../kit";

export interface SegmentedOption {
  readonly value: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

export interface SegmentedProps {
  /** Two to five short options. */
  options: readonly SegmentedOption[];
  value?: string;
  /** The first option when neither `value` nor `defaultValue` is set. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The field name in a form. */
  name?: string;
  size?: (typeof spec.props.size)[number];
  /** The accessible name of the control. */
  label: string;
  disabled?: boolean;
}

function Content({ option }: { option: SegmentedOption }) {
  return (
    <>
      {option.icon === undefined ? null : <span className="t-segmented-icon">{option.icon}</span>}
      <span className="t-segmented-label">{option.label}</span>
    </>
  );
}

/** One choice from a few short options, all visible. */
export function Segmented({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  size = "md",
  label,
  disabled,
}: SegmentedProps) {
  const isStatic = useIsStatic();
  const fallbackName = useId();
  const dataSize = size === "md" ? undefined : size;
  const initial = value ?? defaultValue ?? options[0]?.value;

  if (isStatic) {
    return (
      <div
        className="t-segmented"
        role="radiogroup"
        aria-label={label}
        data-size={dataSize}
        data-disabled={disabled ? "" : undefined}
      >
        {options.map((option) => (
          <label className="t-segmented-option" key={option.value}>
            <input
              type="radio"
              className="t-segmented-input"
              name={name ?? fallbackName}
              value={option.value}
              defaultChecked={option.value === initial}
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
      className="t-segmented"
      aria-label={label}
      data-size={dataSize}
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange?.(next);
      }}
      name={name}
      disabled={disabled}
    >
      {options.map((option) => (
        <Radio.Root className="t-segmented-option" key={option.value} value={option.value}>
          <Content option={option} />
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
