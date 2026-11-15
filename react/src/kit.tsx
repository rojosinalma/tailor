import { createContext, type ReactNode, use } from "react";

/**
 * The kit mode. "react" is the normal mode. "static" renders the markup that the HTML kit starts from:
 * the build uses it to make the HTML kit's pages from the same source.
 */
type KitMode = "react" | "static";

const KitContext = createContext<KitMode>("react");

export function StaticKit({ children }: { children: ReactNode }) {
  return <KitContext value="static">{children}</KitContext>;
}

export const useIsStatic = (): boolean => use(KitContext) === "static";

/** Joins class names and drops the empty ones. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
