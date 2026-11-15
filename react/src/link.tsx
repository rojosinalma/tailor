import { Link as RouterLink, useRouter } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useIsStatic } from "./kit";

export interface AppLinkProps extends Omit<ComponentProps<"a">, "href" | "style"> {
  /** The address. An address inside the app goes through the router; a full URL is a plain link. */
  to: string;
  /** Marks the link as the current page when the router cannot tell, for example in the HTML kit. */
  current?: boolean;
  /** The link is current only when the address matches exactly. */
  exact?: boolean;
}

const isExternal = (to: string): boolean => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(to) || to.startsWith("#");

/**
 * The one link of the kit. Inside a router it navigates without a page load and marks itself with
 * aria-current="page" on the current page. Without a router, and in the HTML kit, it is a plain <a>.
 */
export function AppLink({ to, current, exact, children, ...rest }: AppLinkProps) {
  const isStatic = useIsStatic();
  const router = useRouter({ warn: false }) as ReturnType<typeof useRouter> | undefined;
  if (isStatic || !router || isExternal(to)) {
    return (
      <a href={to} aria-current={current ? "page" : undefined} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink
      to={to}
      activeOptions={{ exact: exact ?? false }}
      {...(current ? { "aria-current": "page" } : {})}
      {...rest}
    >
      {children}
    </RouterLink>
  );
}
