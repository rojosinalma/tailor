import { Radio } from "@base-ui/react/radio";
import { RadioGroup as Base } from "@base-ui/react/radio-group";
import type spec from "@tailor/packs/core/radio/spec";
import { type ReactNode, useId } from "react";
import { useIsStatic } from "../../kit";

export interface RadioOption {
  readonly value: string;
  readonly label: ReactNode;
  /** A line under the label. */
  readonly description?: ReactNode;
  readonly disabled?: boolean;
}

export interface RadioGroupProps {
  /** The legend of the group. */
  label: ReactNode;
  name?: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: (typeof spec.props.orientation)[number];
  disabled?: boolean;
  required?: boolean;
}

/** One choice from a few options that are all visible. */
export function RadioGroup({
  label,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  orientation = "vertical",
  disabled,
  required,
}: RadioGroupProps) {
  const isStatic = useIsStatic();
  const ids = useId();
  const dataOrientation = orientation === "vertical" ? undefined : orientation;
  const legend = (
    <legend className="t-radio-group-label" id={`${ids}-legend`}>
      {label}
    </legend>
  );
  const items = options.map((option, index) => {
    const labelId = `${ids}-${index}`;
    const descriptionId = option.description ? `${ids}-${index}-description` : undefined;
    const props = {
      className: "t-radio-input",
      value: option.value,
      disabled: option.disabled,
      "aria-labelledby": descriptionId ? labelId : undefined,
      "aria-describedby": descriptionId,
    };
    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: the radio is inside the label, native or from Base UI.
      <label className="t-radio" key={option.value}>
        {isStatic ? (
          <input
            {...props}
            type="radio"
            name={name}
            required={required}
            defaultChecked={(value ?? defaultValue) === option.value}
          />
        ) : (
          <Radio.Root {...props} />
        )}
        <span className="t-radio-label" id={labelId}>
          {option.label}
        </span>
        {option.description ? (
          <span className="t-radio-description" id={descriptionId}>
            {option.description}
          </span>
        ) : null}
      </label>
    );
  });

  if (isStatic) {
    return (
      <fieldset
        className="t-radio-group"
        aria-labelledby={`${ids}-legend`}
        data-orientation={dataOrientation}
        disabled={disabled}
      >
        {legend}
        {items}
      </fieldset>
    );
  }
  return (
    <Base
      render={<fieldset />}
      className="t-radio-group"
      aria-labelledby={`${ids}-legend`}
      data-orientation={dataOrientation}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next: unknown) => onValueChange(String(next)) : undefined}
      disabled={disabled}
      required={required}
    >
      {legend}
      {items}
    </Base>
  );
}
