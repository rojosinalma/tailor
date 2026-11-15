/** The description of one component: its names, its allowed values and where it belongs. */

export const GROUPS = [
  "layout",
  "actions",
  "display",
  "feedback",
  "navigation",
  "inputs",
  "phone",
  "pages",
  "shells",
  "layouts",
] as const;
export type Group = (typeof GROUPS)[number];

export const TONES = ["neutral", "accent", "success", "warning", "danger", "info"] as const;
export type Tone = (typeof TONES)[number];

export const SIZES = ["sm", "md", "lg"] as const;
export type Size = (typeof SIZES)[number];

export const GAPS = ["0", "1", "2", "3", "4", "5", "6"] as const;
export type Gap = (typeof GAPS)[number];

/** How the HTML kit provides a component. */
export type HtmlSupport = "markup" | "script" | "none";

export interface ComponentSpec {
  /** Unique id in kebab-case, also the folder name. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** The pack that holds the component. */
  readonly pack: string;
  readonly group: Group;
  /** One sentence: what the component is for. */
  readonly description: string;
  /** Root class. */
  readonly root: string;
  /** Part classes with their purpose. */
  readonly parts?: Readonly<Record<string, string>>;
  /** Allowed values per property. A property with an empty list takes free text or content. */
  readonly props?: Readonly<Record<string, readonly string[]>>;
  /** "markup": plain markup, no script. "script": the HTML kit script adds behaviour. "none": React only. */
  readonly html: HtmlSupport;
}

export function defineComponent<const S extends ComponentSpec>(spec: S): S {
  return spec;
}
