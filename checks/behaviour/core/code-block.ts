import { behaviour } from "../../src/behaviour";

export default behaviour("code-block", {
  "the copy button copies the code and shows a check for a moment": async ({ page, example, expect }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const body = example("titled");
    const button = body.getByRole("button", { name: "Copy" });
    await button.click();
    await expect(body.getByRole("button", { name: "Copied" })).toHaveAttribute("data-copied", "");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("image: nginx:1.27");
    expect(copied.startsWith("services:")).toBe(true);
    await expect(body.getByRole("button", { name: "Copy" })).toBeVisible({ timeout: 4000 });
  },
  "long code scrolls sideways inside the block and takes the focus": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const code = example("scroll").getByRole("group", { name: "Request for the services of nas" });
    await code.focus();
    await expect(code).toBeFocused();
    const before = await code.evaluate((el) => el.scrollLeft);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("End");
    await expect.poll(() => code.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
    const page390 = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(page390).toBeLessThanOrEqual(390);
  },
  "wrapped code does not scroll": async ({ example, expect }) => {
    const pre = example("wrap").locator("pre");
    expect(await pre.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect(pre).not.toHaveAttribute("tabindex");
  },
});
