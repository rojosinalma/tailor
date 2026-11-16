import { behaviour } from "../../src/behaviour";

export default behaviour("popover", {
  "opens from its trigger and takes the focus": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Share" });
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Share web-1" });
    await expect(popover).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => popover.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expect(popover.getByRole("button", { name: "Close" })).toBeHidden();
  },
  "Escape closes it and the focus returns to the trigger": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Share" });
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Share web-1" });
    await expect(popover).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
  "a click outside closes it": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Share" }).click();
    const popover = page.getByRole("dialog", { name: "Share web-1" });
    await expect(popover).toBeVisible();
    await page.mouse.click(5, 790);
    await expect(popover).toBeHidden();
  },
  "it sits next to its trigger on the asked side": async ({ page, example, expect }) => {
    const trigger = example("sides").getByRole("button", { name: "Above" });
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Above" });
    await expect(popover).toBeVisible();
    const p = await popover.boundingBox();
    const t = await trigger.boundingBox();
    expect((p?.y ?? 0) + (p?.height ?? 0)).toBeLessThanOrEqual((t?.y ?? 0) + 1);
  },
  "on a phone it is a bottom sheet with a close button": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const trigger = example("default").getByRole("button", { name: "Share" });
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Share web-1" });
    await expect(popover).toBeVisible();
    const box = await popover.boundingBox();
    expect(box?.width).toBe(390);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
    await popover.getByRole("button", { name: "Close" }).click();
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  },
});
