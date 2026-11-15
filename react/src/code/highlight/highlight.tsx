import { highlightedHtml, type Language } from "@tailor/packs/code/highlight/logic";
import { CodeBlock } from "../../core/code-block/code-block";
import { useIsStatic } from "../../kit";

export interface HighlightProps {
  code: string;
  /** "auto" guesses the language; "text" shows the code without colours. */
  language: Language;
  /** Shown above the code, such as a file name. */
  title?: string;
  /** Wraps long lines instead of scrolling sideways. */
  wrap?: boolean;
  /** Numbers the lines in a gutter that a copied selection leaves out. */
  lineNumbers?: boolean;
  /** The accessible name of the code; defaults to the title. */
  label?: string;
}

/** A code block with syntax colours. */
export function Highlight({
  code,
  language,
  title,
  wrap = false,
  lineNumbers = false,
  label,
}: HighlightProps) {
  const isStatic = useIsStatic();
  const attributes = {
    className: language === "auto" ? "t-highlight" : `t-highlight language-${language}`,
    "data-line-numbers": lineNumbers ? "" : undefined,
  };
  return (
    <CodeBlock code={code} title={title} wrap={wrap} label={label}>
      {isStatic ? (
        // The HTML kit script colours the plain code in the browser.
        <code {...attributes} data-t={language === "text" ? undefined : "highlight"}>
          {code}
        </code>
      ) : (
        <code
          {...attributes}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight.js escapes the code; its output holds only its own spans.
          dangerouslySetInnerHTML={{ __html: highlightedHtml(code, language, lineNumbers) }}
        />
      )}
    </CodeBlock>
  );
}
