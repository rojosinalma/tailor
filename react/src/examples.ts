import type { ReactNode } from "react";

/** One showcase example of a component. */
export interface Example {
  readonly id: string;
  readonly title: string;
  /** Leave out when the title says it all. */
  readonly note?: string;
  readonly render: () => ReactNode;
  /** "frame": the example needs a page of its own (shells, layouts, fill-mode parts). */
  readonly display?: "inline" | "frame";
}

export interface ExampleSet {
  readonly component: string;
  readonly examples: readonly Example[];
}

export function defineExamples(component: string, examples: readonly Example[]): ExampleSet {
  if (examples.length === 0) throw new Error(`${component}: a component needs at least one example`);
  return { component, examples };
}
