import type spec from "@tailor/packs/core/card/spec";
import type { ReactNode } from "react";
import { AppLink } from "../../link";

interface CardBase {
  description?: ReactNode;
  /** Buttons at the end of the header. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** "none" lets a table or a list run from edge to edge. */
  padding?: (typeof spec.props.padding)[number];
  /** A thin edge in the tone at the start. */
  tone?: (typeof spec.props.tone)[number];
  selected?: boolean;
  children?: ReactNode;
}

interface PlainCard extends CardBase {
  title?: ReactNode;
  to?: never;
}

interface LinkCard extends CardBase {
  title: ReactNode;
  /** Makes the whole card a link to this address. Buttons inside stay clickable. */
  to: string;
}

export type CardProps = PlainCard | LinkCard;

/** A raised surface that groups content. */
export function Card({
  title,
  to,
  description,
  actions,
  footer,
  padding = "default",
  tone,
  selected,
  children,
}: CardProps) {
  const header = title !== undefined || description !== undefined || actions !== undefined;
  return (
    <div
      className="t-card"
      data-padding={padding === "default" ? undefined : padding}
      data-tone={tone}
      data-selected={selected ? "" : undefined}
    >
      {header ? (
        <div className="t-card-header">
          {title !== undefined ? (
            <h2 className="t-card-title">
              {to !== undefined ? (
                <AppLink to={to} className="t-card-link">
                  {title}
                </AppLink>
              ) : (
                title
              )}
            </h2>
          ) : null}
          {description !== undefined ? <p className="t-card-description">{description}</p> : null}
          {actions !== undefined ? <div className="t-card-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children !== undefined ? <div className="t-card-body">{children}</div> : null}
      {footer !== undefined ? <div className="t-card-footer">{footer}</div> : null}
    </div>
  );
}
