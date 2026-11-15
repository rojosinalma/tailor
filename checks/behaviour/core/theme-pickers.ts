import type { Page } from "playwright";
import { behaviour } from "../../src/behaviour";

const mode = (page: Page) => page.evaluate(() => document.documentElement.dataset.mode);
const palette = (page: Page) => page.evaluate(() => document.documentElement.dataset.palette);

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
    await expect(page.getByRole("button", { name: "Dark mode" })).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Light mode" })).toHaveCount(0);
  },
  "on a phone the row wraps and never overflows": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const row = example("parts").locator(".t-theme-pickers").last();
    await expect(row.getByRole("button", { name: "Light mode" })).toBeVisible();
    const overflow = await row.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  },
});
