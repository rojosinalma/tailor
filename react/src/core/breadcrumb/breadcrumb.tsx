import { t } from "@tailor/core/text";
import { AppLink } from "../../link";

export interface BreadcrumbItem {
  readonly label: string;
  /** The address of the page. The last item is the current page and needs none. */
  readonly to?: string;
}

export interface BreadcrumbProps {
  /** From the top page down to the current page, which is the last item. */
  items: readonly BreadcrumbItem[];
  /** The accessible name of the navigation. */
  label?: string;
}

/** Where the page sits. In a narrow container the middle items collapse into an ellipsis. */
export function Breadcrumb({ items, label = t("breadcrumb") }: BreadcrumbProps) {
  const last = items.length - 1;
  return (
    <nav className="t-breadcrumb" aria-label={label}>
      <ol className="t-breadcrumb-list">
        {items.map((item, index) => (
          <BreadcrumbEntry
            key={item.to ?? item.label}
            item={item}
            current={index === last}
            more={index === 0 && last > 2}
          />
        ))}
      </ol>
    </nav>
  );
}

function BreadcrumbEntry({ item, current, more }: { item: BreadcrumbItem; current: boolean; more: boolean }) {
  return (
    <>
      <li className="t-breadcrumb-item">
        {current || item.to === undefined ? (
          <span aria-current={current ? "page" : undefined}>{item.label}</span>
        ) : (
          <AppLink to={item.to}>{item.label}</AppLink>
        )}
      </li>
      {more ? (
        <li className="t-breadcrumb-item t-breadcrumb-more" aria-hidden="true">
          <span>…</span>
        </li>
      ) : null}
    </>
  );
}
