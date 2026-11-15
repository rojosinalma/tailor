import { OTPField } from "@base-ui/react/otp-field";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/pickers/otp/spec";
import { useId } from "react";
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
  /** The accessible name of the field. */
  label: string;
  disabled?: boolean;
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
  numeric = true,
  autoComplete = "one-time-code",
  size = "md",
  id,
  "aria-describedby": describedBy,
}: OtpFieldProps) {
  const isStatic = useIsStatic();
  const labelId = useId();
  const dataSize = size === "md" ? undefined : size;
  const slots = Array.from({ length }, (_, i) => i);

  if (isStatic) {
    return (
      <input
        className="t-control t-input"
        data-t="otp"
        data-size={dataSize}
        name={name}
        id={id}
        maxLength={length}
        inputMode={numeric ? "numeric" : "text"}
        pattern={numeric ? `\\d{${length}}` : `[a-zA-Z\\d]{${length}}`}
        autoComplete={autoComplete}
        defaultValue={value ?? defaultValue}
        disabled={disabled}
        aria-label={label}
        aria-describedby={describedBy}
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
      name={name}
      id={id}
      disabled={disabled}
      validationType={numeric ? "numeric" : "alphanumeric"}
      autoComplete={autoComplete}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
    >
      <span className="t-sr-only" id={labelId}>
        {label}
      </span>
      {slots.map((i) => (
        <OTPField.Input
          key={i}
          className="t-control t-otp-input"
          aria-labelledby={i === 0 ? labelId : undefined}
          aria-label={i === 0 ? undefined : slotLabel(i, length)}
        />
      ))}
    </OTPField.Root>
  );
}
