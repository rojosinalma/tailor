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

/**
 * True in a development build. A bundler or a runtime gives `process.env.NODE_ENV`; a plain browser page
 * has no `process`, and counts as production.
 */
export function isDevelopment(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env !== undefined && env.NODE_ENV !== "production";
}
