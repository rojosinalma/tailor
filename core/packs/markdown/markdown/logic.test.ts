import { describe, expect, test } from "bun:test";
import {
  escapeScript,
  fragmentHref,
  imageAllowed,
  isExternal,
  keepClasses,
  prefixId,
  renderMarkdown,
  slug,
  unescapeScript,
} from "./logic";

const ORIGIN = "https://app.example.com";
const plain = (source: string): string => renderMarkdown(source, { sanitize: (html) => html });

describe("renderMarkdown", () => {
  test("passes the HTML through the sanitiser", () => {
    expect(renderMarkdown("# Hi", { sanitize: () => "clean" })).toBe("clean");
  });

  test("renders GitHub tables, strikethrough and autolinks; line breaks stay off", () => {
    const html = plain("| a | b |\n|---|---|\n| 1 | 2 |\n\n~~old~~ www.example.com\nnext line");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("<del>old</del>");
    expect(html).toContain('<a href="http://www.example.com">www.example.com</a>');
    expect(html).not.toContain("<br>");
  });

  test("gives headings slugged, prefixed and unique ids", () => {
    const html = plain("## Before you *start*\n\n## Before you start\n\n### Ünïcode & more!");
    expect(html).toContain('<h2 id="user-content-before-you-start">Before you <em>start</em></h2>');
    expect(html).toContain('<h2 id="user-content-before-you-start-1">');
    expect(html).toContain('<h3 id="user-content-ünïcode-more">');
  });

  test("keeps the language of a code block and the code-block look", () => {
    const html = plain("```yaml title\nkey: <value>\n```");
    expect(html).toContain(
      '<pre class="t-code-pre"><code class="language-yaml">key: &lt;value&gt;\n</code></pre>',
    );
    expect(plain("```\nx\n```")).toContain('<pre class="t-code-pre"><code>x');
  });

  test("draws tasks as read-only check boxes inside a label with the text", () => {
    const html = plain("- [x] Done *now*\n- [ ] Open\n- plain");
    expect(html).toContain(
      '<li class="t-markdown-task"><label class="t-markdown-check"><input type="checkbox" disabled="" checked=""><span class="t-markdown-box"></span><span>Done <em>now</em></span></label></li>',
    );
    expect(html).toContain(
      '<input type="checkbox" disabled=""><span class="t-markdown-box"></span><span>Open</span>',
    );
    expect(html).toContain("<li>plain</li>");
  });

  test("a loose task list keeps its paragraphs", () => {
    const html = plain("- [x] One\n\n- [ ] Two\n");
    expect(html).toContain('<li class="t-markdown-task"><p><label class="t-markdown-check">');
    expect(html).toContain("<span>Two</span></label></p>");
  });

  test("a task with a nested list keeps the nested list after the label", () => {
    const html = plain("- [ ] Parent\n  - child");
    expect(html).toMatch(/<span>Parent<\/span><\/label><ul>\s*<li>child<\/li>/);
  });
});

describe("the rules of the cleaning step", () => {
  test("ids and fragment links get the prefix once", () => {
    expect(prefixId("intro")).toBe("user-content-intro");
    expect(prefixId("user-content-intro")).toBe("user-content-intro");
    expect(fragmentHref("#intro")).toBe("#user-content-intro");
    expect(fragmentHref("#")).toBe("#");
    expect(fragmentHref("/docs#intro")).toBe("/docs#intro");
  });

  test("slug", () => {
    expect(slug("  Hello,  World  ")).toBe("hello-world");
    expect(slug("a &amp; b")).toBe("a-b");
    expect(slug("!!!")).toBe("");
  });

  test("a link is external when it leaves the origin over http or https", () => {
    expect(isExternal("https://example.com/x", ORIGIN)).toBe(true);
    expect(isExternal("http://app.example.com/x", ORIGIN)).toBe(true);
    expect(isExternal("/docs", ORIGIN)).toBe(false);
    expect(isExternal("https://app.example.com/docs", ORIGIN)).toBe(false);
    expect(isExternal("#top", ORIGIN)).toBe(false);
    expect(isExternal("mailto:alice@example.com", ORIGIN)).toBe(false);
  });

  test("images load only from https, data:image and the same origin", () => {
    expect(imageAllowed("https://example.com/a.png", ORIGIN)).toBe(true);
    expect(imageAllowed("data:image/svg+xml,%3Csvg%3E", ORIGIN)).toBe(true);
    expect(imageAllowed("data:image/png;base64,AAAA", ORIGIN)).toBe(true);
    expect(imageAllowed("/media/a.png", ORIGIN)).toBe(true);
    expect(imageAllowed("http://example.com/a.png", ORIGIN)).toBe(false);
    expect(imageAllowed("data:text/html,<b>x</b>", ORIGIN)).toBe(false);
    expect(imageAllowed("javascript:alert(1)", ORIGIN)).toBe(false);
    expect(imageAllowed("", ORIGIN)).toBe(false);
  });

  test("only the renderer's classes and code languages survive", () => {
    expect(keepClasses("language-ts t-btn evil t-code-pre")).toBe("language-ts t-code-pre");
    expect(keepClasses("t-dialog")).toBe("");
  });
});

describe("the source inside a script element", () => {
  test("cannot end the script and comes back exactly", () => {
    const sources = [
      "a </script><script>alert(1)</script>",
      "</SCRIPT >",
      "<!-- <script>",
      "already <\\/script and <\\\\!-- here",
      "plain text",
    ];
    for (const source of sources) {
      const escaped = escapeScript(source);
      expect(escaped.toLowerCase()).not.toContain("</script");
      expect(escaped).not.toContain("<!--");
      expect(unescapeScript(escaped)).toBe(source);
    }
  });
});
