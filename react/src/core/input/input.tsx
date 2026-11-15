import { Input as Base } from "@base-ui/react/input";
import type spec from "@tailor/packs/core/input/spec";
import type { HTMLAttributes, ReactNode } from "react";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface InputProps {
  type?: (typeof spec.props.type)[number];
  size?: (typeof spec.props.size)[number];
  /** A generic example of the expected text, never a value. */
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  /** A glyph, icon or short text inside the box, before the text. */
  before?: ReactNode;
  /** A glyph, icon or short text inside the box, after the text. */
  after?: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** One line of text. */
export function Input({
  type = "text",
  size = "md",
  placeholder,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  disabled,
  readOnly,
  required,
  autoComplete,
  inputMode,
  before,
  after,
  ...aria
}: InputProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  const grouped = before !== undefined || after !== undefined;
  const dataSize = size === "md" ? undefined : size;
  const props = {
    ...field,
    ...aria,
    type,
    placeholder,
    readOnly,
    autoComplete,
    inputMode,
    className: grouped ? "t-input-native" : "t-control t-input",
    "data-size": grouped ? undefined : dataSize,
  };
  const input = isStatic ? (
    <input {...props} defaultValue={value ?? defaultValue} />
  ) : (
    <Base
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next: string) => onValueChange(next) : undefined}
    />
  );
  if (!grouped) return input;
  return (
    <div
      className="t-control t-input-group"
      data-size={dataSize}
      data-invalid={field["aria-invalid"] ? "" : undefined}
      data-disabled={field.disabled ? "" : undefined}
    >
      {before !== undefined ? <span className="t-input-addon">{before}</span> : null}
      {input}
      {after !== undefined ? <span className="t-input-addon">{after}</span> : null}
    </div>
  );
}
