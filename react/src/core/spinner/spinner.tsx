import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/spinner/spec";

export interface SpinnerProps {
  size?: (typeof spec.props.size)[number];
  /** What is going on, for screen readers. */
  label?: string;
}

/** Activity with no known length. It takes the current text colour. */
export function Spinner({ size = "md", label = t("loading") }: SpinnerProps) {
  return (
    <span className="t-spinner" role="status" data-size={size === "md" ? undefined : size}>
      <span className="t-sr-only">{label}</span>
    </span>
  );
}
