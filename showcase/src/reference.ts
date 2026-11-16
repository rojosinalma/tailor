/** The code of each component's first example in both kits, for the Reference tab. The build writes the file. */
import data from "./reference.gen.json";

export interface ReferenceCode {
  readonly react?: string;
  readonly html?: string;
}

export const REFERENCE: { readonly components: Readonly<Record<string, ReferenceCode>> } = data;
