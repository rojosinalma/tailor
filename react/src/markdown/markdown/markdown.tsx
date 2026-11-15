import { escapeScript, renderMarkdown, sanitizerFor } from "@tailor/packs/markdown/markdown/logic";
import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";
import { useIsStatic } from "../../kit";

let sanitize: ((html: string) => string) | undefined;
/** The cleaning step of the page: one DOMPurify instance of its own, made on first use in the browser. */
const browserSanitize = (html: string): string => {
  sanitize ??= sanitizerFor(DOMPurify(window), window.location.origin);
  return sanitize(html);
};

export interface MarkdownProps {
  /** The Markdown text (GitHub flavour). */
  source: string;
  /** Makes the view a named region, for a document that stands on its own in the page. */
  label?: string;
}

/** Renders Markdown as prose. The HTML is cleaned in the browser; before that, only the empty container shows. */
export function Markdown({ source, label }: MarkdownProps) {
  const isStatic = useIsStatic();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const html = useMemo(
    () => (ready ? renderMarkdown(source, { sanitize: browserSanitize }) : null),
    [ready, source],
  );
  const region = label ? { role: "region", "aria-label": label } : {};

  if (isStatic) {
    return (
      <div className="t-prose t-markdown" data-t="markdown" {...region}>
        <script
          type="text/markdown"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: a data block that never runs; the source is escaped so it cannot end the element, and the HTML kit cleans what it renders.
          dangerouslySetInnerHTML={{ __html: escapeScript(source) }}
        />
      </div>
    );
  }

  return html === null ? (
    <div className="t-prose t-markdown" {...region} />
  ) : (
    <div
      className="t-prose t-markdown"
      {...region}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the HTML comes from renderMarkdown() and has passed DOMPurify (sanitizerFor) on this line's input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
