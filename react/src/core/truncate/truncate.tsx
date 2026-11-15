import type spec from "@tailor/packs/core/truncate/spec";
import type { ReactNode } from "react";

export interface TruncateProps {
  /** The most lines shown; the rest is cut with an ellipsis. */
  lines?: (typeof spec.props.lines)[number];
  children?: ReactNode;
}

/** Text cut to its lines with an ellipsis. The full text stays in the page for screen readers. */
export function Truncate({ lines = "1", children }: TruncateProps) {
  return (
    <span className="t-truncate" data-lines={lines === "1" ? undefined : lines}>
      {children}
    </span>
  );
}
