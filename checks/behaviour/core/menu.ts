import { behaviour } from "../../src/behaviour";

export default behaviour("menu", {
  "a click opens the menu and a click on an item closes it": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Actions", exact: true });
    await trigger.click();
    const menu = page.getByRole("menu", { name: "Service actions" });
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await menu.getByRole("menuitem", { name: "Copy address" }).click();
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  },
  "the keyboard opens, moves, activates and returns the focus": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Actions", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu", { name: "Service actions" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Restart" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Copy address" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(menu.getByRole("menuitem", { name: "Delete service" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(menu.getByRole("menuitem", { name: "Restart" })).toBeFocused();
    await page.keyboard.press("o");
    await expect(menu.getByRole("menuitem", { name: "Open docs" })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(menu.getByRole("menuitem", { name: "Copy address" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Restart" })).toBeFocused();
    await page.keyboard.press(" ");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "Escape closes the menu and the focus returns to the trigger": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Actions", exact: true });
    await trigger.click();
    const menu = page.getByRole("menu", { name: "Service actions" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "a disabled item takes the highlight but does nothing": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Actions", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowUp");
    const menu = page.getByRole("menu", { name: "Service actions" });
    const stop = menu.getByRole("menuitem", { name: "Stop" });
    await expect(stop).toBeDisabled();
    await page.keyboard.press("ArrowUp");
    await expect(stop).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await stop.click({ force: true });
    await expect(menu).toBeVisible();
  },
  "a checkbox item and a radio item keep the menu open": async ({ page, example, expect }) => {
    await example("choices").getByRole("button", { name: "View" }).click();
    const menu = page.getByRole("menu", { name: "View options" });
    const uptime = menu.getByRole("menuitemcheckbox", { name: "Uptime" });
    await expect(uptime).toHaveAttribute("aria-checked", "false");
    await uptime.click();
    await expect(menu).toBeVisible();
    await expect(uptime).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Enter");
    await expect(uptime).toHaveAttribute("aria-checked", "false");
    await menu.getByRole("menuitemradio", { name: "Age" }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitemradio", { name: "Age" })).toHaveAttribute("aria-checked", "true");
    await expect(menu.getByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "false");
    await expect(menu.getByRole("group", { name: "Sort by" })).toBeVisible();
  },
  "a click outside closes the menu": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Actions", exact: true }).click();
    const menu = page.getByRole("menu", { name: "Service actions" });
    await expect(menu).toBeVisible();
    await page.mouse.click(900, 700);
    await expect(menu).toBeHidden();
  },
  "an item with an address is a link": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Actions", exact: true }).click();
    const link = page.getByRole("menu").getByRole("menuitem", { name: "Open docs" });
    await expect(link).toHaveAttribute("href", "https://example.com/docs");
  },
  "on a phone the menu is a sheet at the bottom of the screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("button", { name: "Actions", exact: true }).click();
    const menu = page.getByRole("menu", { name: "Service actions" });
    await expect(menu).toBeVisible();
    await expect
      .poll(async () => {
        const box = await menu.boundingBox();
        return [box?.width, Math.round((box?.y ?? 0) + (box?.height ?? 0))];
      })
      .toEqual([390, 800]);
  },
});
