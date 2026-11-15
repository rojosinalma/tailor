import { check, copy } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { highlightedHtml, type Language } from "@tailor/packs/code/highlight/logic";
import { useEffect, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

/** How long the copy button shows its check. */
const COPIED_MS = 2000;

/** The copy button of a code block header: copies the text and shows a check for a moment. */
export function CodeCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = (): void => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      },
      // Without clipboard access the button stays as it is.
      () => undefined,
    );
  };

  return (
    <button
      type="button"
      className="t-btn t-code-copy"
      data-variant="ghost"
      data-size="sm"
      data-copied={copied ? "" : undefined}
      onClick={onCopy}
    >
      <Glyph body={copied ? check : copy} />
      <span className="t-btn-label" aria-live="polite">
        {copied ? t("copied") : t("copy")}
      </span>
    </button>
  );
}

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
  const className = language === "auto" ? undefined : `language-${language}`;
  return (
    <div
      className="t-code t-highlight"
      data-wrap={wrap ? "" : undefined}
      data-line-numbers={lineNumbers ? "" : undefined}
      data-t={isStatic ? "code-block" : undefined}
    >
      <div className="t-code-header">
        {title ? <span className="t-code-title">{title}</span> : null}
        <CodeCopy text={code} />
      </div>
      {/* Code that scrolls sideways takes the focus, so the keyboard can scroll it. */}
      <pre
        className="t-code-pre"
        {...(wrap ? {} : { tabIndex: 0, role: "group", "aria-label": label ?? title ?? t("code") })}
      >
        {isStatic ? (
          // The HTML kit script colours the plain code in the browser.
          <code className={className} data-t={language === "text" ? undefined : "highlight"}>
            {code}
          </code>
        ) : (
          <code
            className={className}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight.js escapes the code; its output holds only its own spans.
            dangerouslySetInnerHTML={{ __html: highlightedHtml(code, language, lineNumbers) }}
          />
        )}
      </pre>
    </div>
  );
}
