/** Syntax colouring that both kits share: highlight.js with the languages of the spec only. */

import type { LanguageFn } from "highlight.js";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import type spec from "./spec";
import { LANGUAGES } from "./spec";

export type Language = (typeof spec.props.language)[number];

const definitions: Record<(typeof LANGUAGES)[number], LanguageFn> = {
  bash,
  css,
  diff,
  dockerfile,
  go,
  ini,
  javascript,
  json,
  markdown,
  python,
  ruby,
  rust,
  sql,
  typescript,
  xml,
  yaml,
};
for (const name of LANGUAGES) hljs.registerLanguage(name, definitions[name]);

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

/** Reads a language from a `language-<name>` class; anything else is "auto". */
export function languageOf(className: string): Language {
  const name = /(?:^|\s)language-(\S+)/.exec(className)?.[1];
  return name === "text" || LANGUAGES.some((l) => l === name) ? (name as Language) : "auto";
}

/** The code as escaped HTML with `hljs-*` spans. "text" gives the escaped code without spans. */
export function highlightHtml(code: string, language: Language): string {
  if (language === "text") return escapeHtml(code);
  if (language === "auto") return hljs.highlightAuto(code, [...LANGUAGES]).value;
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

/**
 * Splits highlighted HTML into lines. A span that runs over a line break (a comment, a long string)
 * closes at the end of the line and opens again on the next, so each line is whole HTML on its own.
 */
export function splitLines(html: string): string[] {
  const lines: string[] = [];
  const open: string[] = [];
  let line = "";
  for (const token of html.split(/(<span[^>]*>|<\/span>|\n)/)) {
    if (token === "\n") {
      lines.push(line + "</span>".repeat(open.length));
      line = open.join("");
    } else {
      if (token.startsWith("<span")) open.push(token);
      else if (token === "</span>") open.pop();
      line += token;
    }
  }
  lines.push(line);
  return lines;
}

/** The highlighted HTML of a code block; with line numbers, one `t-highlight-line` span per line,
 * its code in an inner span: a table row would drop the spaces between its own inline children. */
export function highlightedHtml(code: string, language: Language, lineNumbers: boolean): string {
  const html = highlightHtml(code, language);
  if (!lineNumbers) return html;
  return splitLines(html.replace(/\n$/, ""))
    .map((line) => `<span class="t-highlight-line"><span>${line}\n</span></span>`)
    .join("");
}
