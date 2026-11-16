import { Field as BaseField } from "@base-ui/react/field";
import { t } from "@tailor/core/text";
import {
  type DurationUnit,
  orderUnits,
  pickUnit,
  toAmount,
  toSeconds,
  UNIT_TEXT,
  unitBounds,
} from "@tailor/packs/forms/duration/logic";
import type spec from "@tailor/packs/forms/duration/spec";
import { useId, useState } from "react";
import { useFieldControl } from "../../core/field/field";
import { NumberField } from "../../core/number/number";
import { Select } from "../../core/select/select";
import { useIsStatic } from "../../kit";

export interface DurationProps {
  /** The accessible name, also of the unit list ("Timeout unit"). */
  label: string;
  /** The value in seconds. */
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (seconds: number | null) => void;
  /** The units to offer. Default: all four. */
  units?: readonly (typeof spec.props.units)[number][];
  /** The smallest value, in seconds. */
  min?: number;
  /** The largest value, in seconds. */
  max?: number;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

interface Parts {
  amount: number | null;
  unit: DurationUnit;
}

const split = (seconds: number | null, units: readonly DurationUnit[]): Parts => {
  const unit = pickUnit(seconds, units);
  return { amount: toAmount(seconds, unit), unit };
};

/** A length of time: a number and a unit in words. The value is in seconds. */
export function Duration({
  label,
  value,
  defaultValue,
  onValueChange,
  units,
  min,
  max,
  name,
  id,
  disabled,
  required,
}: DurationProps) {
  const isStatic = useIsStatic();
  const own = useId();
  const field = useFieldControl({ id, name, disabled, required });
  const offered = orderUnits(units);
  const [parts, setParts] = useState<Parts>(() => split(value ?? defaultValue ?? null, offered));
  const seconds = toSeconds(parts.amount, parts.unit);
  // A new value from outside shows in its own best unit.
  if (value !== undefined && value !== seconds) setParts(split(value, offered));

  if (isStatic) {
    return (
      <input
        {...field}
        type="number"
        className="t-control t-input"
        data-t="duration"
        data-units={units ? offered.join(" ") : undefined}
        aria-label={label}
        defaultValue={value ?? defaultValue}
        min={min}
        max={max}
      />
    );
  }

  const change = (next: Parts): void => {
    setParts(next);
    const total = toSeconds(next.amount, next.unit);
    if (total !== seconds) onValueChange?.(total);
  };
  const bounds = unitBounds(parts.unit, min, max);
  return (
    <div className="t-duration" data-disabled={field.disabled ? "" : undefined}>
      <NumberField
        id={field.id ?? own}
        name=""
        value={parts.amount}
        onValueChange={(amount) => change({ ...parts, amount })}
        min={bounds.min}
        max={bounds.max}
        disabled={field.disabled}
        required={field.required}
        aria-label={label}
      />
      {/* Its own Base UI field, so that the field around the duration labels the number only. */}
      <BaseField.Root className="t-duration-unit">
        <Select
          id={`${field.id ?? own}-unit`}
          name=""
          options={offered.map((unit) => ({ value: unit, label: t(UNIT_TEXT[unit]) }))}
          value={parts.unit}
          onValueChange={(next) => {
            const unit = offered.find((u) => u === next);
            if (unit) change({ ...parts, unit });
          }}
          disabled={field.disabled}
          aria-label={`${label} ${t("durationUnit")}`}
        />
      </BaseField.Root>
      {field.name ? <input type="hidden" name={field.name} value={seconds ?? ""} /> : null}
    </div>
  );
}
