import type spec from "@tailor/packs/core/textarea/spec";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface TextareaProps {
  size?: (typeof spec.props.size)[number];
  /** The height in lines; with autoGrow, the height where the browser cannot follow the content. */
  rows?: number;
  /** Grows with the content up to a maximum height, where the browser supports it. */
  autoGrow?: boolean;
  /** A monospace font, for code, keys and configuration. */
  mono?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** Several lines of text. */
export function Textarea({
  size = "md",
  rows = 3,
  autoGrow,
  mono,
  value,
  defaultValue,
  onValueChange,
  id,
  name,
  disabled,
  required,
  ...rest
}: TextareaProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  return (
    <textarea
      {...field}
      {...rest}
      className="t-control t-textarea"
      data-size={size === "md" ? undefined : size}
      data-auto-grow={autoGrow ? "" : undefined}
      data-mono={mono ? "" : undefined}
      rows={rows}
      value={isStatic ? undefined : value}
      defaultValue={isStatic ? (value ?? defaultValue) : defaultValue}
      onChange={isStatic ? undefined : (event) => onValueChange?.(event.target.value)}
    />
  );
}
