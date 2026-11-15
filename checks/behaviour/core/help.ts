import { behaviour } from "../../src/behaviour";

export default behaviour("help", {
  "the button opens the explanation": async ({ page, example, expect }) => {
    const button = example("default").getByRole("button", { name: "About uptime" });
    await button.click();
    const popover = page.getByRole("dialog", { name: "About uptime" });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("The share of the last 30 days");
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(button).toBeFocused();
  },
  "the default name and the keyboard": async ({ page, example, expect }) => {
    const button = example("tones").getByRole("button", { name: "More information" }).last();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "More information" })).toContainText("info");
  },
  "it sits on the text line": async ({ example, expect }) => {
    const line = example("default").locator("p").first();
    const button = example("default").getByRole("button", { name: "About uptime" });
    const l = await line.boundingBox();
    const b = await button.boundingBox();
    expect(b?.height).toBeLessThan(30);
    expect(b?.y ?? 0).toBeGreaterThanOrEqual((l?.y ?? 0) - 2);
    expect((b?.y ?? 0) + (b?.height ?? 0)).toBeLessThanOrEqual((l?.y ?? 0) + (l?.height ?? 0) + 2);
  },
});
