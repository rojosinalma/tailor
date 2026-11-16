import { behaviour } from "../../src/behaviour";

export default behaviour("dialog", {
  "near the top without a header: the title names it, the field takes the focus": async ({
    page,
    example,
    expect,
  }) => {
    await example("top").getByRole("button", { name: "Find a host" }).click();
    const dialog = page.getByRole("dialog", { name: "Find a host" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toHaveCount(0);
    await expect(dialog.getByRole("searchbox", { name: "Host name" })).toBeFocused();
    const box = await dialog.boundingBox();
    expect(box?.y ?? 900).toBeLessThan(120);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  },
  "opens from its trigger and takes the focus": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Edit host" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit host" });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  },
  "Escape closes it and the focus returns to the trigger": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Edit host" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Edit host" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "the close button and a footer button close it": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Edit host" });
    const dialog = page.getByRole("dialog", { name: "Edit host" });
    await trigger.click();
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await trigger.click();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  },
  "a click on the backdrop closes it": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Edit host" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit host" });
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  },
  "the Tab key stays inside the dialog": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Edit host" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit host" });
    await expect(dialog).toBeVisible();
    // Base UI moves the focus in, and back from its focus guards, a frame later: wait for it each time.
    const inside = () => dialog.evaluate((el) => el.contains(document.activeElement));
    await expect.poll(inside).toBe(true);
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      await expect.poll(inside).toBe(true);
    }
  },
  "on a phone it takes the full screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("button", { name: "Edit host" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit host" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width).toBe(390);
    expect(box?.height).toBe(800);
  },
});
