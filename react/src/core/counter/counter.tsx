import type spec from "@tailor/packs/core/counter/spec";

export interface CounterProps {
  tone?: (typeof spec.props.tone)[number];
  value: number;
  /** The highest number shown; a higher value shows as "max+". */
  max?: number;
}

/** A number in a small pill, for counts in navigation and tabs. */
export function Counter({ tone = "neutral", value, max }: CounterProps) {
  return (
    <span className="t-counter" data-tone={tone}>
      {max !== undefined && value > max ? `${max}+` : value}
    </span>
  );
}
