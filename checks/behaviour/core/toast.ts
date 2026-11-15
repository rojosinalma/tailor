import { behaviour } from "../../src/behaviour";

export default behaviour("toast", {
  "a button shows a toast in the notifications region": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Sync" }).click();
    const region = page.getByRole("region", { name: "Notifications" });
    const toast = region.locator(".t-toast", { hasText: "nas copies 1,204 files." });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("data-tone", "info");
    await expect(toast.getByRole("heading", { name: "Sync started" })).toBeVisible();
  },
  "a toast leaves by itself after 4 s": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Save" }).click();
    const toast = page.locator(".t-toast", { hasText: "The settings of web-1 are saved." });
    await expect(toast).toBeVisible();
    await page.waitForTimeout(3000);
    await expect(toast).toBeVisible();
    await expect(toast).toBeHidden({ timeout: 3000 });
  },
  "a toast stays while the pointer is over it": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Save" }).click();
    const toast = page.locator(".t-toast", { hasText: "The settings of web-1 are saved." });
    await expect(toast).toBeVisible();
    await toast.hover();
    await page.waitForTimeout(5000);
    await expect(toast).toBeVisible();
    await page.mouse.move(5, 5);
    await expect(toast).toBeHidden({ timeout: 6000 });
  },
  "a danger toast stays until it is closed": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Deploy" }).click();
    const toast = page.locator(".t-toast", { hasText: "web-1 did not answer." });
    await expect(toast).toBeVisible();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(5000);
    await expect(toast).toBeVisible();
    // Base UI hides the close button from assistive tech until the toast has the pointer or the focus.
    await toast.locator(".t-toast-close").click();
    await expect(toast).toBeHidden();
  },
  "at most 4 show, the oldest waits": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Deploy" }).click();
    for (const name of ["Save", "Sync", "Check disk", "Archive web-1"])
      await body.getByRole("button", { name }).click();
    await expect(page.locator(".t-toast:visible")).toHaveCount(4);
    await expect(page.locator(".t-toast", { hasText: "web-1 did not answer." })).toBeHidden();
  },
  "the action runs and closes the toast": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Archive web-1" }).click();
    const toast = page.locator(".t-toast", { hasText: "web-1 is in the archive." });
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect(toast).toBeHidden();
  },
  "on a phone the region takes the full width": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("button", { name: "Save" }).click();
    const box = await page.locator(".t-toast").first().boundingBox();
    expect(box?.width).toBeGreaterThan(360);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(780);
  },
});
