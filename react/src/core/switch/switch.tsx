import { Switch as Base } from "@base-ui/react/switch";
import { type ReactNode, useId } from "react";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface SwitchProps {
  label: ReactNode;
  /** A line under the label. */
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  /** The value sent with the form while on. */
  value?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

/** An on/off setting that applies at once. The whole label is the hit area. */
export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  value,
  id,
  disabled,
  required,
}: SwitchProps) {
  const isStatic = useIsStatic();
  const ids = useId();
  const labelId = `${ids}-label`;
  const descriptionId = description ? `${ids}-description` : undefined;
  const field = useFieldControl({ name, disabled, required, "aria-describedby": descriptionId });
  const props = {
    ...field,
    id,
    className: "t-switch-input",
    "aria-labelledby": description ? labelId : undefined,
  };
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the switch is inside the label, native or from Base UI.
    <label className="t-switch">
      {isStatic ? (
        <input
          {...props}
          type="checkbox"
          // biome-ignore lint/a11y/useAriaPropsForRole: a native checkbox gives the switch its checked state.
          role="switch"
          value={value}
          defaultChecked={checked ?? defaultChecked}
        />
      ) : (
        <Base.Root
          {...props}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange ? (next: boolean) => onCheckedChange(next) : undefined}
        >
          <Base.Thumb className="t-switch-thumb" />
        </Base.Root>
      )}
      <span className="t-switch-label" id={labelId}>
        {label}
      </span>
      {description ? (
        <span className="t-switch-description" id={descriptionId}>
          {description}
        </span>
      ) : null}
    </label>
  );
}
