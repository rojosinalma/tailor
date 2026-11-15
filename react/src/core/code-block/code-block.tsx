import { check, copy } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { useEffect, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

/** How long the copy button shows its check. */
const COPIED_MS = 2000;

export interface CodeBlockProps {
  code: string;
  /** Shown above the code, such as a file name. */
  title?: string;
  /** Wraps long lines instead of scrolling sideways. */
  wrap?: boolean;
  /** The accessible name of the code; defaults to the title. */
  label?: string;
}

/** Preformatted code with a copy button. No syntax colouring. */
export function CodeBlock({ code, title, wrap = false, label }: CodeBlockProps) {
  const isStatic = useIsStatic();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = (): void => {
    navigator.clipboard.writeText(code).then(
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
    <div className="t-code" data-wrap={wrap ? "" : undefined} data-t={isStatic ? "code-block" : undefined}>
      <div className="t-code-header">
        {title ? <span className="t-code-title">{title}</span> : null}
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
      </div>
      {/* Code that scrolls sideways takes the focus, so the keyboard can scroll it. */}
      <pre
        className="t-code-pre"
        {...(wrap ? {} : { tabIndex: 0, role: "group", "aria-label": label ?? title ?? t("code") })}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
