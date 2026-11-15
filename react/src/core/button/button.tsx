import type spec from "@tailor/packs/core/button/spec";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { cx } from "../../kit";
import { AppLink, type AppLinkProps } from "../../link";

type ButtonVariant = (typeof spec.props.variant)[number];
type ButtonSize = (typeof spec.props.size)[number];

interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** An icon before the text. With no text, also give `label`. */
  icon?: ReactNode;
  /** The accessible name of a button that shows an icon only. */
  label?: string;
}

export interface ButtonProps extends Omit<ComponentProps<"button">, "style">, ButtonLook {
  /** Shows a spinner in place of the icon and ignores clicks; the button keeps the focus. */
  loading?: boolean;
}

export interface ButtonLinkProps extends Omit<AppLinkProps, "aria-label">, ButtonLook {}

/** The attributes and content that a button and a button link share. */
function look({ variant = "default", size = "md", icon, label }: ButtonLook, children: ReactNode) {
  const iconOnly = icon !== undefined && (children === undefined || children === null);
  return {
    attributes: {
      "data-variant": variant === "default" ? undefined : variant,
      "data-size": size === "md" ? undefined : size,
      "data-icon-only": iconOnly ? "" : undefined,
      "aria-label": label,
    },
    content: (
      <>
        {icon}
        {iconOnly ? null : icon === undefined ? children : <span className="t-btn-label">{children}</span>}
      </>
    ),
  };
}

const ignore = (event: MouseEvent): void => event.preventDefault();

export function Button({
  variant,
  size,
  icon,
  label,
  loading,
  type = "button",
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const shown = loading ? <span className="t-btn-spinner" aria-hidden="true" /> : icon;
  const { attributes, content } = look({ variant, size, icon: shown, label }, children);
  return (
    <button
      type={type}
      className={cx("t-btn", className)}
      {...attributes}
      aria-busy={loading ? true : undefined}
      aria-disabled={loading ? true : undefined}
      onClick={loading ? ignore : onClick}
      {...rest}
    >
      {content}
    </button>
  );
}

/** A link that looks like a button: for an action that goes to another page. */
export function ButtonLink({ variant, size, icon, label, className, children, ...rest }: ButtonLinkProps) {
  const { attributes, content } = look({ variant, size, icon, label }, children);
  return (
    <AppLink className={cx("t-btn", className)} {...attributes} {...rest}>
      {content}
    </AppLink>
  );
}
