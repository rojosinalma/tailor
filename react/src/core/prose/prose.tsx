import type { ReactNode } from "react";

export interface ProseProps {
  /** Plain HTML elements: headings, paragraphs, lists, quotes, code, tables, images. */
  children?: ReactNode;
}

/** Long text in plain HTML, such as rendered Markdown, with its vertical rhythm and a capped line length. */
export function Prose({ children }: ProseProps) {
  return <div className="t-prose">{children}</div>;
}
