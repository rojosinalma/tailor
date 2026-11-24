import { use } from "react";
import { SpriteContext, useGlyphIcon } from "./kit";

/**
 * A glyph: one of the icons that the kit draws itself. The body comes from @tailor/core/glyphs.gen. In the
 * HTML kit's markup it is drawn from the sprite, which always holds the glyphs of the installed packs.
 */
export function Glyph({ body, label }: { body: string; label?: string }) {
  const icon = useGlyphIcon(body);
  const sprite = use(SpriteContext);
  if (icon)
    return (
      // The viewBox of the inline form: the glyph then lands on the same pixels in both kits.
      <svg
        className="t-icon"
        viewBox="0 0 16 16"
        aria-hidden={label ? undefined : true}
        role={label ? "img" : undefined}
        aria-label={label}
      >
        <use href={`${sprite}#${icon}`} />
      </svg>
    );
  return (
    <svg
      className="t-icon"
      viewBox="0 0 16 16"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the body is generated from the pinned icon set, never from input.
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
