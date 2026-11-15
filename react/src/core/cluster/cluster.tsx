import type spec from "@tailor/packs/core/cluster/spec";
import type { ReactNode } from "react";

export interface ClusterProps {
  gap?: (typeof spec.props.gap)[number];
  align?: (typeof spec.props.align)[number];
  justify?: (typeof spec.props.justify)[number];
  children?: ReactNode;
}

/** A row of children that wraps, with one gap between them. */
export function Cluster({ gap = "3", align, justify, children }: ClusterProps) {
  return (
    <div
      className="t-cluster"
      data-gap={gap === "3" ? undefined : gap}
      data-align={align}
      data-justify={justify === "start" ? undefined : justify}
    >
      {children}
    </div>
  );
}
