import type spec from "@tailor/packs/core/mini-bars/spec";
import type { CSSProperties } from "react";

export interface MiniBarsProps {
  values: readonly number[];
  /** The value of a full bar. By default the highest value. */
  max?: number;
  /** The accessible name, with what the bars show: "Load per core of web-1". */
  label: string;
  tone?: (typeof spec.props.tone)[number];
  size?: (typeof spec.props.size)[number];
}

/** A small bar chart from values, as wide as its container. */
export function MiniBars({ values, max, label, tone, size = "md" }: MiniBarsProps) {
  const top = max ?? Math.max(0, ...values.filter(Number.isFinite));
  const percent = (v: number): number =>
    top > 0 && Number.isFinite(v) ? Math.round(Math.min(1, Math.max(0, v / top)) * 1000) / 10 : 0;
  return (
    <div
      className="t-minibars"
      role="img"
      aria-label={label}
      data-tone={tone}
      data-size={size === "md" ? undefined : size}
    >
      {values.map((v, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: a bar is its place in the list.
          key={i}
          className="t-minibars-bar"
          // The one inline style the chart allows: its height as a single custom property.
          style={{ "--t-value": `${percent(v)}%` } as CSSProperties}
        />
      ))}
    </div>
  );
}
