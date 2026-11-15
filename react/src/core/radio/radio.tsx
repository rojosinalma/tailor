import { Radio } from "@base-ui/react/radio";
import { RadioGroup as Base } from "@base-ui/react/radio-group";
import type spec from "@tailor/packs/core/radio/spec";
import { type ReactNode, useId } from "react";
import { useIsStatic } from "../../kit";
import { useFieldGroup } from "../field/field";

export interface RadioOption {
  readonly value: string;
  readonly label: ReactNode;
  /** A line under the label. */
  readonly description?: ReactNode;
  readonly disabled?: boolean;
}

export interface RadioGroupProps {
  /** The legend of the group. Inside a Field, the field's label names the group instead. */
  label?: ReactNode;
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
  // In a field, the field's label names the group and its help and error describe it.
  const field = useFieldGroup();
  const groupName = name ?? field?.name;
  const groupDisabled = disabled || field?.disabled;
  const groupRequired = required || field?.required;
  const dataOrientation = orientation === "vertical" ? undefined : orientation;
  const legend = field ? null : (
    <legend className="t-radio-group-label" id={`${ids}-legend`}>
      {label}
    </legend>
  );
  const groupProps = {
    className: "t-radio-group",
    id: field?.id,
    "aria-labelledby": field ? field["aria-labelledby"] : `${ids}-legend`,
    "aria-describedby": field?.["aria-describedby"],
    "aria-invalid": field?.["aria-invalid"],
    "data-orientation": dataOrientation,
  };
  const items = options.map((option, index) => {
    const labelId = `${ids}-${index}`;
    const descriptionId = option.description ? `${ids}-${index}-description` : undefined;
    const props = {
      className: "t-radio-input",
      value: option.value,
      disabled: option.disabled,
      "aria-labelledby": labelId,
      "aria-describedby": descriptionId,
    };
    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: the radio is inside the label, native or from Base UI.
      <label className="t-radio" key={option.value}>
        {isStatic ? (
          <input
            {...props}
            type="radio"
            name={groupName}
            required={groupRequired}
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
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the same role as the Base UI group in the React kit.
      <fieldset {...groupProps} role="radiogroup" disabled={groupDisabled}>
        {legend}
        {items}
      </fieldset>
    );
  }
  return (
    <Base
      render={<fieldset />}
      {...groupProps}
      name={groupName}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next: unknown) => onValueChange(String(next)) : undefined}
      disabled={groupDisabled}
      required={groupRequired}
    >
      {legend}
      {items}
    </Base>
  );
}
