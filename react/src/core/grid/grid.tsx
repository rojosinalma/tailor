import type spec from "@tailor/packs/core/grid/spec";
import type { ReactNode } from "react";

export interface GridProps {
  /** The least width of a column. */
  min?: (typeof spec.props.min)[number];
  gap?: (typeof spec.props.gap)[number];
  /** For a fixed set, such as a few stats: the children stretch to fill the row, no empty columns stay. */
  fit?: boolean;
  children?: ReactNode;
}

/** Equal columns that fill the row and wrap. */
export function Grid({ min = "xs", gap = "4", fit = false, children }: GridProps) {
  return (
    <div
      className="t-grid"
      data-min={min === "xs" ? undefined : min}
      data-gap={gap === "4" ? undefined : gap}
      data-fit={fit ? "" : undefined}
    >
      {children}
    </div>
  );
}
