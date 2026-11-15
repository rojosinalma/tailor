import { behaviour } from "../../src/behaviour";

export default behaviour("highlight", {
  "the code carries syntax colours after load": async ({ example, expect }) => {
    const code = example("sql").locator("code");
    await expect(code.locator(".hljs-keyword").first()).toHaveText("SELECT");
    await expect(code.locator(".hljs-comment")).toHaveCount(1);
  },
  "plain text stays plain": async ({ example, expect }) => {
    const code = example("text").locator("code");
    await expect(code).toContainText("web-1");
    await expect(code.locator("[class^='hljs-']")).toHaveCount(0);
  },
  "the copy button copies the plain code": async ({ page, example, expect }) => {
    // The system clipboard is shared by the tests that run at the same time: catch the copy in the page.
    await page.evaluate(() => {
      const holder = window as unknown as { copied?: string };
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            holder.copied = text;
          },
        },
      });
    });
    const body = example("line-numbers");
    await body.getByRole("button", { name: "Copy" }).click();
    await expect(body.getByRole("button", { name: "Copied" })).toHaveAttribute("data-copied", "");
    const copied = await page.evaluate(() => (window as unknown as { copied?: string }).copied ?? "");
    expect(copied.startsWith('import { readFile } from "node:fs/promises";')).toBe(true);
    expect(copied).not.toContain("hljs");
  },
  "line numbers stay out of a selection": async ({ page, example, expect }) => {
    const code = example("line-numbers").locator("code");
    await expect(code.locator(".t-highlight-line")).toHaveCount(7);
    const selected = await code.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return selection?.toString() ?? "";
    });
    expect(selected.startsWith("import")).toBe(true);
    expect(selected).not.toMatch(/^\s*\d/m);
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
  },
  "long code scrolls sideways with the keyboard": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const code = example("scroll").getByRole("group", { name: "Hosts response" });
    await code.focus();
    await expect(code).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("End");
    await expect.poll(() => code.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
});
