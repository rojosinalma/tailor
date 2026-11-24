import { behaviour } from "../../src/behaviour";

export default behaviour("select", {
  "a long list opens at the chosen value": async ({ page, example, expect }) => {
    await example("long").getByRole("combobox", { name: "Time zone" }).click();
    await expect(page.getByRole("option", { name: "Pacific/Auckland" })).toBeInViewport();
  },
  "shows the placeholder, then the picked value": async ({ page, example, expect }) => {
    const body = example("default");
    const trigger = body.getByRole("combobox", { name: "Host" });
    await expect(trigger).toContainText("Pick a host");
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.getByRole("option", { name: "web-2" }).click();
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(trigger).toContainText("web-2");
    await expect(body.locator('[name="host"]')).toHaveValue("web-2");
  },
  "a disabled option cannot be picked": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("combobox", { name: "Host" });
    await trigger.click();
    await page.getByRole("option", { name: "console" }).click({ force: true });
    await expect(trigger).toContainText("Pick a host");
  },
  "the keyboard opens the list, moves and picks": async ({ page, example, expect }) => {
    const body = example("default");
    const trigger = body.getByRole("combobox", { name: "Host" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(body.locator('[name="host"]')).toHaveValue("nas");
    await expect(trigger).toBeFocused();
  },
  "Escape closes the list and keeps the value": async ({ page, example, expect }) => {
    const trigger = example("value").getByRole("combobox", { name: "Medium host" });
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "web-2" })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(trigger).toContainText("web-2");
    await expect(trigger).toBeFocused();
  },
  "a click outside closes the list": async ({ page, example, expect }) => {
    await example("default").getByRole("combobox", { name: "Host" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.mouse.click(900, 600);
    await expect(page.getByRole("listbox")).toBeHidden();
  },
  "a disabled select does not open": async ({ page, example, expect }) => {
    const trigger = example("disabled").getByRole("combobox", { name: "Locked host" });
    await expect(trigger).toBeDisabled();
    await trigger.click({ force: true });
    await expect(page.getByRole("listbox")).toBeHidden();
  },
  "on a phone the list is a sheet at the bottom of the screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("combobox", { name: "Host" }).click();
    const popup = page.locator(".t-select-popup");
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box?.width).toBe(390);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
  },
});
