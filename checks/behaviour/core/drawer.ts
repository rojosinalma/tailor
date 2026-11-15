import { behaviour } from "../../src/behaviour";

export default behaviour("drawer", {
  "opens from its trigger at the end and takes the focus": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Host details" }).click();
    const drawer = page.getByRole("dialog", { name: "Host details" });
    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    const box = await drawer.boundingBox();
    expect(Math.round((box?.x ?? 0) + (box?.width ?? 0))).toBe(1280);
    expect(box?.height).toBe(800);
  },
  "Escape closes it and the focus returns to the trigger": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Host details" });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Host details" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "the close button, a footer button and the backdrop close it": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Host details" });
    const drawer = page.getByRole("dialog", { name: "Host details" });
    await trigger.click();
    await drawer.getByRole("button", { name: "Close" }).click();
    await expect(drawer).toBeHidden();
    await trigger.click();
    await drawer.getByRole("button", { name: "Cancel" }).click();
    await expect(drawer).toBeHidden();
    await trigger.click();
    await expect(drawer).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(drawer).toBeHidden();
  },
  "the Tab key stays inside the drawer": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Host details" }).click();
    const drawer = page.getByRole("dialog", { name: "Host details" });
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  },
  "the start side and the bottom side": async ({ page, example, expect }) => {
    const body = example("sides");
    await body.getByRole("button", { name: "Filters" }).click();
    const start = page.getByRole("dialog", { name: "Filters" });
    await expect(start).toBeVisible();
    expect((await start.boundingBox())?.x).toBe(0);
    await page.keyboard.press("Escape");
    await expect(start).toBeHidden();
    await body.getByRole("button", { name: "Share" }).click();
    const bottom = page.getByRole("dialog", { name: "Share" });
    await expect(bottom).toBeVisible();
    const box = await bottom.boundingBox();
    expect(box?.width).toBe(1280);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
  },
  "on a phone a side drawer takes at most 85% of the width": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("wide").getByRole("button", { name: "Deploy log" }).click();
    const drawer = page.getByRole("dialog", { name: "Deploy log of web-1" });
    await expect(drawer).toBeVisible();
    expect((await drawer.boundingBox())?.width).toBeLessThanOrEqual(390 * 0.85 + 1);
  },
  "on a phone a bottom drawer is at most 85% of the height": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("sides").getByRole("button", { name: "Share" }).click();
    const drawer = page.getByRole("dialog", { name: "Share" });
    await expect(drawer).toBeVisible();
    expect((await drawer.boundingBox())?.height).toBeLessThanOrEqual(800 * 0.85 + 1);
  },
});
