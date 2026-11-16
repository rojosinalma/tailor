import type { ReactNode } from "react";
import { Banner } from "../../core/banner/banner";
import { Glyph } from "../../glyph";

/**
 * A Banner with its own glyph and no live role: the PWA notices sit in a live region that stays in the page,
 * so that a screen reader hears them come and go.
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
    <Banner tone={tone} icon={<Glyph body={glyph} />} live={false} action={action}>
      {children}
    </Banner>
  );
}
