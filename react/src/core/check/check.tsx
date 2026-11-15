import { Checkbox } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { createContext, type ReactNode, use, useId } from "react";
import { useIsStatic } from "../../kit";
import { useFieldControl, useFieldGroup } from "../field/field";

export interface CheckProps {
  label: ReactNode;
  /** A line under the label. */
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Neither ticked nor unticked: a parent box whose children are partly ticked. */
  indeterminate?: boolean;
  name?: string;
  /** The value sent with the form, and the id of the box inside a CheckGroup. */
  value?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

// Set inside a CheckGroup. In static mode the group's value decides which boxes start ticked.
const Group = createContext<{ values?: readonly string[] } | null>(null);

/** A checkbox with its label. The whole label is the hit area. */
export function Check({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate,
  name,
  value,
  id,
  disabled,
  required,
}: CheckProps) {
  const isStatic = useIsStatic();
  const group = use(Group);
  const ids = useId();
  const labelId = `${ids}-label`;
  const descriptionId = description ? `${ids}-description` : undefined;
  const own = { name, disabled, required, "aria-describedby": descriptionId };
  const fromField = useFieldControl(own);
  // In a group, the field describes the group, not each box.
  const field = group ? own : fromField;
  const props = {
    ...field,
    id,
    value,
    className: "t-check-input",
    "aria-labelledby": labelId,
  };
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the checkbox is inside the label, native or from Base UI.
    <label className="t-check">
      {isStatic ? (
        <input
          {...props}
          type="checkbox"
          defaultChecked={
            checked ?? defaultChecked ?? (value !== undefined && group?.values?.includes(value))
          }
          data-t={indeterminate ? "check" : undefined}
          data-indeterminate={indeterminate ? "" : undefined}
        />
      ) : (
        <Checkbox.Root
          {...props}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange ? (next: boolean) => onCheckedChange(next) : undefined}
          indeterminate={indeterminate}
        />
      )}
      <span className="t-check-label" id={labelId}>
        {label}
      </span>
      {description ? (
        <span className="t-check-description" id={descriptionId}>
          {description}
        </span>
      ) : null}
    </label>
  );
}

export interface CheckGroupProps {
  /** The legend of the group. Inside a Field, the field's label names the group instead. */
  label?: ReactNode;
  /** The values of the ticked boxes. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  /** Check elements, each with a value. */
  children: ReactNode;
}

/** A labelled group of related checkboxes. */
export function CheckGroup({
  label,
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: CheckGroupProps) {
  const isStatic = useIsStatic();
  const legendId = useId();
  // In a field, the field's label names the group and its help and error describe it.
  const field = useFieldGroup();
  const groupDisabled = disabled || field?.disabled;
  const legend = field ? null : (
    <legend className="t-check-group-label" id={legendId}>
      {label}
    </legend>
  );
  const groupProps = {
    className: "t-check-group",
    id: field?.id,
    "aria-labelledby": field ? field["aria-labelledby"] : legendId,
    "aria-describedby": field?.["aria-describedby"],
    "aria-invalid": field?.["aria-invalid"],
  };
  const boxes = <Group value={{ values: value ?? defaultValue }}>{children}</Group>;
  if (isStatic) {
    return (
      <fieldset {...groupProps} disabled={groupDisabled}>
        {legend}
        {boxes}
      </fieldset>
    );
  }
  return (
    <CheckboxGroup
      render={<fieldset />}
      {...groupProps}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next: string[]) => onValueChange(next) : undefined}
      disabled={groupDisabled}
    >
      {legend}
      {boxes}
    </CheckboxGroup>
  );
}
