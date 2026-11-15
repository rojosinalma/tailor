/** Markdown to clean HTML, shared by both kits. The cleaning step needs a DOM, so the caller passes it in. */
import type { DOMPurify } from "dompurify";
import { Marked, type Tokens } from "marked";

/** Every id and name in rendered Markdown starts with this, so it cannot collide with the app's ids. */
export const ID_PREFIX = "user-content-";

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

export const prefixId = (id: string): string => (id.startsWith(ID_PREFIX) ? id : ID_PREFIX + id);

/** A link to a place in the same document points at the prefixed id. */
export const fragmentHref = (href: string): string =>
  href.length > 1 && href.startsWith("#") ? `#${prefixId(href.slice(1))}` : href;

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

const parse = (url: string, origin: string): URL | null => {
  try {
    return new URL(url, origin);
  } catch {
    return null;
  }
};

/** A link that leaves the site: http or https on another origin. */
export function isExternal(href: string, origin: string): boolean {
  const url = parse(href, origin);
  return url !== null && /^https?:$/.test(url.protocol) && url.origin !== origin;
}

/** Images load only from https, data:image/… or the page's own origin. */
export function imageAllowed(src: string, origin: string): boolean {
  if (/^data:image\/[a-z0-9.+-]+[;,]/i.test(src)) return true;
  if (src === "" || /^data:/i.test(src)) return false;
  const url = parse(src, origin);
  return url !== null && (url.protocol === "https:" || url.origin === origin);
}

/** Only these classes survive the cleaning: the ones the renderer adds and the language of a code block. */
const OWN_CLASSES = new Set(["t-code-pre", "t-markdown-task", "t-markdown-check", "t-markdown-box"]);
export const keepClasses = (value: string): string =>
  value
    .split(/\s+/)
    .filter((c) => OWN_CLASSES.has(c) || /^language-[\w+-]+$/.test(c))
    .join(" ");

/**
 * Markdown as plain text inside <script type="text/markdown">: "</script" and "<!--" would end or bend the
 * script element, so each gets one more backslash after "<". unescapeScript() reverses it exactly.
 */
export const escapeScript = (source: string): string => source.replace(/<(\\*)(\/script|!--)/gi, "<\\$1$2");
export const unescapeScript = (text: string): string => text.replace(/<\\(\\*)(\/script|!--)/gi, "<$1$2");

function markdownParser(): Marked {
  const ids = new Map<string, number>();
  const uniqueId = (text: string): string | null => {
    const base = slug(text);
    if (!base) return null;
    const seen = ids.get(base) ?? 0;
    ids.set(base, seen + 1);
    return prefixId(seen === 0 ? base : `${base}-${seen}`);
  };
  const box = (checked: boolean | undefined): string =>
    `<input type="checkbox" disabled=""${checked ? ' checked=""' : ""}><span class="t-markdown-box"></span>`;

  return new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ tokens, depth }) {
        const id = uniqueId(this.parser.parseInline(tokens, this.parser.textRenderer));
        return `<h${depth}${id ? ` id="${escapeHtml(id)}"` : ""}>${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      code({ text, lang, escaped }) {
        const language = (lang ?? "").match(/^[\w+-]+/)?.[0];
        const body = escaped ? text : escapeHtml(text);
        return `<pre class="t-code-pre"><code${language ? ` class="language-${language}"` : ""}>${body}\n</code></pre>\n`;
      },
      // The task's box is drawn by listitem, inside a label with the task's text.
      checkbox() {
        return "";
      },
      listitem(item: Tokens.ListItem) {
        if (!item.task) return false;
        const tokens = item.tokens.filter((token) => token.type !== "checkbox");
        const first = tokens[0];
        let head = "";
        if (first && (first.type === "text" || first.type === "paragraph")) {
          tokens.shift();
          const inline = "tokens" in first && first.tokens ? first.tokens : [];
          const label = `<label class="t-markdown-check">${box(item.checked)}<span>${this.parser.parseInline(
            inline.filter((token) => token.type !== "checkbox"),
          )}</span></label>`;
          head = first.type === "paragraph" ? `<p>${label}</p>` : label;
        }
        return `<li class="t-markdown-task">${head}${this.parser.parse(tokens)}</li>\n`;
      },
    },
  });
}

export interface RenderOptions {
  /** Cleans the HTML. In the browser: the function from sanitizerFor(). */
  readonly sanitize: (html: string) => string;
}

/** Renders Markdown (GitHub flavour: tables, task lists, strikethrough, autolinks) and cleans the result. */
export function renderMarkdown(source: string, options: RenderOptions): string {
  return options.sanitize(markdownParser().parse(source, { async: false }));
}

const FORBID_TAGS = [
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "form",
  "button",
  "select",
  "option",
  "textarea",
  "link",
  "meta",
  "base",
];

/**
 * Configures a DOMPurify instance (made with DOMPurify(window)) for Markdown and returns its cleaning step.
 * The instance gets hooks, so it must be one that nothing else uses.
 */
export function sanitizerFor(purify: DOMPurify, origin: string): (html: string) => string {
  purify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "id" || data.attrName === "name") data.attrValue = prefixId(data.attrValue);
    else if (data.attrName === "href") data.attrValue = fragmentHref(data.attrValue);
    else if (data.attrName === "class") {
      data.attrValue = keepClasses(data.attrValue);
      if (!data.attrValue) data.keepAttr = false;
    }
  });
  purify.addHook("afterSanitizeAttributes", (node) => {
    const tag = node.tagName.toLowerCase();
    if (tag === "a") {
      const href = node.getAttribute("href") ?? "";
      node.setAttribute("rel", "noopener noreferrer");
      if (isExternal(href, origin)) node.setAttribute("target", "_blank");
    } else if (tag === "img") {
      if (!imageAllowed(node.getAttribute("src") ?? "", origin)) node.remove();
      else node.setAttribute("loading", "lazy");
    } else if (tag === "input") {
      if (node.getAttribute("type") !== "checkbox") node.remove();
      else node.setAttribute("disabled", "");
    }
  });
  const config = {
    USE_PROFILES: { html: true },
    FORBID_TAGS,
    FORBID_ATTR: ["style", "target"],
    ALLOW_DATA_ATTR: false,
  };
  return (html) => purify.sanitize(html, config);
}
