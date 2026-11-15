import { Checkbox } from "@base-ui/react/checkbox";
import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { createContext, type ReactNode, use, useId } from "react";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

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

// In static mode the group's value decides which boxes start ticked.
const GroupValue = createContext<readonly string[] | undefined>(undefined);

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
  const group = use(GroupValue);
  const ids = useId();
  const labelId = `${ids}-label`;
  const descriptionId = description ? `${ids}-description` : undefined;
  const field = useFieldControl({ name, disabled, required, "aria-describedby": descriptionId });
  const props = {
    ...field,
    id,
    value,
    className: "t-check-input",
    "aria-labelledby": description ? labelId : undefined,
  };
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the checkbox is inside the label, native or from Base UI.
    <label className="t-check">
      {isStatic ? (
        <input
          {...props}
          type="checkbox"
          defaultChecked={checked ?? defaultChecked ?? (value !== undefined && group?.includes(value))}
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
  /** The legend of the group. */
  label: ReactNode;
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
  const legend = (
    <legend className="t-check-group-label" id={legendId}>
      {label}
    </legend>
  );
  if (isStatic) {
    return (
      <fieldset className="t-check-group" disabled={disabled}>
        {legend}
        <GroupValue value={value ?? defaultValue}>{children}</GroupValue>
      </fieldset>
    );
  }
  return (
    <CheckboxGroup
      render={<fieldset />}
      className="t-check-group"
      aria-labelledby={legendId}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next: string[]) => onValueChange(next) : undefined}
      disabled={disabled}
    >
      {legend}
      {children}
    </CheckboxGroup>
  );
}
