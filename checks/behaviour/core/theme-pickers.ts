import type { Locator, Page } from "playwright";
import { behaviour } from "../../src/behaviour";

const mode = (page: Page) => page.evaluate(() => document.documentElement.dataset.mode);
const palette = (page: Page) => page.evaluate(() => document.documentElement.dataset.palette);
const skin = (page: Page) => page.evaluate(() => document.documentElement.dataset.skin);
const themeButton = (body: Locator) => body.getByRole("button", { name: /^Theme:/ });

export default behaviour("theme-pickers", {
  "the mode toggle flips the mode, its label and its glyph, and the choice survives a reload": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("default");
    expect(await mode(page)).toBe("dark");
    const toLight = body.getByRole("button", { name: "Light mode" });
    const before = await toLight.locator("svg").innerHTML();
    await toLight.click();
    expect(await mode(page)).toBe("light");
    const toDark = body.getByRole("button", { name: "Dark mode" });
    await expect(toDark).toBeVisible();
    expect(await toDark.locator("svg").innerHTML()).not.toBe(before);
    await page.reload();
    await page.locator(".sc-example").first().waitFor();
    expect(await mode(page)).toBe("light");
    await expect(example("default").getByRole("button", { name: "Dark mode" })).toBeVisible();
  },
  "the keyboard flips the mode": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Light mode" }).focus();
    await page.keyboard.press("Enter");
    expect(await mode(page)).toBe("light");
    await expect(example("default").getByRole("button", { name: "Dark mode" })).toBeFocused();
  },
  "the palette select changes the palette, and the choice survives a reload": async ({
    page,
    example,
    expect,
  }) => {
    const select = example("default").getByRole("combobox", { name: "Palette" });
    await expect(select).toContainText("Gruvbox");
    await select.click();
    const names = await page.getByRole("option").allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    await page.getByRole("option", { name: "Nord" }).click();
    await expect(select).toContainText("Nord");
    expect(await palette(page)).toBe("nord");
    await page.reload();
    await page.locator(".sc-example").first().waitFor();
    expect(await palette(page)).toBe("nord");
    await expect(example("default").getByRole("combobox", { name: "Palette" })).toContainText("Nord");
  },
  "two picker groups on one page stay in step": async ({ page, example, expect }) => {
    await example("parts").getByRole("combobox", { name: "Palette" }).click();
    await page.getByRole("option", { name: "Dracula" }).click();
    await expect(example("default").getByRole("combobox", { name: "Palette" })).toContainText("Dracula");
    await example("default").getByRole("button", { name: "Light mode" }).click();
    await expect(page.getByRole("button", { name: "Dark mode" })).toHaveCount(5);
    await expect(page.getByRole("button", { name: "Light mode" })).toHaveCount(0);
  },
  "on a phone the row wraps and never overflows": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const row = example("parts").locator(".t-theme-pickers").last();
    await expect(row.getByRole("button", { name: "Light mode" })).toBeVisible();
    const overflow = await row.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  },
  "compact: the button shows the skin and the palette, and its name holds that text": async ({
    example,
    expect,
  }) => {
    const [full, palettes] = [
      themeButton(example("compact")).first(),
      themeButton(example("compact")).last(),
    ];
    await expect(full).toHaveText("Bootstrap · Gruvbox");
    await expect(full).toHaveAccessibleName("Theme: Bootstrap, Gruvbox");
    await expect(palettes).toHaveText("Gruvbox");
    await expect(palettes).toHaveAccessibleName("Theme: Gruvbox");
  },
  "compact: a click opens the popover with the two selects; a change applies at once": async ({
    page,
    example,
    expect,
  }) => {
    const trigger = themeButton(example("compact")).first();
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Theme" });
    await expect(popover).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => popover.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await popover.getByRole("combobox", { name: "Palette" }).click();
    await page.getByRole("option", { name: "Nord" }).click();
    expect(await palette(page)).toBe("nord");
    await expect(popover).toBeVisible();
    await popover.getByRole("combobox", { name: "Skin" }).click();
    await page.getByRole("option", { name: "Pico" }).click();
    expect(await skin(page)).toBe("pico");
    await expect(popover).toBeVisible();
    await expect(trigger).toHaveText("Pico · Nord");
    await expect(trigger).toHaveAccessibleName("Theme: Pico, Nord");
    await expect(themeButton(example("compact")).last()).toHaveText("Nord");
  },
  "compact: the keyboard opens it; Escape closes an open select first, then the popover": async ({
    page,
    example,
    expect,
  }) => {
    const trigger = themeButton(example("compact")).first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    const popover = page.getByRole("dialog", { name: "Theme" });
    await expect(popover).toBeVisible();
    const select = popover.getByRole("combobox", { name: "Skin" });
    await select.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(popover).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
  "compact: a click outside closes the popover": async ({ page, example, expect }) => {
    await themeButton(example("compact")).first().click();
    const popover = page.getByRole("dialog", { name: "Theme" });
    await expect(popover).toBeVisible();
    await page.mouse.click(5, 890);
    await expect(popover).toBeHidden();
  },
  "compact: the mode button sits outside the popover and flips the mode in one click": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("compact");
    await body.getByRole("button", { name: "Light mode" }).first().click();
    expect(await mode(page)).toBe("light");
    await expect(page.getByRole("dialog", { name: "Theme" })).toBeHidden();
    await expect(body.getByRole("button", { name: "Dark mode" })).toHaveCount(2);
  },
  "compact on a phone: one row that never overflows, and the popover is a bottom sheet": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const row = example("compact").locator(".t-theme-pickers").first();
    const trigger = themeButton(row);
    const mode = row.getByRole("button", { name: "Light mode" });
    const [a, b] = [await trigger.boundingBox(), await mode.boundingBox()];
    expect(Math.abs((a?.y ?? 0) - (b?.y ?? 0))).toBeLessThanOrEqual(4);
    expect(await row.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Theme" });
    await expect(popover).toBeVisible();
    const box = await popover.boundingBox();
    expect(box?.width).toBe(390);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
    await popover.getByRole("button", { name: "Close" }).click();
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  },
});
