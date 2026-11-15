import type spec from "@tailor/packs/core/badge/spec";
import type { ReactNode } from "react";

export interface BadgeProps {
  tone?: (typeof spec.props.tone)[number];
  variant?: (typeof spec.props.variant)[number];
  /** An icon before the text. */
  icon?: ReactNode;
  children: ReactNode;
}

/** A short label for a state or a category. */
export function Badge({ tone = "neutral", variant = "soft", icon, children }: BadgeProps) {
  return (
    <span className="t-badge" data-tone={tone} data-variant={variant === "soft" ? undefined : variant}>
      {icon}
      <span className="t-badge-label">{children}</span>
    </span>
  );
}
