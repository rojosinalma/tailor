import type { Locator, Page } from "playwright";
import { behaviour } from "../../src/behaviour";

const order = (list: Locator): Promise<string[]> =>
  list
    .locator(".t-sortable-item:not([inert])")
    .evaluateAll((items) => items.map((item) => item.querySelector("strong, th, span")?.textContent ?? ""));

const said = (page: Page, text: string): Locator => page.getByRole("status").filter({ hasText: text });

/** Presses a key and waits for the list to render the move. */
const press = async (page: Page, key: string): Promise<void> => {
  await page.keyboard.press(key);
  await page.waitForTimeout(150);
};

async function drag(page: Page, handle: Locator, dx: number, dy: number): Promise<void> {
  const box = await handle.boundingBox();
  if (!box) throw new Error("the handle has no box");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 10 });
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(150);
}

export default behaviour("sortable", {
  "the keyboard picks up, moves and drops a row, and says each step": async ({ page, example, expect }) => {
    const list = example("list");
    const handle = list.getByRole("button", { name: "Reorder web-1" });
    await handle.focus();
    await press(page, "Space");
    await expect(said(page, "Picked up web-1. Position 1 of 5.")).toHaveCount(1);
    await expect(list.locator(".t-sortable-item[data-dragging]:not([inert])")).toHaveCount(1);
    await press(page, "ArrowDown");
    await expect(said(page, "Moved to position 2 of 5.")).toHaveCount(1);
    await press(page, "ArrowDown");
    await expect(said(page, "Moved to position 3 of 5.")).toHaveCount(1);
    await press(page, "Space");
    await expect(said(page, "Dropped.")).toHaveCount(1);
    expect(await order(list)).toEqual(["web-2", "db-1", "web-1", "cache-1", "nas"]);
    await expect(handle).toBeFocused();
    await press(page, "Enter");
    await press(page, "ArrowUp");
    await press(page, "Enter");
    expect(await order(list)).toEqual(["web-2", "web-1", "db-1", "cache-1", "nas"]);
  },
  "Escape cancels and puts the row back": async ({ page, example, expect }) => {
    const list = example("list");
    await list.getByRole("button", { name: "Reorder db-1" }).focus();
    await press(page, "Space");
    await press(page, "ArrowUp");
    await press(page, "ArrowUp");
    expect(await order(list)).toEqual(["db-1", "web-1", "web-2", "cache-1", "nas"]);
    await press(page, "Escape");
    await expect(said(page, "Cancelled.")).toHaveCount(1);
    expect(await order(list)).toEqual(["web-1", "web-2", "db-1", "cache-1", "nas"]);
    await expect(list.getByRole("button", { name: "Reorder db-1" })).toBeFocused();
  },
  "the pointer drags a row by its grip": async ({ page, example, expect }) => {
    const list = example("list");
    await drag(page, list.getByRole("button", { name: "Reorder web-1" }), 0, 130);
    expect(await order(list)).toEqual(["web-2", "db-1", "web-1", "cache-1", "nas"]);
  },
  "the pointer drags a table row and a card in a grid": async ({ page, example, expect }) => {
    const table = example("table");
    await drag(page, table.getByRole("button", { name: "Reorder web-1" }), 0, 100);
    expect(await order(table)).toEqual(["web-2", "db-1", "web-1", "cache-1", "nas"]);
    const grid = example("grid");
    await grid.scrollIntoViewIfNeeded();
    const first = grid.locator(".t-sortable-item").first();
    const second = grid.locator(".t-sortable-item").nth(1);
    const a = await first.boundingBox();
    const b = await second.boundingBox();
    if (!a || !b) throw new Error("no cards");
    await drag(page, grid.getByRole("button", { name: "Reorder web-1" }), b.x - a.x, 0);
    await expect(grid.locator(".t-card-title").first()).toHaveText("web-2");
  },
  "with a handle, text in a row stays selectable": async ({ page, example, expect }) => {
    const list = example("list");
    const text = list.getByText("Database");
    const box = await text.boundingBox();
    if (!box) throw new Error("no text");
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await page.evaluate(() => window.getSelection()?.toString() ?? "")).toContain("Data");
    await expect(list.locator(".t-sortable-item[data-dragging]:not([inert])")).toHaveCount(0);
    expect(await order(list)).toEqual(["web-1", "web-2", "db-1", "cache-1", "nas"]);
  },
  "without a handle the whole chip moves, by keyboard too": async ({ page, example, expect }) => {
    const chips = example("chips");
    const chip = chips.getByRole("button", { name: "Reorder production" });
    await chip.focus();
    await press(page, "Space");
    await press(page, "ArrowRight");
    await press(page, "ArrowRight");
    await press(page, "Space");
    await expect(chips.locator(".t-chip-label")).toHaveText([
      "eu-west",
      "web",
      "production",
      "nginx",
      "monitored",
    ]);
  },
  "the keyboard moves an item into the next list, also an empty one": async ({ page, example, expect }) => {
    const group = example("group");
    const lists = group.locator(".t-sortable");
    await group.getByRole("button", { name: "Reorder worker-1" }).focus();
    await press(page, "Space");
    await press(page, "ArrowDown");
    await expect(said(page, "Moved to Standby, position 1 of 3.")).toHaveCount(1);
    await expect(group.getByRole("button", { name: "Reorder worker-1" })).toBeFocused();
    await press(page, "ArrowDown");
    await press(page, "ArrowDown");
    await press(page, "ArrowDown");
    await expect(said(page, "Moved to Retired, position 1 of 1.")).toHaveCount(1);
    await press(page, "Space");
    await expect(lists.nth(0).locator(".t-sortable-item")).toHaveCount(2);
    await expect(lists.nth(2)).toHaveText("worker-1");
    await expect(group.getByRole("button", { name: "Reorder worker-1" })).toBeFocused();
  },
  "a disabled list does not start a drag": async ({ page, example, expect }) => {
    const list = example("disabled");
    await expect(list.getByRole("button", { name: "Reorder web-1" })).toBeDisabled();
    await drag(page, list.getByRole("button", { name: "Reorder web-1" }), 0, 130);
    expect(await order(list)).toEqual(["web-1", "web-2", "db-1", "cache-1", "nas"]);
  },
});
