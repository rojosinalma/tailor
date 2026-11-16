import { behaviour } from "../../src/behaviour";

export default behaviour("offline-page", {
  "Try again loads the page again": async ({ page, example, expect }) => {
    const body = example("default");
    await expect(body.getByRole("heading", { level: 1 })).toHaveText("No connection");
    await page.evaluate(() => Object.assign(window, { beforeReload: true }));
    await Promise.all([page.waitForEvent("load"), body.getByRole("button", { name: "Try again" }).click()]);
    expect(await page.evaluate(() => "beforeReload" in window)).toBe(false);
  },
  "it draws no image and no sprite icon": async ({ example, expect }) => {
    const body = example("default");
    await expect(body.locator("img, use, picture")).toHaveCount(0);
  },
});
