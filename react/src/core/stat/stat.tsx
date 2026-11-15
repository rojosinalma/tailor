import type spec from "@tailor/packs/core/stat/spec";
import type { ReactNode } from "react";
import { AppLink } from "../../link";

export interface StatProps {
  /** What the number means. */
  label: string;
  value: ReactNode;
  /** Context: a change or a unit. */
  sub?: ReactNode;
  /** Colours the value. */
  tone?: (typeof spec.props.tone)[number];
  /** A small chart at the bottom. */
  chart?: ReactNode;
  /** Makes the whole stat a link to this address. */
  to?: string;
}

/** One number with its meaning, for dashboards. */
export function Stat({ label, value, sub, tone, chart, to }: StatProps) {
  return (
    <div className="t-stat" data-tone={tone}>
      <div className="t-stat-label">
        {to !== undefined ? (
          <AppLink to={to} className="t-stat-link">
            {label}
          </AppLink>
        ) : (
          label
        )}
      </div>
      <div className="t-stat-value">{value}</div>
      {sub !== undefined ? <div className="t-stat-sub">{sub}</div> : null}
      {chart !== undefined ? <div className="t-stat-chart">{chart}</div> : null}
    </div>
  );
}
