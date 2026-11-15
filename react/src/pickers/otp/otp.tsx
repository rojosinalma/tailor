import { OTPField } from "@base-ui/react/otp-field";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/pickers/otp/spec";
import { useId } from "react";
import { useFieldControl } from "../../core/field/field";
import { useIsStatic } from "../../kit";

export interface OtpFieldProps {
  /** The number of characters. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Runs when every box is filled. */
  onComplete?: (value: string) => void;
  name?: string;
  /** The accessible name of the code; inside a Field the field's label names it. */
  label?: string;
  disabled?: boolean;
  required?: boolean;
  /** Digits only, with the number keyboard on a phone. Off: letters and digits. */
  numeric?: boolean;
  autoComplete?: string;
  size?: (typeof spec.props.size)[number];
  id?: string;
  "aria-describedby"?: string;
}

/** The accessible name of one box after the first. */
export const slotLabel = (index: number, length: number): string =>
  `${t("otpCharacter")} ${index + 1} ${t("of")} ${length}`;

/** A one-time code of `length` characters, one box each. */
export function OtpField({
  length = 6,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  name,
  label,
  disabled,
  required,
  numeric = true,
  autoComplete = "one-time-code",
  size = "md",
  id,
  "aria-describedby": describedBy,
}: OtpFieldProps) {
  const isStatic = useIsStatic();
  const labelId = useId();
  const field = useFieldControl({ id, name, disabled, required, "aria-describedby": describedBy });
  // Inside a Field, Base UI names the boxes from the field's label; outside, the own label does.
  const own = label ? labelId : undefined;
  const dataSize = size === "md" ? undefined : size;
  const slots = Array.from({ length }, (_, i) => i);

  if (isStatic) {
    return (
      <input
        className="t-control t-input"
        data-t="otp"
        data-size={dataSize}
        {...field}
        maxLength={length}
        inputMode={numeric ? "numeric" : "text"}
        pattern={numeric ? `\\d{${length}}` : `[a-zA-Z\\d]{${length}}`}
        autoComplete={autoComplete}
        defaultValue={value ?? defaultValue}
        aria-label={label}
      />
    );
  }

  return (
    <OTPField.Root
      className="t-otp"
      data-size={dataSize}
      length={length}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      onValueComplete={(next) => onComplete?.(next)}
      name={field.name}
      id={field.id}
      disabled={field.disabled}
      required={field.required}
      validationType={numeric ? "numeric" : "alphanumeric"}
      autoComplete={autoComplete}
      aria-labelledby={own}
      aria-describedby={field["aria-describedby"]}
    >
      {label ? (
        <span className="t-sr-only" id={labelId}>
          {label}
        </span>
      ) : null}
      {slots.map((i) => (
        <OTPField.Input
          key={i}
          className="t-control t-otp-input"
          aria-labelledby={i === 0 ? own : undefined}
          aria-label={i === 0 ? undefined : slotLabel(i, length)}
          aria-describedby={i === 0 ? field["aria-describedby"] : undefined}
          aria-invalid={field["aria-invalid"]}
        />
      ))}
    </OTPField.Root>
  );
}
