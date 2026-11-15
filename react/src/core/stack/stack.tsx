import type spec from "@tailor/packs/core/stack/spec";
import type { ReactNode } from "react";

export interface StackProps {
  gap?: (typeof spec.props.gap)[number];
  align?: (typeof spec.props.align)[number];
  children?: ReactNode;
}

/** A column of children with one gap between them. */
export function Stack({ gap = "3", align, children }: StackProps) {
  return (
    <div className="t-stack" data-gap={gap === "3" ? undefined : gap} data-align={align}>
      {children}
    </div>
  );
}
