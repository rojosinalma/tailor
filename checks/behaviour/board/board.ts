import type { Locator, Page } from "playwright";
import { behaviour } from "../../src/behaviour";

const column = (board: Locator, name: string): Locator => board.getByRole("region", { name, exact: true });

const titles = (col: Locator): Promise<string[]> =>
  col.locator(".t-sortable-item:not([inert]) .t-card-title").allTextContents();

const press = async (page: Page, key: string): Promise<void> => {
  await page.keyboard.press(key);
  await page.waitForTimeout(150);
};

export default behaviour("board", {
  "the keyboard moves a card to the next column": async ({ page, example, expect }) => {
    const board = example("default");
    const handle = board.getByRole("button", { name: "Reorder Rotate TLS certificates" });
    await handle.focus();
    await press(page, "Space");
    await expect(
      page.getByRole("status").filter({ hasText: "Picked up Rotate TLS certificates." }),
    ).toHaveCount(1);
    await press(page, "ArrowRight");
    await expect(page.getByRole("status").filter({ hasText: "Moved to In progress" })).toHaveCount(1);
    await press(page, "Space");
    expect(await titles(column(board, "In progress"))).toContain("Rotate TLS certificates");
    expect(await titles(column(board, "Backlog"))).not.toContain("Rotate TLS certificates");
    await expect(board.getByRole("button", { name: "Reorder Rotate TLS certificates" })).toBeFocused();
  },
  "the card menu moves a card to another column": async ({ page, example, expect }) => {
    const board = example("default");
    await board.getByRole("button", { name: "Move Log rotation for worker-1 to…" }).click();
    const menu = page.getByRole("menu", { name: "Move to" });
    await expect(menu.getByRole("menuitem")).toHaveText(["Backlog", "In progress", "Done"]);
    await menu.getByRole("menuitem", { name: "Done" }).click();
    await expect(menu).toBeHidden();
    expect((await titles(column(board, "Done"))).at(-1)).toBe("Log rotation for worker-1");
    expect(await titles(column(board, "Review"))).toEqual(["New firewall rules for example.com"]);
    await expect(board.getByRole("button", { name: "Move Log rotation for worker-1 to…" })).toBeFocused();
  },
  "the pointer drags a card into another column": async ({ page, example, expect }) => {
    const board = example("default");
    const handle = board.getByRole("button", { name: "Reorder Pin the base image" });
    const target = column(board, "Review").locator(".t-sortable-item").last();
    const from = await handle.boundingBox();
    const to = await target.boundingBox();
    if (!from || !to) throw new Error("no boxes");
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height - 4, { steps: 5 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(150);
    expect(await titles(column(board, "Review"))).toContain("Pin the base image");
    expect(await titles(column(board, "In progress"))).not.toContain("Pin the base image");
  },
  "a column over its limit says so in the warning tone": async ({ example, expect }) => {
    const board = example("default");
    const over = column(board, "In progress").locator(".t-board-count .t-badge");
    await expect(over).toHaveText("4 of 3, over the limit");
    await expect(over).toHaveAttribute("data-tone", "warning");
    await expect(column(board, "Review").locator(".t-board-count .t-badge")).toHaveText("2 of 2");
    await expect(column(board, "Review").locator(".t-board-count .t-badge")).toHaveAttribute(
      "data-tone",
      "neutral",
    );
  },
  "an empty column takes a card and the Add button reports its column": async ({ page, example, expect }) => {
    const board = example("add");
    await expect(column(board, "Review")).toContainText("No cards");
    await board.getByRole("button", { name: "Reorder Restart policy for every service" }).focus();
    await press(page, "Space");
    await press(page, "ArrowLeft");
    await press(page, "Space");
    expect(await titles(column(board, "Review"))).toEqual(["Restart policy for every service"]);
    await board.getByRole("button", { name: "Add card to Backlog" }).click();
    expect((await titles(column(board, "Backlog"))).at(-1)).toMatch(/^New task/);
  },
  "the card's menu and grip sit in a row of their own, under the title": async ({ example, expect }) => {
    const card = example("default").locator(".t-board-card", {
      hasText: "Move nas backups to the new bucket",
    });
    const title = await card.locator(".t-card-title").boundingBox();
    const menu = await card.getByRole("button", { name: /^Move .* to…$/ }).boundingBox();
    const grip = await card.getByRole("button", { name: /^Reorder / }).boundingBox();
    const box = await card.boundingBox();
    if (!title || !menu || !grip || !box) throw new Error("no boxes");
    expect(menu.y).toBeGreaterThanOrEqual(title.y + title.height);
    expect(Math.abs(menu.y - grip.y)).toBeLessThan(2);
    // The title takes the width of the card, less its padding.
    expect(title.width).toBeGreaterThan(box.width * 0.75);
  },
  "a narrow box shows one column, picked with tabs, and the menu moves cards": async ({
    page,
    example,
    expect,
  }) => {
    const board = example("narrow");
    await expect(column(board, "Backlog")).toBeVisible();
    await expect(column(board, "In progress")).toBeHidden();
    const tabs = board.getByRole("tablist");
    await expect(tabs.getByRole("tab", { name: /Backlog/ })).toHaveAttribute("aria-selected", "true");
    await tabs.getByRole("tab", { name: /Review/ }).click();
    await expect(column(board, "Review")).toBeVisible();
    await expect(column(board, "Backlog")).toBeHidden();
    await board.getByRole("button", { name: "Move Log rotation for worker-1 to…" }).click();
    await page.getByRole("menu", { name: "Move to" }).getByRole("menuitem", { name: "Backlog" }).click();
    await expect(column(board, "Backlog")).toBeVisible();
    await expect(tabs.getByRole("tab", { name: /Backlog/ })).toHaveAttribute("aria-selected", "true");
    expect((await titles(column(board, "Backlog"))).at(-1)).toBe("Log rotation for worker-1");
    await expect(board.getByRole("button", { name: "Move Log rotation for worker-1 to…" })).toBeFocused();
  },
});
