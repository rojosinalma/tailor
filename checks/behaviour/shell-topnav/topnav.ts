import { behaviour } from "../../src/behaviour";
import { frameStays, skipLinkWorks } from "../core/shell-base";

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
});
