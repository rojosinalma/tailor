import { behaviour } from "../../src/behaviour";
import { frameStays, phoneSearchWorks, skipLinkWorks } from "../core/shell-base";

export default behaviour("topnav", {
  "the current link has aria-current; its section is marked": async ({ example, expect }) => {
    await expect(example("default").getByRole("link", { name: /^Services/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(example("section").getByRole("button", { name: "System" })).toHaveAttribute(
      "data-current-section",
      "",
    );
  },
  "a link with sub-items opens a menu by pointer": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "System" }).click();
    const menu = page.getByRole("menu", { name: "System" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Backups" })).toBeVisible();
  },
  "and by keyboard; Escape returns the focus": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "System" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "System" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Jobs" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  'links that do not fit go into "More"; the current link stays': async ({ page, example, expect }) => {
    const body = example("many");
    const more = body.getByRole("button", { name: "More" });
    await expect(more).toBeVisible();
    await expect(body.getByRole("link", { name: "Users" })).toBeHidden();
    await more.click();
    const menu = page.getByRole("menu", { name: "More" });
    await expect(menu.getByRole("menuitem", { name: "Users" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Overview" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 760, height: 800 });
    await expect(body.getByRole("link", { name: /^Services/ })).toBeVisible();
    await expect(body.getByRole("link", { name: "Overview" })).toBeHidden();
    await more.click();
    await expect(menu.getByRole("menuitem", { name: "Overview" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /^Services/ })).toHaveCount(0);
    const row = body.locator(".t-shell-nav").first();
    expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  },
  "every link fits in a wide bar, without More": async ({ example, expect }) => {
    await expect(example("default").getByRole("button", { name: "More" })).toBeHidden();
    await expect(example("default").getByRole("link", { name: "Settings" })).toBeVisible();
  },
  "the phone form: the menu button opens the drawer, a link closes it, Escape returns the focus": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("narrow");
    await expect(body.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
    await expect(body.locator(".t-shell-footer")).toBeHidden();
    const button = body.getByRole("button", { name: "Menu" });
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer.getByRole("link", { name: "Overview" })).toBeFocused();
    await expect(drawer.getByRole("link", { name: "Docs" })).toBeVisible();
    await drawer.getByRole("link", { name: "Hosts" }).click();
    await expect(drawer).toBeHidden();
    await button.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(button).toBeFocused();
  },
  'the bottom bar shows four links and "More", which opens the drawer': async ({ page, example, expect }) => {
    const bar = example("phone-bar").getByRole("navigation", { name: "Main navigation" });
    await expect(bar.getByRole("link")).toHaveCount(4);
    await expect(bar.getByRole("link", { name: /^Services/ })).toHaveAttribute("aria-current", "page");
    await expect(example("phone-bar").getByRole("button", { name: "Menu" })).toHaveCount(0);
    await bar.getByRole("button", { name: "More" }).click();
    await expect(
      page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Settings" }),
    ).toBeVisible();
  },
  "the markup holds each link once: the script builds the drawer and More from the bar's list": async ({
    page,
    kit,
    example,
    expect,
  }) => {
    if (kit !== "html") return;
    // The markup that the page starts from (the reference a project copies) names each link once.
    const source = await (await page.request.get(page.url())).text();
    const narrow = source.slice(source.indexOf('data-example="narrow"'));
    const markup = narrow.slice(0, narrow.indexOf('<section class="sc-example"'));
    expect(markup.split('href="#hosts"').length - 1).toBe(1);
    const body = example("narrow");
    // The drawer and More are the script's.
    await expect(body.locator(".t-nav-drawer")).toHaveCount(1);
    await expect(body.locator(".t-topnav-more")).toHaveCount(1);
    await body.getByRole("button", { name: "Menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer.getByRole("link", { name: /^Services/ })).toHaveAttribute("aria-current", "page");
    await expect(drawer.getByRole("link", { name: "Backups" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Docs" })).toBeVisible();
  },
  "HTML kit: markup of 2.2.0 that holds the drawer and More keeps them": async ({ page, kit, expect }) => {
    if (kit !== "html") return;
    const markup = await Bun.file(`${import.meta.dir}/fixtures/narrow-2.2.0.txt`).text();
    await page.setViewportSize({ width: 390, height: 800 });
    await page.evaluate((html) => {
      const box = document.createElement("div");
      box.id = "old-markup";
      box.style.height = "600px";
      box.innerHTML = html;
      document.body.prepend(box);
      (window as unknown as { Tailor: { upgrade(node: Element): void } }).Tailor.upgrade(box);
    }, markup);
    const old = page.locator("#old-markup");
    await expect(old.locator(".t-nav-drawer")).toHaveCount(1);
    await expect(old.locator(".t-topnav-more")).toHaveCount(1);
    await old.getByRole("button", { name: "Menu" }).click();
    await expect(page.locator("#old_R_0H1_").getByRole("link", { name: "Hosts" })).toBeVisible();
  },
  "the phone form: the page header scrolls away with the content": async ({ example, expect }) => {
    const page = example("narrow").locator(".t-page");
    const header = page.locator(".t-page-header");
    const before = await header.boundingBox();
    expect(await page.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const after = await header.boundingBox();
    if (!before || !after) throw new Error("no box");
    expect(after.y).toBeLessThan(before.y - before.height + 1);
  },
  "the phone form: the search folds into a button that opens it under the bar": async ({ page, example }) => {
    await phoneSearchWorks(page, example("narrow"));
  },
  "the phone form on a real phone screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(example("default").getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(example("empty").getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(example("empty").locator(".t-shell-footer")).toBeVisible();
  },
  "the skip link works": async ({ page, example }) => {
    await skipLinkWorks(page, example("default"));
  },
  "the frame never scrolls, the page body does": async ({ page, example }) => {
    await frameStays(page, example("default"));
  },
  "full screen on a phone: the frame never scrolls": async ({ page, example }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await frameStays(page, example("phone-bar"));
  },
  "no links, narrow: the footer takes the compact theme controls and the facts keep their width": async ({
    page,
    example,
    expect,
  }) => {
    const footer = example("empty-narrow").locator(".t-shell-footer");
    await expect(footer.getByRole("button", { name: /^Theme:/ })).toBeVisible();
    await expect(footer.getByRole("combobox")).toHaveCount(0);
    await expect(footer.getByRole("button", { name: /mode$/ })).toBeVisible();
    // Each fact stays on one line: one letter per line was the fault.
    for (const fact of await footer.getByRole("listitem").all()) {
      const lines = await fact.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return new Set([...range.getClientRects()].map((r) => Math.round(r.bottom))).size;
      });
      expect(lines).toBe(1);
    }
    await footer.getByRole("button", { name: /^Theme:/ }).click();
    await expect(
      page.getByRole("dialog", { name: "Theme" }).getByRole("combobox", { name: "Palette" }),
    ).toBeVisible();
  },
  "a wide footer keeps the full theme controls": async ({ example, expect }) => {
    const footer = example("section").locator(".t-shell-footer");
    await expect(footer.getByRole("combobox", { name: "Skin" })).toBeVisible();
    await expect(footer.getByRole("combobox", { name: "Palette" })).toBeVisible();
    await expect(footer.getByRole("button", { name: /^Theme:/ })).toHaveCount(0);
  },
});
