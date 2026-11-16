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
  /**
   * "react": the example shows something that only the React kit can do (a callback, live data, a server
   * mode). The HTML kit's page leaves it out.
   */
  readonly kit?: "react";
  /** A narrow box around the example, to show how the component adapts to its container. */
  readonly width?: "sm" | "md";
}

export interface ExampleSet {
  readonly component: string;
  readonly examples: readonly Example[];
}

export function defineExamples(component: string, examples: readonly Example[]): ExampleSet {
  if (examples.length === 0) throw new Error(`${component}: a component needs at least one example`);
  return { component, examples };
}
