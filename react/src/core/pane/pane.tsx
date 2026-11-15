import type spec from "@tailor/packs/core/pane/spec";
import { type ReactNode, useId } from "react";

export interface PaneProps {
  title?: string;
  /** The accessible name of a pane with no title. */
  label?: string;
  /** The pane actions, at the end of the header. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** "none": the body has no padding, for a table or a list. */
  padding?: (typeof spec.props.padding)[number];
  children?: ReactNode;
}

/** A box with a fixed header and a body that scrolls. It fills the height of its parent. */
export function Pane({ title, label, actions, footer, padding = "default", children }: PaneProps) {
  const id = useId();
  const titleId = `${id}-title`;
  return (
    <section
      className="t-pane"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
    >
      {title || actions ? (
        <header className="t-pane-header">
          {title ? (
            <h2 className="t-pane-title" id={titleId}>
              {title}
            </h2>
          ) : null}
          {actions ? <div className="t-pane-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="t-pane-body" data-padding={padding === "default" ? undefined : padding}>
        {children}
      </div>
      {footer ? <footer className="t-pane-footer">{footer}</footer> : null}
    </section>
  );
}
