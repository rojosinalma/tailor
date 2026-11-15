import { behaviour } from "../../src/behaviour";

// Base UI gives the tooltip no role (it only repeats the name), so the tests find it by its class.

export default behaviour("tooltip", {
  "keyboard focus shows it, blur hides it": async ({ page, example, expect }) => {
    const edit = example("default").getByRole("button", { name: "Edit" });
    await page.keyboard.press("Tab");
    await expect(edit).toBeFocused();
    const tip = page.locator(".t-tooltip");
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText("Edit");
    await page.keyboard.press("Tab");
    await expect(page.locator(".t-tooltip", { hasText: "Copy" })).toBeVisible();
    await expect(page.locator(".t-tooltip", { hasText: "Edit" })).toHaveCount(0);
    await example("default").getByRole("button", { name: "Copy" }).blur();
    await expect(page.locator(".t-tooltip")).toBeHidden();
  },
  "Escape hides it": async ({ page, expect }) => {
    await page.keyboard.press("Tab");
    await expect(page.locator(".t-tooltip")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".t-tooltip")).toBeHidden();
  },
  "hover shows it above the control": async ({ page, example, expect }) => {
    const remove = example("default").getByRole("button", { name: "Remove" });
    await remove.hover();
    const tip = page.locator(".t-tooltip");
    await expect(tip).toHaveText("Remove");
    const t = await tip.boundingBox();
    const b = await remove.boundingBox();
    expect((t?.y ?? 0) + (t?.height ?? 0)).toBeLessThanOrEqual(b?.y ?? 0);
    await page.mouse.move(5, 5);
    await expect(page.locator(".t-tooltip")).toBeHidden();
  },
  "the control keeps its own name": async ({ example, expect }) => {
    await expect(example("default").getByRole("button", { name: "Remove" })).toHaveAttribute(
      "aria-label",
      "Remove",
    );
  },
  "on a phone it stays next to the control": async ({ page, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.keyboard.press("Tab");
    const box = await page.locator(".t-tooltip").boundingBox();
    expect(box?.width).toBeLessThan(200);
  },
});
