/**
 * The code of each component's first example in both kits, for the Reference tab.
 * Empty until a build step writes showcase/src/reference.gen.json; then this module imports that file.
 */
export interface ReferenceCode {
  readonly react?: string;
  readonly html?: string;
}

export const REFERENCE: { readonly components: Readonly<Record<string, ReferenceCode>> } = { components: {} };
