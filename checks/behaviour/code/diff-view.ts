import { behaviour } from "../../src/behaviour";

export default behaviour("diff-view", {
  "lines carry their change, sign and numbers": async ({ example, expect }) => {
    const body = example("unified");
    await expect(body.locator("[data-change='add']")).toHaveCount(4);
    await expect(body.locator("[data-change='remove']")).toHaveCount(3);
    await expect(body.locator("[data-change='add']").first()).toContainText("+port = 8080");
    await expect(body).toContainText("4 lines added, 3 removed");
  },
  "split shows two columns in a wide box and unified in a narrow one": async ({ example, expect }) => {
    await expect(example("split").locator("[data-layout='split']")).toBeVisible();
    await expect(example("split").locator("[data-layout='unified']")).toBeHidden();
    await expect(example("narrow").locator("[data-layout='split']")).toBeHidden();
    await expect(example("narrow").locator("[data-layout='unified']")).toBeVisible();
  },
  "a patch of two files names each file": async ({ example, expect }) => {
    const hunks = example("patch").locator(".t-diff-hunk");
    await expect(hunks).toHaveText(["compose.yaml @@ -1,6 +1,6 @@", ".env.example @@ -1,2 +1,3 @@"]);
  },
  "long lines scroll sideways with the keyboard": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const region = example("scroll").getByRole("region", { name: "app.service" });
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("End");
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
  "a selection leaves the numbers and signs out": async ({ example, expect }) => {
    const text = await example("unified")
      .locator("[data-layout='unified']")
      .evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        const out = selection?.toString() ?? "";
        selection?.removeAllRanges();
        return out;
      });
    expect(text).toContain("port = 8080");
    expect(text).not.toMatch(/^\s*\d/m);
  },
  "equal texts say there are no changes": async ({ example, expect }) => {
    await expect(example("none")).toContainText("No changes");
  },
});
