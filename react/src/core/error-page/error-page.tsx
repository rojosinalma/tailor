import { danger, retry } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { Accordion } from "../accordion/accordion";
import { Button, ButtonLink } from "../button/button";
import { CodeBlock } from "../code-block/code-block";

export interface ErrorPageProps {
  /** Replaces "Something went wrong". */
  title?: string;
  /** Replaces the sentence under the title. */
  text?: ReactNode;
  /** Runs on Try again. Without it, Try again reloads the page. */
  onRetry?: () => void;
  /** The address of the Home link. */
  homeTo?: string;
  /** The error message or a reference, in a closed Details section with a copy button. */
  details?: string;
}

const reload = (): void => window.location.reload();

/** The page for a failure. It fills its parent and centres its content. */
export function ErrorPage({
  title = t("errorTitle"),
  text = t("errorText"),
  onRetry,
  homeTo = "/",
  details,
}: ErrorPageProps) {
  const isStatic = useIsStatic();
  return (
    <div className="t-status-page">
      <div className="t-status-page-body">
        <span className="t-status-page-icon" aria-hidden="true">
          <Glyph body={danger} />
        </span>
        <h1 className="t-status-page-title">{title}</h1>
        <p className="t-status-page-text">{text}</p>
        <div className="t-status-page-actions">
          <Button
            variant="primary"
            icon={<Glyph body={retry} />}
            onClick={onRetry ?? reload}
            data-t={isStatic ? "reload" : undefined}
          >
            {t("retry")}
          </Button>
          <ButtonLink to={homeTo}>{t("home")}</ButtonLink>
        </div>
        {details ? (
          <div className="t-status-page-details">
            <Accordion
              items={[
                {
                  id: "details",
                  title: t("details"),
                  content: <CodeBlock code={details} wrap label={t("details")} />,
                },
              ]}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The error page as a router's `errorComponent`: Try again resets the route, the message is the details. */
export const routeErrorComponent = ({ error, reset }: ErrorComponentProps) => (
  <ErrorPage onRetry={reset} details={error instanceof Error ? error.message : String(error)} />
);
