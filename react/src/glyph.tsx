/** A glyph: one of the icons that the kit draws itself. The body comes from @tailor/core/glyphs.gen. */
export function Glyph({ body, label }: { body: string; label?: string }) {
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
