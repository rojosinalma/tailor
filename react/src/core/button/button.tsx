import type spec from "@tailor/packs/core/button/spec";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "../../kit";

type ButtonVariant = (typeof spec.props.variant)[number];
type ButtonSize = (typeof spec.props.size)[number];

export interface ButtonProps extends Omit<ComponentProps<"button">, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** An icon before the text. With no text, also give `label`. */
  icon?: ReactNode;
  /** The accessible name of a button that shows an icon only. */
  label?: string;
}

export function Button({
  variant = "default",
  size = "md",
  icon,
  label,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconOnly = icon !== undefined && (children === undefined || children === null);
  return (
    <button
      type={type}
      className={cx("t-btn", className)}
      data-variant={variant === "default" ? undefined : variant}
      data-size={size === "md" ? undefined : size}
      data-icon-only={iconOnly ? "" : undefined}
      aria-label={label}
      {...rest}
    >
      {icon}
      {iconOnly ? null : icon === undefined ? children : <span className="t-btn-label">{children}</span>}
    </button>
  );
}
