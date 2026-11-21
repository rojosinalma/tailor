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
  "a long name with no break never splits a state inside its word": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    const body = example("default");
    // A generated name with no place to break squeezes the other columns.
    await body
      .getByRole("rowheader")
      .first()
      .evaluate((cell) => {
        cell.textContent = "build_artifact_cache_replica_eu_west_3_2026_11_15_000042_build_artifact_cache";
      });
    const lines = await body.locator("tbody .t-state").evaluateAll((labels) =>
      labels.map((label) => {
        // The lines of the text alone; the icon beside it sits at its own height.
        const text = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
        const range = document.createRange();
        if (text) range.selectNodeContents(text);
        return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
      }),
    );
    expect(lines.length).toBeGreaterThan(0);
    expect(Math.max(...lines)).toBe(1);
  },
});
