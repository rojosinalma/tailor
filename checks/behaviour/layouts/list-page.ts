import { behaviour } from "../../src/behaviour";

export default behaviour("list-page", {
  "on a phone the rows are cards, Sort by sorts, and the other page actions sit in one menu": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("narrow");
    await expect(body.getByRole("button", { name: "Add service" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Export" })).toBeHidden();
    await expect(body.getByRole("button", { name: "More" })).toBeVisible();
    const first = body.locator("tbody tr").first();
    await expect(first.getByRole("rowheader")).toHaveText("api");
    const name = await first.getByRole("rowheader").boundingBox();
    const host = await first.locator('[data-label="Host"]').boundingBox();
    expect(name && host && host.y > name.y && Math.abs(host.x - name.x) < 24).toBe(true);
    await body.getByRole("button", { name: "Descending" }).click();
    await expect(first.getByRole("rowheader")).toHaveText("worker");
    const box = await body.locator(".t-data-table").boundingBox();
    expect(box && box.x + box.width <= 390).toBe(true);
  },
  "a search that matches nothing says so and offers Clear filters": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("searchbox", { name: "Search", exact: true }).fill("nothing-like-this");
    await expect(body.getByText("Nothing matches")).toBeVisible();
    await body.getByRole("button", { name: "Clear filters" }).click();
    await expect(body.getByRole("rowheader").first()).toHaveText("api");
  },
  "the no-matches example opens on a search that matches nothing": async ({ example, expect }) => {
    const body = example("no-matches");
    await expect(body.getByText("Nothing matches")).toBeVisible();
    await body.getByRole("button", { name: "Clear filters" }).click();
    await expect(body.getByRole("rowheader").first()).toHaveText("api");
  },
  "selected rows show the bulk actions": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("checkbox", { name: "Select api", exact: true }).check();
    await expect(body.getByRole("button", { name: "Restart" }).first()).toBeVisible();
    await expect(body.getByRole("button", { name: "Stop" })).toBeVisible();
  },
});
