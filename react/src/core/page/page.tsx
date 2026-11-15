import type spec from "@tailor/packs/core/page/spec";
import type { ReactNode } from "react";

export interface PageProps {
  /** The one h1 of the page. */
  title: string;
  description?: ReactNode;
  /** A breadcrumb, shown above the title. */
  breadcrumb?: ReactNode;
  /** The page actions, at the end of the header. */
  actions?: ReactNode;
  /** "scroll": the body scrolls. "fill": the body takes the free height and its children scroll alone. */
  mode?: (typeof spec.props.mode)[number];
  /** "readable": the content keeps a width that reads well. */
  width?: (typeof spec.props.width)[number];
  children?: ReactNode;
}

/** The container that fills a shell's content region. Its header stays; its body scrolls or fills. */
export function Page({
  title,
  description,
  breadcrumb,
  actions,
  mode = "scroll",
  width = "full",
  children,
}: PageProps) {
  return (
    <div
      className="t-page"
      data-mode={mode === "scroll" ? undefined : mode}
      data-width={width === "full" ? undefined : width}
    >
      <header className="t-page-header">
        {breadcrumb ? <div className="t-page-breadcrumb">{breadcrumb}</div> : null}
        <div className="t-page-heading">
          <h1 className="t-page-title">{title}</h1>
          {description ? <p className="t-page-description">{description}</p> : null}
        </div>
        {actions ? <div className="t-page-actions">{actions}</div> : null}
      </header>
      <div className="t-page-body">{children}</div>
    </div>
  );
}
