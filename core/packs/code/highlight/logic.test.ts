import { describe, expect, test } from "bun:test";
import { escapeHtml, highlightHtml, languageOf, splitLines } from "./logic";

describe("highlightHtml", () => {
  test("colours a known language with hljs spans", () => {
    const html = highlightHtml("SELECT name FROM hosts;", "sql");
    expect(html).toContain('<span class="hljs-keyword">SELECT</span>');
  });
  test("text stays plain and escaped", () => {
    expect(highlightHtml("<b>&</b>", "text")).toBe("&lt;b&gt;&amp;&lt;/b&gt;");
  });
  test("escapes markup in coloured code", () => {
    expect(highlightHtml('const a = "<img>";', "javascript")).not.toContain("<img>");
  });
  test("auto picks a language", () => {
    expect(highlightHtml('{ "name": "web-1", "port": 8080 }', "auto")).toContain("hljs-");
  });
});

describe("languageOf", () => {
  test("reads the class", () => {
    expect(languageOf("language-yaml")).toBe("yaml");
    expect(languageOf("x language-text")).toBe("text");
  });
  test("an unknown or missing language is auto", () => {
    expect(languageOf("language-cobol")).toBe("auto");
    expect(languageOf("")).toBe("auto");
  });
});

describe("splitLines", () => {
  test("one entry per line, the last one too", () => {
    expect(splitLines("a\nb\n")).toEqual(["a", "b", ""]);
  });
  test("a span over a line break closes and opens again", () => {
    expect(splitLines('<span class="hljs-comment">/* a\nb */</span> c')).toEqual([
      '<span class="hljs-comment">/* a</span>',
      '<span class="hljs-comment">b */</span> c',
    ]);
  });
  test("nested spans reopen in order", () => {
    const lines = splitLines('<span class="x"><span class="y">1\n2</span></span>');
    expect(lines[1]).toBe('<span class="x"><span class="y">2</span></span>');
  });
  test("escapeHtml", () => {
    expect(escapeHtml(`'"`)).toBe("&#39;&quot;");
  });
});
