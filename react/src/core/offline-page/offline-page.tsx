import { offline, retry } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";
import { InlineGlyphs, useIsStatic } from "../../kit";
import { Button } from "../button/button";

export interface OfflinePageProps {
  /** Replaces "No connection". */
  title?: string;
  /** Replaces the sentence under the title. */
  text?: ReactNode;
  /** Runs on Try again. Without it, Try again reloads the page. */
  onRetry?: () => void;
}

const reload = (): void => window.location.reload();

/** The page for no network connection. It draws only glyphs and text, so it needs nothing from the network. */
export function OfflinePage({
  title = t("offlineTitle"),
  text = t("offlineText"),
  onRetry,
}: OfflinePageProps) {
  const isStatic = useIsStatic();
  // The glyphs stay inline in the HTML kit too: the sprite may not be reachable offline.
  return (
    <InlineGlyphs>
      <div className="t-status-page">
        <div className="t-status-page-body">
          <span className="t-status-page-icon" aria-hidden="true">
            <Glyph body={offline} />
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
          </div>
        </div>
      </div>
    </InlineGlyphs>
  );
}
