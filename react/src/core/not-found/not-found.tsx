import { t } from "@tailor/core/text";
import type { ReactNode } from "react";
import { ButtonLink } from "../button/button";

export interface NotFoundPageProps {
  /** Replaces "Page not found". */
  title?: string;
  /** Replaces the sentence under the title. */
  text?: ReactNode;
  /** The address of the Home link. */
  homeTo?: string;
  /** More buttons or links after Home, such as a link back to a list. */
  actions?: ReactNode;
}

/** The page for an address that matches nothing. It fills its parent and centres its content. */
export function NotFoundPage({
  title = t("notFoundTitle"),
  text = t("notFoundText"),
  homeTo = "/",
  actions,
}: NotFoundPageProps) {
  return (
    <div className="t-status-page">
      <div className="t-status-page-body">
        <p className="t-status-page-code" aria-hidden="true">
          404
        </p>
        <h1 className="t-status-page-title">{title}</h1>
        <p className="t-status-page-text">{text}</p>
        <div className="t-status-page-actions">
          <ButtonLink to={homeTo} variant="primary">
            {t("home")}
          </ButtonLink>
          {actions}
        </div>
      </div>
    </div>
  );
}

/** The not-found page as a router's `notFoundComponent`. */
export const routeNotFoundComponent = () => <NotFoundPage />;
