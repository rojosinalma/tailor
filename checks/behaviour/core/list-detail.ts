import { behaviour } from "../../src/behaviour";

export default behaviour("list-detail", {
  "in a wide space the list and the detail show side by side": async ({ example, expect }) => {
    const body = example("default");
    const list = body.getByRole("region", { name: "Host list" });
    const detail = body.getByRole("region", { name: "Host details" });
    await expect(list).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(body.getByRole("button", { name: "Back" })).toBeHidden();
    const [a, b] = await Promise.all([list.boundingBox(), detail.boundingBox()]);
    if (!a || !b) throw new Error("no box");
    expect(b.x).toBeGreaterThan(a.x + a.width);
  },
  "in a narrow space an item opens the detail alone, with the focus on Back": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("default");
    const list = body.getByRole("region", { name: "Host list" });
    const detail = body.getByRole("region", { name: "Host details" });
    await expect(list).toBeVisible();
    await expect(detail).toBeHidden();
    await list.getByRole("button", { name: "nas" }).click();
    await expect(detail).toBeVisible();
    await expect(list).toBeHidden();
    await expect(detail.getByRole("button", { name: "Back" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
  "Back shows the list again and returns the focus to the item": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("default");
    const list = body.getByRole("region", { name: "Host list" });
    const detail = body.getByRole("region", { name: "Host details" });
    const item = list.getByRole("button", { name: "db-1" });
    await item.focus();
    await page.keyboard.press("Enter");
    await expect(detail).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(list).toBeVisible();
    await expect(detail).toBeHidden();
    await expect(list.getByRole("button", { name: "db-1" })).toBeFocused();
  },
  "the HTML kit fires t:back on the root": async ({ page, kit, example, expect }) => {
    if (kit !== "html") return;
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("default");
    await body.evaluate((el) => {
      el.querySelector(".t-list-detail")?.addEventListener("t:back", () => {
        el.setAttribute("data-backed", "");
      });
    });
    await body.getByRole("button", { name: "nas" }).click();
    await body.getByRole("button", { name: "Back" }).click();
    await expect(body).toHaveAttribute("data-backed", "");
  },
});
