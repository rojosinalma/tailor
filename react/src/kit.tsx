import { createContext, type ReactNode, type RefObject, use } from "react";

/**
 * The kit mode. "react" is the normal mode. "static" renders the markup that the HTML kit starts from:
 * the build uses it to make the HTML kit's pages from the same source.
 */
type KitMode = "react" | "static";

const KitContext = createContext<KitMode>("react");

/**
 * `glyphs` maps a glyph's body to its sprite id: the static markup then draws each glyph from the sprite
 * (`icons.svg#t-close`), so a project copies one line and never a drawing.
 */
export function StaticKit({
  children,
  glyphs,
}: {
  children: ReactNode;
  glyphs?: ReadonlyMap<string, string>;
}) {
  return (
    <KitContext value="static">
      <GlyphIcons value={glyphs ?? null}>{children}</GlyphIcons>
    </KitContext>
  );
}

const GlyphIcons = createContext<ReadonlyMap<string, string> | null>(null);

/** Draws the glyphs below it inline, also in static markup: for a page that must need nothing from the network. */
export function InlineGlyphs({ children }: { children: ReactNode }) {
  return <GlyphIcons value={null}>{children}</GlyphIcons>;
}

/** The sprite id of a glyph in static markup, or null when the glyph is drawn inline. */
export const useGlyphIcon = (body: string): string | null => use(GlyphIcons)?.get(body) ?? null;

/** The address of the icon sprite: IconSprite sets it. */
export const SpriteContext = createContext("/tailor/icons.svg");

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
/** The popup element of the nearest Dialog or Drawer; null outside one. Shortcuts use it to know their overlay. */
export const OverlayContext = createContext<RefObject<HTMLElement | null> | null>(null);
