import type spec from "@tailor/packs/core/status-dot/spec";

export interface StatusDotProps {
  tone?: (typeof spec.props.tone)[number];
  /** The state in words: hidden text, or visible with showLabel. */
  label: string;
  showLabel?: boolean;
  /** A slow pulse for a state in progress. It stops when the device asks for reduced motion. */
  pulse?: boolean;
}

/** A small dot for a live state, next to a name. */
export function StatusDot({ tone = "neutral", label, showLabel, pulse }: StatusDotProps) {
  return (
    <span className="t-dot" data-tone={tone} data-pulse={pulse ? "" : undefined}>
      <span className={showLabel ? "t-dot-label" : "t-sr-only"}>{label}</span>
    </span>
  );
}
