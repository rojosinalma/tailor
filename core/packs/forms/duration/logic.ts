/** The units of a duration and the conversions between seconds and a number of one unit. */

export const DURATION_UNITS = ["seconds", "minutes", "hours", "days"] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];

export const UNIT_SECONDS: Readonly<Record<DurationUnit, number>> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

/** The given units in order from small to large, each once; all of them when none is valid. */
export function orderUnits(units: readonly string[] | undefined): DurationUnit[] {
  const picked = DURATION_UNITS.filter((unit) => units?.includes(unit));
  return picked.length > 0 ? picked : [...DURATION_UNITS];
}

/** The largest unit that gives a whole number; the smallest unit for no value, zero or no whole match. */
export function pickUnit(seconds: number | null, units: readonly DurationUnit[]): DurationUnit {
  const ordered = orderUnits(units);
  const smallest = ordered[0] ?? "seconds";
  if (seconds === null || !Number.isFinite(seconds) || seconds === 0) return smallest;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const unit = ordered[i];
    if (unit && seconds % UNIT_SECONDS[unit] === 0) return unit;
  }
  return smallest;
}

/** The number shown for a value in a unit, rounded to two decimals when it is not whole. */
export function toAmount(seconds: number | null, unit: DurationUnit): number | null {
  if (seconds === null || !Number.isFinite(seconds)) return null;
  return Math.round((seconds / UNIT_SECONDS[unit]) * 100) / 100;
}

/** The value in whole seconds of a number in a unit. */
export function toSeconds(amount: number | null, unit: DurationUnit): number | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  return Math.round(amount * UNIT_SECONDS[unit]);
}

/** The limits in seconds as numbers of the unit, inside the limits. */
export function unitBounds(
  unit: DurationUnit,
  min: number | undefined,
  max: number | undefined,
): { min?: number; max?: number } {
  const size = UNIT_SECONDS[unit];
  return {
    min: min === undefined ? undefined : Math.ceil(min / size),
    max: max === undefined ? undefined : Math.floor(max / size),
  };
}

/** The text key of each unit's word. */
export const UNIT_TEXT = {
  seconds: "unitSeconds",
  minutes: "unitMinutes",
  hours: "unitHours",
  days: "unitDays",
} as const satisfies Record<DurationUnit, string>;
