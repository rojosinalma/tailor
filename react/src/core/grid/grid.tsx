import type spec from "@tailor/packs/core/grid/spec";
import type { ReactNode } from "react";

export interface GridProps {
  /** The least width of a column. */
  min?: (typeof spec.props.min)[number];
  gap?: (typeof spec.props.gap)[number];
  children?: ReactNode;
}

/** Equal columns that fill the row and wrap. */
export function Grid({ min = "xs", gap = "4", children }: GridProps) {
  return (
    <div
      className="t-grid"
      data-min={min === "xs" ? undefined : min}
      data-gap={gap === "4" ? undefined : gap}
    >
      {children}
    </div>
  );
}
