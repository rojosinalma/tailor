import { behaviour } from "../../src/behaviour";

export default behaviour("json-view", {
  "the arrow keys open, close and move": async ({ page, example, expect }) => {
    const tree = example("response").getByRole("tree", { name: "GET /api/hosts" });
    const hosts = tree.getByRole("treeitem", { name: /"hosts"/ });
    await expect(hosts).toHaveAttribute("aria-expanded", "false");
    await expect(hosts).toContainText("[ 2 items ]");
    await page.keyboard.press("Tab");
    await hosts.focus();
    await page.keyboard.press("ArrowRight");
    await expect(hosts).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowRight");
    const first = tree.getByRole("treeitem", { name: /^0:/ });
    await expect(first).toBeFocused();
    await expect(first).toContainText("{ 5 keys }");
    await page.keyboard.press("ArrowDown");
    await expect(tree.getByRole("treeitem", { name: /^1:/ })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(hosts).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(hosts).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("End");
    await expect(tree.getByRole("treeitem", { name: /"updated"/ })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(hosts).toBeFocused();
  },
  "the tree is one tab stop": async ({ page, example, expect }) => {
    const items = example("response").getByRole("treeitem");
    await items.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(example("response").locator("[role=treeitem][tabindex='0']")).toHaveCount(1);
    await expect(items.nth(1)).toHaveAttribute("tabindex", "0");
  },
  "a click toggles a node and Enter too": async ({ page, example, expect }) => {
    const tree = example("large").getByRole("tree");
    const events = tree.getByRole("treeitem", { name: /"events"/ });
    await expect(tree.getByRole("treeitem")).toHaveCount(2);
    await events.click();
    await expect(events).toHaveAttribute("aria-expanded", "true");
    await expect(events).toBeFocused();
    await expect(tree.getByRole("treeitem", { level: 2 })).toHaveCount(340);
    await page.keyboard.press("Enter");
    await expect(events).toHaveAttribute("aria-expanded", "false");
    await expect(tree.getByRole("treeitem")).toHaveCount(2);
  },
  "the copy button copies the whole value as JSON": async ({ page, example, expect }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await example("response").getByRole("button", { name: "Copy" }).click();
    const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as { total: number };
    expect(copied.total).toBe(2);
  },
  "long strings wrap in a narrow page": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(example("long").getByRole("tree")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
});
