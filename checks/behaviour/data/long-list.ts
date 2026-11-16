import { behaviour } from "../../src/behaviour";

export default behaviour("long-list", {
  "only a window of the rows is in the page": async ({ example, expect }) => {
    const body = example("default");
    const items = body.getByRole("listitem");
    await expect(items.first()).toHaveAttribute("aria-setsize", "10000");
    await expect(items.first()).toHaveAttribute("aria-posinset", "1");
    expect(await items.count()).toBeLessThan(60);
  },
  "scrolling shows the later rows": async ({ example, expect }) => {
    const body = example("default");
    const region = body.getByRole("region", { name: "Events" });
    await region.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(body.locator('[aria-posinset="10000"]')).toBeVisible();
    await expect(body.locator('[aria-posinset="1"]')).toHaveCount(0);
  },
  "the keyboard scrolls the box": async ({ page, example, expect }) => {
    const body = example("fixed");
    const region = body.getByRole("region", { name: "Hosts" });
    await region.focus();
    await page.keyboard.press("End");
    await expect(body.locator('[aria-posinset="10000"]')).toBeVisible();
  },
  "the end of the list loads more rows": async ({ example, expect }) => {
    const body = example("more");
    const region = body.getByRole("region", { name: "Events, loaded in steps" });
    await expect(body.getByRole("listitem").first()).toHaveAttribute("aria-setsize", "50");
    await expect(body.getByRole("status")).toBeAttached();
    await region.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(body.getByRole("listitem").first()).toHaveAttribute("aria-setsize", "100");
  },
});
