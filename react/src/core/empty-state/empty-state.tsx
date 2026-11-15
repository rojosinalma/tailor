import type spec from "@tailor/packs/core/empty-state/spec";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** A decorative icon, for example <Icon name="bi:inbox" />. */
  icon?: ReactNode;
  /** Says what is empty: "No hosts yet". */
  title: string;
  /** Says what to do: "Add a host to start monitoring it." */
  text?: ReactNode;
  /** The buttons that fill the empty place. */
  actions?: ReactNode;
  size?: (typeof spec.props.size)[number];
}

/** What a list, a table or a page shows when it has nothing. */
export function EmptyState({ icon, title, text, actions, size = "md" }: EmptyStateProps) {
  return (
    <div className="t-empty" data-size={size === "md" ? undefined : size}>
      {icon ? (
        <span className="t-empty-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="t-empty-title">{title}</p>
      {text ? <p className="t-empty-text">{text}</p> : null}
      {actions ? <div className="t-empty-actions">{actions}</div> : null}
    </div>
  );
}
