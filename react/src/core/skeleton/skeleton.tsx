import type spec from "@tailor/packs/core/skeleton/spec";

export interface SkeletonProps {
  shape?: (typeof spec.props.shape)[number];
  /** Text only: the number of lines; the last one is shorter. */
  lines?: number;
  /** Box and circle only: the height of a box, the diameter of a circle. */
  size?: (typeof spec.props.size)[number];
}

/**
 * A grey placeholder while data loads. Screen readers skip it: mark the region that loads with
 * aria-busy="true" until the content is there.
 */
export function Skeleton({ shape = "text", lines = 1, size = "md" }: SkeletonProps) {
  const count = Math.max(1, Math.round(lines));
  return (
    <div
      className="t-skeleton"
      data-shape={shape === "text" ? undefined : shape}
      data-size={shape === "text" || size === "md" ? undefined : size}
      aria-hidden="true"
    >
      {shape === "text"
        ? Array.from({ length: count }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the lines are identical and never move.
            <span key={i} className="t-skeleton-line" />
          ))
        : null}
    </div>
  );
}
