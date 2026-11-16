import type { Locator, Page } from "playwright";
import { behaviour, expect } from "../../src/behaviour";
import { fullScreen, phoneSearchWorks, skipLinkWorks } from "../core/shell-base";

const reload = async (page: Page): Promise<void> => {
  await page.reload();
  await page.locator(".sc-example").first().waitFor();
};

const width = async (locator: Locator): Promise<number> => (await locator.boundingBox())?.width ?? 0;
const height = async (locator: Locator): Promise<number> => (await locator.boundingBox())?.height ?? 0;

export default behaviour("workspace", {
  "every region is a named landmark": async ({ example }) => {
    const body = example("default");
    await expect(body.locator(".t-shell-bar")).toBeVisible();
    await expect(body.getByRole("complementary", { name: "Files" })).toBeVisible();
    await expect(body.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(body.getByRole("main")).toBeVisible();
    await expect(body.getByRole("region", { name: "Output" })).toBeVisible();
    await expect(body.getByRole("group", { name: "Panels" }).getByRole("button")).toHaveCount(3);
    await expect(body.getByRole("complementary", { name: "Details" })).toBeHidden();
  },
  "the centre alone is the top bar and the content": async ({ example }) => {
    const body = example("centre");
    await expect(body.getByRole("main")).toBeVisible();
    await expect(body.getByRole("complementary")).toHaveCount(0);
    await expect(body.getByRole("button", { name: "Collapse sidebar" })).toHaveCount(0);
    await expect(body.getByRole("separator")).toHaveCount(0);
  },
  "the sidebar collapses and comes back": async ({ example }) => {
    const body = example("default");
    const sidebar = body.getByRole("complementary", { name: "Files" });
    await body.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar).toBeHidden();
    const toggle = body.getByRole("button", { name: "Expand sidebar" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(sidebar).toBeVisible();
    await expect(body.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
  "the sidebar resizes by keyboard and by pointer": async ({ page, example }) => {
    const body = example("default");
    const sidebar = body.getByRole("complementary", { name: "Files" });
    const handle = body.getByRole("separator", { name: "Resize the sidebar" });
    const start = await width(sidebar);
    const value = Number(await handle.getAttribute("aria-valuenow"));
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", String(value + 32));
    await expect.poll(() => width(sidebar)).toBeGreaterThan(start + 30);
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", (await handle.getAttribute("aria-valuemin")) ?? "");
    const box = await handle.boundingBox();
    const [x, y] = [(box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + 100];
    const before = await width(sidebar);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => width(sidebar)).toBeGreaterThan(before + 50);
  },
  "a rail button opens its panel; another switches; pressing again closes": async ({ example }) => {
    const body = example("default");
    const rail = body.getByRole("group", { name: "Panels" });
    const details = rail.getByRole("button", { name: "Details" });
    const history = rail.getByRole("button", { name: "History" });
    await expect(details).toHaveAttribute("aria-pressed", "false");
    await details.click();
    await expect(details).toHaveAttribute("aria-pressed", "true");
    await expect(body.getByRole("complementary", { name: "Details" })).toBeVisible();
    await history.click();
    await expect(details).toHaveAttribute("aria-pressed", "false");
    await expect(history).toHaveAttribute("aria-pressed", "true");
    await expect(body.getByRole("complementary", { name: "Details" })).toBeHidden();
    await expect(body.getByRole("complementary", { name: "History" })).toBeVisible();
    await history.click();
    await expect(body.getByRole("complementary", { name: "History" })).toBeHidden();
  },
  "the close button and Escape close a floating panel, the focus returns to its rail button": async ({
    page,
    example,
  }) => {
    const body = example("default");
    const notes = body.getByRole("group", { name: "Panels" }).getByRole("button", { name: "Notes" });
    const panel = body.getByRole("complementary", { name: "Notes" });
    await notes.click();
    await panel.getByRole("button", { name: "Close" }).click();
    await expect(panel).toBeHidden();
    await expect(notes).toBeFocused();
    await notes.click();
    await panel.getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(notes).toBeFocused();
    await expect(notes).toHaveAttribute("aria-pressed", "false");
  },
  "a floating panel keeps the centre's width; a pushing one narrows it": async ({ example }) => {
    const float = example("default");
    const centre = float.getByRole("main");
    const wide = await width(centre);
    await float.getByRole("group", { name: "Panels" }).getByRole("button", { name: "Details" }).click();
    await expect(float.getByRole("complementary", { name: "Details" })).toBeVisible();
    expect(await width(centre)).toBe(wide);

    const push = example("push");
    const pushed = push.getByRole("main");
    const panel = push.getByRole("complementary", { name: "Details" });
    await expect(panel).toBeVisible();
    const narrow = await width(pushed);
    await panel.getByRole("button", { name: "Close" }).click();
    await expect.poll(() => width(pushed)).toBeGreaterThan(narrow + 100);
  },
  "the panel resizes from its inner edge": async ({ page, example }) => {
    const body = example("default");
    await body.getByRole("group", { name: "Panels" }).getByRole("button", { name: "Details" }).click();
    const panel = body.getByRole("complementary", { name: "Details" });
    const start = await width(panel);
    await panel.getByRole("separator", { name: "Resize the panel" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => width(panel)).toBeGreaterThan(start + 10);
  },
  "the bottom panel resizes and collapses to its header": async ({ page, example }) => {
    const body = example("default");
    const output = body.getByRole("region", { name: "Output" });
    const start = await height(output);
    await output.getByRole("separator", { name: "Resize the panel" }).focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect.poll(() => height(output)).toBeGreaterThan(start + 20);
    const toggle = output.getByRole("button", { name: "Collapse the panel" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(output.getByText("listening on :3000").first()).toBeHidden();
    await expect.poll(() => height(output)).toBeLessThan(60);
    await output.getByRole("button", { name: "Expand the panel" }).click();
    await expect(output.getByText("listening on :3000").first()).toBeVisible();
  },
  "the layout is remembered after a reload": async ({ page, example }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Collapse sidebar" }).click();
    const output = body.getByRole("region", { name: "Output" });
    await output.getByRole("separator").focus();
    await page.keyboard.press("End");
    const value = await output.getByRole("separator").getAttribute("aria-valuenow");
    await output.getByRole("button", { name: "Collapse the panel" }).click();
    await body.getByRole("group", { name: "Panels" }).getByRole("button", { name: "Notes" }).click();
    await reload(page);
    const again = example("default");
    await expect(again.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
    await expect(again.getByRole("complementary", { name: "Notes" })).toBeVisible();
    const toggle = again.getByRole("button", { name: "Expand the panel" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await again.getByRole("complementary", { name: "Notes" }).getByRole("button", { name: "Close" }).click();
    await toggle.click();
    await expect(again.getByRole("region", { name: "Output" }).getByRole("separator")).toHaveAttribute(
      "aria-valuenow",
      value ?? "",
    );
  },
  "the gear opens the settings in a dialog and the focus returns to it": async ({ page, example }) => {
    const gear = example("default").getByRole("button", { name: "Settings" });
    await gear.click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await expect(dialog.getByLabel("Workspace name")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(gear).toBeFocused();
  },
  "F6 and Shift+F6 move between the regions": async ({ page, example }) => {
    const body = example("default");
    await body.getByRole("group", { name: "Panels" }).getByRole("button", { name: "History" }).click();
    await body.getByRole("button", { name: "Collapse sidebar" }).focus();
    await page.keyboard.press("F6");
    await expect(body.getByRole("complementary", { name: "Files" })).toBeFocused();
    await page.keyboard.press("F6");
    await expect(body.getByRole("main")).toBeFocused();
    await page.keyboard.press("F6");
    await expect(body.getByRole("complementary", { name: "History" })).toBeFocused();
    await page.keyboard.press("F6");
    await expect(body.getByRole("region", { name: "Output" })).toBeFocused();
    await page.keyboard.press("F6");
    await expect(body.locator(".t-shell-bar")).toBeFocused();
    await page.keyboard.press("Shift+F6");
    await expect(body.getByRole("region", { name: "Output" })).toBeFocused();
  },
  "a tablet starts with the sidebar closed; it opens over the centre and Escape closes it": async ({
    page,
    example,
  }) => {
    await page.setViewportSize({ width: 820, height: 800 });
    await reload(page);
    const body = example("default");
    const sidebar = body.getByRole("complementary", { name: "Files" });
    await expect(sidebar).toBeHidden();
    const centre = await width(body.getByRole("main"));
    await body.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(sidebar).toBeVisible();
    expect(await width(body.getByRole("main"))).toBe(centre);
    await sidebar.getByRole("link", { name: "nginx.conf" }).focus();
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
    await expect(body.getByRole("button", { name: "Expand sidebar" })).toBeFocused();
  },
  "the phone form opens each region as a sheet from the top bar": async ({ page, example }) => {
    const body = example("narrow");
    await expect(body.getByRole("complementary")).toHaveCount(0);
    await expect(body.getByRole("button", { name: "Collapse sidebar" })).toBeHidden();

    const menu = body.getByRole("button", { name: "Menu" });
    await menu.click();
    const nav = page.getByRole("dialog", { name: "Menu" });
    await expect(nav.getByRole("link", { name: "Search" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "nginx.conf" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Settings" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
    await menu.click();
    await nav.getByRole("link", { name: "Search" }).click();
    await expect(nav).toBeHidden();

    const panels = body.getByRole("button", { name: "Panels" });
    await panels.click();
    await page.getByRole("menu", { name: "Panels" }).getByRole("menuitem", { name: "History" }).click();
    const history = page.getByRole("dialog", { name: "History" });
    await expect(history.getByText("Created the file")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(history).toBeHidden();
    await expect(panels).toBeFocused();

    const outputButton = body.getByRole("button", { name: "Output" });
    await outputButton.click();
    const output = page.getByRole("dialog", { name: "Output" });
    await expect(output.getByText("listening on :3000").first()).toBeVisible();
    await output.getByRole("button", { name: "Close" }).click();
    await expect(output).toBeHidden();
    await expect(outputButton).toBeFocused();
  },
  "the phone form: the search folds into a button that opens it under the bar": async ({ page, example }) => {
    await phoneSearchWorks(page, example("narrow"), "Search files");
  },
  "the rail's tooltips open at the start side": async ({ page, example }) => {
    const details = example("default")
      .getByRole("group", { name: "Panels" })
      .getByRole("button", { name: "Details" });
    await details.hover();
    const tip = page.locator(".t-tooltip", { hasText: "Details" });
    await expect(tip).toBeVisible();
    const [t, b] = [await tip.boundingBox(), await details.boundingBox()];
    expect((t?.x ?? 0) + (t?.width ?? 0)).toBeLessThanOrEqual(b?.x ?? 0);
  },
  "on a phone a side sheet takes the whole screen": async ({ page, example }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("narrow").getByRole("button", { name: "Menu" }).click();
    const sheet = page.getByRole("dialog", { name: "Menu" });
    await expect(sheet).toBeVisible();
    await expect.poll(async () => (await sheet.boundingBox())?.x).toBe(0);
    expect((await sheet.boundingBox())?.width).toBe(390);
  },
  "the skip link works": async ({ page, example }) => {
    await skipLinkWorks(page, example("default"));
  },
  "nothing scrolls as a page; a region with long content scrolls": async ({ page, example }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await fullScreen(example("default"));
    const sizes = await page.evaluate(() => ({
      scroll: document.scrollingElement?.scrollHeight ?? 0,
      wide: document.scrollingElement?.scrollWidth ?? 0,
      shell: document.querySelector(".t-shell")?.getBoundingClientRect().height ?? 0,
    }));
    expect(sizes.scroll).toBe(500);
    expect(sizes.wide).toBe(1280);
    expect(Math.round(sizes.shell)).toBe(500);
    const list = page.locator(".t-workspace-sidebar-body");
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const box = await list.boundingBox();
    await page.mouse.move((box?.x ?? 0) + 40, (box?.y ?? 0) + 40);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.scrollingElement?.scrollTop)).toBe(0);
  },
});
