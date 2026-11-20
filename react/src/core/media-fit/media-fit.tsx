import type spec from "@tailor/packs/core/media-fit/spec";
import type { ReactNode } from "react";

export interface MediaFitProps {
  /** "down": never above the natural size. "contain": also scales a small picture up to the box. */
  fit?: (typeof spec.props.fit)[number];
  /** Shown while there is no media, usually an EmptyState. */
  empty?: ReactNode;
  /** One <img>, <video>, <canvas>, <svg> or <picture>; nothing while there is none yet. */
  children?: ReactNode;
}

/**
 * One picture at the largest size that fits the free width and height of its box, aspect ratio kept. It
 * never grows its parent: use it as the body of a Pane, a Split pane or a fill Page.
 */
export function MediaFit({ fit = "down", empty, children }: MediaFitProps) {
  return (
    <div className="t-media-fit" data-fit={fit === "down" ? undefined : fit}>
      {children}
      {empty ? <div className="t-media-fit-empty">{empty}</div> : null}
    </div>
  );
}
