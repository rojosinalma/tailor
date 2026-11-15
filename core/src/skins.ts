/** The skin model: a skin is a list of settings plus an extras file that changes looks only. */

/** Every setting a skin can give, with the token it sets. */
export const SKIN_SETTINGS = {
  "font-sans": "--t-font-sans",
  "font-mono": "--t-font-mono",
  "font-heading": "--t-font-heading",
  "text-xs": "--t-text-xs",
  "text-sm": "--t-text-sm",
  "text-base": "--t-text-base",
  "text-lg": "--t-text-lg",
  "text-xl": "--t-text-xl",
  "text-2xl": "--t-text-2xl",
  "text-3xl": "--t-text-3xl",
  leading: "--t-leading",
  "leading-tight": "--t-leading-tight",
  "weight-normal": "--t-weight-normal",
  "weight-medium": "--t-weight-medium",
  "weight-bold": "--t-weight-bold",
  "heading-weight": "--t-heading-weight",
  "heading-style": "--t-heading-style",
  "heading-transform": "--t-heading-transform",
  "label-weight": "--t-label-weight",
  "label-transform": "--t-label-transform",
  tracking: "--t-tracking",
  "radius-control": "--t-radius-control",
  "radius-box": "--t-radius-box",
  "radius-popup": "--t-radius-popup",
  "radius-pill": "--t-radius-pill",
  "radius-check": "--t-radius-check",
  "border-w": "--t-border-w",
  "border-w-strong": "--t-border-w-strong",
  "focus-w": "--t-focus-w",
  "focus-offset": "--t-focus-offset",
  "focus-color": "--t-focus-color",
  "shadow-sm": "--t-shadow-sm",
  "shadow-md": "--t-shadow-md",
  "shadow-lg": "--t-shadow-lg",
  "card-shadow": "--t-card-shadow",
  "space-unit": "--t-space-unit",
  "control-h-sm": "--t-skin-control-h-sm",
  "control-h-md": "--t-skin-control-h-md",
  "control-h-lg": "--t-skin-control-h-lg",
  "control-px": "--t-control-px",
  "motion-fast": "--t-skin-motion-fast",
  "motion-base": "--t-skin-motion-base",
  ease: "--t-ease",
  "btn-weight": "--t-btn-weight",
  "btn-transform": "--t-btn-transform",
  "btn-shadow": "--t-btn-shadow",
  "nav-h": "--t-nav-h",
  "sidebar-w": "--t-sidebar-w",
} as const;

export type SkinSetting = keyof typeof SKIN_SETTINGS;

export interface SkinFont {
  readonly family: string;
  readonly file: string;
  readonly weight: string;
  readonly style: "normal" | "italic";
}

export interface SkinSpec {
  readonly id: string;
  /** Display name: one clean name, no brackets. */
  readonly name: string;
  /** One line on the source of the look and its licence. */
  readonly about: string;
  readonly source: { readonly name: string; readonly url: string; readonly license: string };
  readonly fonts?: readonly SkinFont[];
  readonly settings: Partial<Record<SkinSetting, string>>;
}

/** What an extras file may set: looks only. Size, spacing and position belong to tailor. */
export const EXTRAS_PROPERTIES: readonly RegExp[] = [
  /^color$/,
  /^background(-color|-image|-clip|-blend-mode)?$/,
  /^border(-(top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?(-(color|style|width))?$/,
  /^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/,
  /^outline(-(color|style|width|offset))?$/,
  /^box-shadow$/,
  /^text-(decoration(-(line|color|style|thickness))?|transform|shadow|underline-offset)$/,
  /^font-(family|weight|style|variant(-[a-z]+)?|feature-settings)$/,
  /^letter-spacing$/,
  /^opacity$/,
  /^filter$/,
  /^backdrop-filter$/,
  /^transition(-(property|duration|timing-function|delay))?$/,
  /^content$/,
  /^appearance$/,
  /^cursor$/,
  /^fill$/,
  /^stroke(-width)?$/,
  /^--t-[a-z0-9-]+$/,
];

export function validateSkin(spec: SkinSpec): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z0-9-]*$/.test(spec.id)) errors.push(`id "${spec.id}" is not kebab-case`);
  if (!spec.name || /[()[\]]/.test(spec.name))
    errors.push(`name "${spec.name}" must be one clean name with no brackets`);
  if (!spec.about) errors.push("about is empty");
  for (const key of Object.keys(spec.settings)) {
    if (!(key in SKIN_SETTINGS)) errors.push(`unknown setting "${key}"`);
  }
  return errors;
}

/** The stylesheet of one skin: its fonts, its settings and its extras, scoped to the skin. */
export function skinCss(spec: SkinSpec, extras: string, fontBase: string): string {
  const fonts = (spec.fonts ?? [])
    .map(
      (f) =>
        `@font-face { font-family: "${f.family}"; src: url("${fontBase}${spec.id}/${f.file}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`,
    )
    .join("\n");
  const settings = Object.entries(spec.settings)
    .map(([key, value]) => `    ${SKIN_SETTINGS[key as SkinSetting]}: ${value};`)
    .join("\n");
  const scope = `[data-skin="${spec.id}"]`;
  return `/* ${spec.name}: ${spec.about} */\n${fonts ? `${fonts}\n` : ""}@layer t.skin {\n  ${scope} {\n${settings}\n  }\n  ${scope} {\n${extras}\n  }\n}\n`;
}
