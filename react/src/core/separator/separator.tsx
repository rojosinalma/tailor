import type spec from "@tailor/packs/core/separator/spec";

export interface SeparatorProps {
  orientation?: (typeof spec.props.orientation)[number];
  /** Text in the middle of an across line. */
  label?: string;
  /** A line for looks only: screen readers skip it. */
  decorative?: boolean;
}

/** A line between groups. An upright one stands in a row, such as a Cluster. */
export function Separator({ orientation = "horizontal", label, decorative = false }: SeparatorProps) {
  const vertical = orientation === "vertical";
  return (
    <div
      className="t-separator"
      {...(decorative
        ? { role: "none" }
        : { role: "separator", "aria-orientation": vertical ? "vertical" : undefined, "aria-label": label })}
      data-orientation={vertical ? "vertical" : undefined}
    >
      {label && !vertical ? <span className="t-separator-label">{label}</span> : null}
    </div>
  );
}
