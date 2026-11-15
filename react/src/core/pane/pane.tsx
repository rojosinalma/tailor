import type spec from "@tailor/packs/core/pane/spec";
import { type ReactNode, useId } from "react";

interface PaneBase {
  /** The pane actions, at the end of the header. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** "none": the body has no padding, for a table or a list. */
  padding?: (typeof spec.props.padding)[number];
  children?: ReactNode;
}

/** A pane names its body: with a title, or with a label when it shows no title. */
export type PaneProps = PaneBase &
  ({ title: string; label?: undefined } | { title?: undefined; label: string });

/**
 * A box with a fixed header and a body that scrolls. It fills the height of its parent.
 * The body is a named region in the tab order, so the keyboard can scroll it.
 */
export function Pane({ title, label, actions, footer, padding = "default", children }: PaneProps) {
  const id = useId();
  const titleId = `${id}-title`;
  return (
    <div className="t-pane">
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
      <section
        className="t-pane-body"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls takes the focus, so the keyboard can scroll it.
        tabIndex={0}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        data-padding={padding === "default" ? undefined : padding}
      >
        {children}
      </section>
      {footer ? <footer className="t-pane-footer">{footer}</footer> : null}
    </div>
  );
}
