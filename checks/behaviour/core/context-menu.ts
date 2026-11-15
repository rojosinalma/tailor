import { behaviour } from "../../src/behaviour";

export default behaviour("context-menu", {
  "a right click opens the menu at the pointer": async ({ page, example, expect }) => {
    const area = example("default").getByText("web-1.example.com");
    const box = await area.boundingBox();
    const x = (box?.x ?? 0) + 40;
    const y = (box?.y ?? 0) + 5;
    await page.mouse.click(x, y, { button: "right" });
    const menu = page.getByRole("menu", { name: "Host actions" });
    await expect(menu).toBeVisible();
    const at = await menu.boundingBox();
    expect(Math.abs((at?.x ?? 0) - x)).toBeLessThan(12);
    expect(Math.abs((at?.y ?? 0) - y)).toBeLessThan(12);
    await menu.getByRole("menuitem", { name: "Copy address" }).click();
    await expect(menu).toBeHidden();
  },
  "the keyboard opens, moves and closes it": async ({ page, example, expect }) => {
    const link = example("default").getByRole("link", { name: "web-1" });
    await link.focus();
    await page.keyboard.press("Shift+F10");
    const menu = page.getByRole("menu", { name: "Host actions" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Restart" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(menu.getByRole("menuitem", { name: "Delete host" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(link).toBeFocused();
  },
  "a click outside closes it": async ({ page, example, expect }) => {
    const area = example("default").getByText("web-1.example.com");
    await area.click({ button: "right" });
    const menu = page.getByRole("menu", { name: "Host actions" });
    await expect(menu).toBeVisible();
    await page.mouse.click(900, 700);
    await expect(menu).toBeHidden();
  },
});
