import type { ReactNode } from "react";
import { AppLink } from "../../link";

export interface ListProps {
  /** The accessible name of the list. */
  label: string;
  /** Lines between the rows. */
  dividers?: boolean;
  children?: ReactNode;
}

/** Rows of items. The children are ListItem elements. */
export function List({ label, dividers = true, children }: ListProps) {
  return (
    <ul className="t-list" aria-label={label} data-dividers={dividers ? undefined : "false"}>
      {children}
    </ul>
  );
}

export interface ListItemProps {
  /** An icon, an avatar or a dot. */
  leading?: ReactNode;
  title: ReactNode;
  /** At most two lines are shown. */
  description?: ReactNode;
  /** A badge, a value or actions. */
  trailing?: ReactNode;
  /** The row is a link to this address; the whole row is its hit area. */
  to?: string;
  selected?: boolean;
}

export function ListItem({ leading, title, description, trailing, to, selected = false }: ListItemProps) {
  return (
    <li className="t-list-item" aria-current={selected && !to ? "true" : undefined}>
      {leading ? <span className="t-list-leading">{leading}</span> : null}
      <div className="t-list-content">
        <span className="t-list-title">
          {to ? (
            <AppLink to={to} className="t-list-link" aria-current={selected ? "true" : undefined}>
              {title}
            </AppLink>
          ) : (
            title
          )}
        </span>
        {description ? <span className="t-list-description">{description}</span> : null}
      </div>
      {trailing ? <span className="t-list-trailing">{trailing}</span> : null}
    </li>
  );
}
