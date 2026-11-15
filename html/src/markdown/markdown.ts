import { renderMarkdown, sanitizerFor, unescapeScript } from "@tailor/packs/markdown/markdown/logic";
import DOMPurify from "dompurify";
import { register } from "../runtime";

let sanitize: ((html: string) => string) | undefined;

/** Renders the Markdown source that static mode put in a <script type="text/markdown">, cleaned by DOMPurify. */
register("markdown", (element) => {
  const script = element.querySelector(':scope > script[type="text/markdown"]');
  if (!script) return;
  sanitize ??= sanitizerFor(DOMPurify(window), window.location.origin);
  element.innerHTML = renderMarkdown(unescapeScript(script.textContent ?? ""), { sanitize });
});
