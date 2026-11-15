import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The values the form sends under a name, in both kits. */
const sent = (body: Locator, name: string): Promise<string[]> =>
  body.evaluate((root, key) => {
    const form = document.createElement("form");
    const data = new FormData(form);
    for (const el of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${key}"]`)) {
      if (el instanceof HTMLSelectElement) for (const o of el.selectedOptions) data.append(key, o.value);
      else data.append(key, el.value);
    }
    return data.getAll(key).map(String);
  }, name);

export default behaviour("multi-select", {
  "typing filters the list; Enter picks and the list stays open": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("combobox", { name: "Hosts" }).click();
    await page.keyboard.type("web");
    await expect(page.getByRole("option")).toHaveText(["web-1", "web-2"]);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option", { name: "web-1" })).toHaveAttribute("aria-selected", "true");
    await expect(body.locator(".t-chip")).toHaveText(["web-1", "web-2"]);
    expect(await sent(body, "hosts")).toEqual(["web-1", "web-2"]);
  },
  "a click picks and unpicks an option": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("combobox", { name: "Hosts" }).click();
    await page.getByRole("option", { name: "nas" }).click();
    await expect(body.locator(".t-chip")).toHaveText(["nas"]);
    await page.getByRole("option", { name: "nas" }).click();
    await expect(body.locator(".t-chip")).toHaveCount(0);
    await page.getByRole("option", { name: "console" }).click({ force: true });
    await expect(body.locator(".t-chip")).toHaveCount(0);
  },
  "a chip's remove button removes its value": async ({ example, expect }) => {
    const body = example("value");
    await body.getByRole("button", { name: "Remove web-1" }).nth(1).click();
    expect(await sent(body, "picked")).toEqual(["nas"]);
  },
  "Backspace in the empty input removes the last chip": async ({ page, example, expect }) => {
    const body = example("value");
    await body.getByRole("combobox", { name: "Medium hosts" }).click();
    await page.keyboard.press("Backspace");
    expect(await sent(body, "picked")).toEqual(["web-1"]);
  },
  "ArrowLeft and ArrowRight move between the chips; Delete removes one": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("value");
    const input = body.getByRole("combobox", { name: "Medium hosts" });
    await input.click();
    await page.keyboard.press("ArrowLeft");
    const chips = body.locator(".t-multi-select").nth(1).locator(".t-chip");
    await expect(chips.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(chips.nth(0)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(input).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Delete");
    expect(await sent(body, "picked")).toEqual(["web-1"]);
  },
  "Escape closes the list, a second Escape clears the values": async ({ page, example, expect }) => {
    const body = example("value");
    await body.getByRole("combobox", { name: "Medium hosts" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    expect(await sent(body, "picked")).toEqual(["web-1", "nas"]);
    await page.keyboard.press("Escape");
    expect(await sent(body, "picked")).toEqual([]);
  },
  "text that matches nothing shows no results": async ({ page, example, expect }) => {
    await example("default").getByRole("combobox", { name: "Hosts" }).click();
    await page.keyboard.type("zzz");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.getByText("No results")).toBeVisible();
  },
  "max limits the picks": async ({ page, example, expect }) => {
    const body = example("descriptions");
    await body.getByRole("combobox", { name: "Roles" }).click();
    await page.getByRole("option", { name: /^Read/ }).click();
    await page.getByRole("option", { name: /^Deploy/ }).click();
    await page.getByRole("option", { name: /^Administer/ }).click({ force: true });
    expect(await sent(body, "roles")).toEqual(["read", "deploy"]);
  },
  "with allowCustom, Enter adds typed text as a value": async ({ page, example, expect }) => {
    const body = example("custom");
    await body.getByRole("combobox", { name: "Tags" }).click();
    await page.keyboard.type("blue");
    await page.keyboard.press("Enter");
    await expect(body.locator(".t-chip")).toHaveText(["blue"]);
    expect(await sent(body, "tags")).toEqual(["blue"]);
  },
  "a disabled multi-select does not open": async ({ page, example, expect }) => {
    const input = example("disabled").getByRole("combobox", { name: "Locked hosts" });
    await expect(input).toBeDisabled();
    await input.click({ force: true });
    await expect(page.getByRole("listbox")).toBeHidden();
  },
  "in a field, the label focuses it and the messages describe it": async ({ example, expect }) => {
    const body = example("field");
    const input = body.getByRole("combobox", { name: "Notify" });
    await body.locator(".t-field-label").click();
    await expect(input).toBeFocused();
    await expect(input).toHaveAccessibleDescription("Each one gets the alert. Pick at most three.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  },
  "on a phone the list is a sheet at the bottom of the screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("combobox", { name: "Hosts" }).click();
    const popup = page.locator(".t-multi-select-popup");
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box?.width).toBe(390);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
  },
});
