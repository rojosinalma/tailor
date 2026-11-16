import type { ReactNode } from "react";
import { Glyph } from "../../glyph";

/**
 * The markup of a Banner with its own glyph and no live role: the PWA notices sit in a live region that
 * stays in the page, so that a screen reader hears them come and go.
 */
export function Notice({
  tone,
  glyph,
  action,
  children,
}: {
  tone: "info" | "warning";
  glyph: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="t-banner" data-tone={tone}>
      <span className="t-banner-icon">
        <Glyph body={glyph} />
      </span>
      <div className="t-banner-text">{children}</div>
      {action ? <div className="t-banner-action">{action}</div> : null}
    </div>
  );
}
