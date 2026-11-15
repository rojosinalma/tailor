import { sparkPaths } from "@tailor/packs/core/sparkline/logic";
import type spec from "@tailor/packs/core/sparkline/spec";

export interface SparklineProps {
  values: readonly number[];
  /** The accessible name, with what the line shows: "Requests per minute, last hour". */
  label: string;
  tone?: (typeof spec.props.tone)[number];
  /** Fills the area under the line. */
  area?: boolean;
  size?: (typeof spec.props.size)[number];
}

/** A small line chart from values, as wide as its container. */
export function Sparkline({ values, label, tone, area = false, size = "md" }: SparklineProps) {
  const paths = sparkPaths(values);
  return (
    <svg
      className="t-sparkline"
      role="img"
      aria-label={label}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      data-tone={tone}
      data-size={size === "md" ? undefined : size}
    >
      {paths && area ? <path className="t-sparkline-area" d={paths.area} /> : null}
      {paths ? <path className="t-sparkline-line" d={paths.line} /> : null}
    </svg>
  );
}
