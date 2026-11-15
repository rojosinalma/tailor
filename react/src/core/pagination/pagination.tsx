import { chevronLeft, chevronRight } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { clampPage, pageItems } from "@tailor/packs/core/pagination/logic";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";

export interface PaginationProps {
  /** The current page, from 1. */
  page: number;
  pageCount: number;
  /** Called with the page to show. Without `hrefFor`, the items are buttons. */
  onPageChange?: (page: number) => void;
  /** The address of a page. With it, the items are links, which also work without a script. */
  hrefFor?: (page: number) => string;
  /** The accessible name of the navigation. */
  label?: string;
}

const fill = (text: string, values: Record<string, number>): string =>
  text.replace(/\{(\w+)\}/g, (all, key: string) => String(values[key] ?? all));

/** Moves through the pages of a list. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  hrefFor,
  label = t("pagination"),
}: PaginationProps) {
  const isStatic = useIsStatic();
  const count = Math.max(1, Math.floor(pageCount));
  const current = clampPage(page, count);
  // A button needs a script, so the HTML kit gets links to ?page=N.
  const href = hrefFor ?? (isStatic ? (n: number) => `?page=${n}` : undefined);

  const item = (
    target: number,
    className: string,
    content: ReactNode,
    extra: Record<string, string | undefined>,
  ) => {
    const disabled = target < 1 || target > count;
    if (href) {
      return disabled ? (
        <a className={className} aria-disabled="true" {...extra}>
          {content}
        </a>
      ) : (
        <AppLink className={className} to={href(target)} {...extra}>
          {content}
        </AppLink>
      );
    }
    return (
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={() => onPageChange?.(target)}
        {...extra}
      >
        {content}
      </button>
    );
  };

  return (
    <nav className="t-pagination" aria-label={label}>
      <ul className="t-pagination-list">
        <li>
          {item(
            current - 1,
            "t-pagination-step",
            <>
              <Glyph body={chevronLeft} />
              {t("previous")}
            </>,
            { rel: href && current > 1 ? "prev" : undefined },
          )}
        </li>
        {pageItems(current, count).map((entry) =>
          typeof entry === "number" ? (
            <li key={entry}>
              {item(entry, "t-pagination-page", entry, {
                "aria-label": fill(t("pageNumber"), { page: entry }),
                "aria-current": entry === current ? "page" : undefined,
              })}
            </li>
          ) : (
            <li key={entry} className="t-pagination-gap" aria-hidden="true">
              …
            </li>
          ),
        )}
        <li className="t-pagination-status">{fill(t("pageOf"), { page: current, count })}</li>
        <li>
          {item(
            current + 1,
            "t-pagination-step",
            <>
              {t("next")}
              <Glyph body={chevronRight} />
            </>,
            { rel: href && current < count ? "next" : undefined },
          )}
        </li>
      </ul>
    </nav>
  );
}
