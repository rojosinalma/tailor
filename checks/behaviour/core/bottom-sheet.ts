import type { Page } from "playwright";
import { behaviour } from "../../src/behaviour";

/** Drags from the middle of the element down by a distance, with pointer events. */
async function swipe(page: Page, x: number, y: number, distance: number): Promise<void> {
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 5; step++) await page.mouse.move(x, y + (distance * step) / 5);
  await page.mouse.up();
}

export default behaviour(
  "bottom-sheet",
  {
    "opens from the bottom with the focus inside": async ({ page, example, expect }) => {
      await example("choices").getByRole("button", { name: "Actions for web-1" }).click();
      const sheet = page.getByRole("dialog", { name: "web-1" });
      await expect(sheet).toBeVisible();
      await expect.poll(() => sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      const box = await sheet.boundingBox();
      expect(box?.width).toBe(390);
      expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
    },
    "a downward swipe on the header closes it": async ({ page, example, expect }) => {
      const trigger = example("choices").getByRole("button", { name: "Actions for web-1" });
      await trigger.click();
      const sheet = page.getByRole("dialog", { name: "web-1" });
      await expect(sheet).toBeVisible();
      const title = await sheet.locator(".t-drawer-title").boundingBox();
      const height = (await sheet.boundingBox())?.height ?? 0;
      await swipe(page, (title?.x ?? 0) + 10, (title?.y ?? 0) + 5, height / 2);
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
    },
    "a short swipe leaves it open": async ({ page, example, expect }) => {
      await example("choices").getByRole("button", { name: "Actions for web-1" }).click();
      const sheet = page.getByRole("dialog", { name: "web-1" });
      await expect(sheet).toBeVisible();
      const title = await sheet.locator(".t-drawer-title").boundingBox();
      await swipe(page, (title?.x ?? 0) + 10, (title?.y ?? 0) + 5, 20);
      await page.waitForTimeout(200);
      await expect(sheet).toBeVisible();
      const box = await sheet.boundingBox();
      expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
    },
    "Escape closes it": async ({ page, example, expect }) => {
      await example("form").getByRole("button", { name: "Rename web-1" }).click();
      const sheet = page.getByRole("dialog", { name: "Rename web-1" });
      await expect(sheet).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
    },
    "a click on the backdrop closes it": async ({ page, example, expect }) => {
      await example("form").getByRole("button", { name: "Rename web-1" }).click();
      const sheet = page.getByRole("dialog", { name: "Rename web-1" });
      await expect(sheet).toBeVisible();
      await page.mouse.click(195, 20);
      await expect(sheet).toBeHidden();
    },
    "a choice closes it": async ({ page, example, expect }) => {
      await example("choices").getByRole("button", { name: "Actions for web-1" }).click();
      const sheet = page.getByRole("dialog", { name: "web-1" });
      await sheet.getByRole("button", { name: "Show the log" }).click();
      await expect(sheet).toBeHidden();
    },
  },
  { viewport: { width: 390, height: 800 } },
);
