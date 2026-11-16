import { behaviour } from "../../src/behaviour";

export default behaviour("tree-view", {
  "one tab stop, and the arrow keys move, open and close": async ({ page, example, expect }) => {
    const tree = example("default").getByRole("tree", { name: "Files" });
    const item = (name: string) => tree.getByRole("treeitem", { name, exact: true });
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
    await item("api.ts").focus();
    await page.keyboard.press("ArrowDown");
    await expect(item("auth.ts")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(item("lib")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(item("lib")).toHaveAttribute("aria-expanded", "false");
    await expect(item("auth.ts")).toBeHidden();
    await page.keyboard.press("ArrowLeft");
    await expect(item("src")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(item("components")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(item("components")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowRight");
    await expect(item("button.tsx")).toBeFocused();
    await page.keyboard.press("End");
    await expect(item("README.md")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(item("src")).toBeFocused();
    await page.keyboard.press("p");
    await expect(item("package.json")).toBeFocused();
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
  },
  "Space selects, Enter selects and opens": async ({ page, example, expect }) => {
    const tree = example("default").getByRole("tree", { name: "Files" });
    const item = (name: string) => tree.getByRole("treeitem", { name, exact: true });
    await expect(item("api.ts")).toHaveAttribute("aria-selected", "true");
    await item("README.md").focus();
    await page.keyboard.press(" ");
    await expect(item("README.md")).toHaveAttribute("aria-selected", "true");
    await expect(item("api.ts")).toHaveAttribute("aria-selected", "false");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(item("docs")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(item("docs")).toHaveAttribute("aria-selected", "true");
    await expect(item("docs")).toHaveAttribute("aria-expanded", "true");
    await expect(item("install.md")).toBeVisible();
  },
  "a click selects an item and opens or closes a branch": async ({ example, expect }) => {
    const tree = example("default").getByRole("tree", { name: "Files" });
    const docs = tree.getByRole("treeitem", { name: "docs", exact: true });
    await docs.click();
    await expect(docs).toHaveAttribute("aria-expanded", "true");
    await expect(docs).toHaveAttribute("aria-selected", "true");
    await expect(docs).toBeFocused();
    await docs.click();
    await expect(docs).toHaveAttribute("aria-expanded", "false");
  },
  "several items can be selected; a disabled one cannot": async ({ example, expect }) => {
    const tree = example("multiple").getByRole("tree", { name: "Hosts" });
    const item = (name: string) => tree.getByRole("treeitem", { name, exact: true });
    await expect(tree).toHaveAttribute("aria-multiselectable", "true");
    await item("db-1").click();
    await expect(tree.locator('[aria-selected="true"]')).toHaveCount(3);
    await item("nas 1").click();
    await expect(item("nas 1")).toHaveAttribute("aria-selected", "false");
    await item("printer").click({ force: true });
    await expect(item("printer")).toHaveAttribute("aria-selected", "false");
    await expect(item("printer")).toHaveAttribute("aria-disabled", "true");
  },
  "Enter follows the link of an item": async ({ page, example, expect }) => {
    const tree = example("links").getByRole("tree", { name: "Guide" });
    await tree.getByRole("treeitem", { name: "Install" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#install$/);
  },
  "lazy children show a spinner, then the items": async ({ kit, example, expect }) => {
    if (kit === "html") return;
    const body = example("lazy");
    const archive = body.getByRole("treeitem", { name: "archive", exact: true });
    await expect(archive).toHaveAttribute("aria-expanded", "false");
    await archive.click();
    await expect(body.getByRole("status")).toBeVisible();
    await expect(body.getByRole("treeitem", { name: "2024.tar" })).toBeVisible();
    await expect(body.getByRole("status")).toHaveCount(0);
  },
});
