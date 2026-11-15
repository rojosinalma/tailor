import type { ReactNode } from "react";

export interface ToolbarProps {
  /** Filters and search, at the start. */
  start?: ReactNode;
  /** Actions, at the end. In a narrow space they go under the start group. */
  end?: ReactNode;
  /** A single row of controls, when there are no start and end groups. */
  children?: ReactNode;
}

/** One row of controls above content. */
export function Toolbar({ start, end, children }: ToolbarProps) {
  return (
    <div className="t-toolbar">
      {start ? <div className="t-toolbar-start">{start}</div> : null}
      {children}
      {end ? <div className="t-toolbar-end">{end}</div> : null}
    </div>
  );
}
