import { behaviour } from "../../src/behaviour";
import { frameStays, skipLinkWorks } from "../core/shell-base";

export default behaviour("sidenav", {
  "the current link has aria-current; a section with the current page starts open": async ({
    example,
    expect,
  }) => {
    await expect(example("default").getByRole("link", { name: /^Services/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const section = example("section").getByRole("button", { name: "System" });
    await expect(section).toHaveAttribute("aria-expanded", "true");
    await expect(section).toHaveAttribute("data-current-section", "");
    await expect(example("section").getByRole("link", { name: "Backups" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
  "a section opens and closes by pointer and keyboard": async ({ page, example, expect }) => {
    const body = example("default");
    const section = body.getByRole("button", { name: "System" });
    await expect(section).toHaveAttribute("aria-expanded", "false");
    await expect(body.getByRole("link", { name: "Jobs" })).toBeHidden();
    await section.click();
    await expect(section).toHaveAttribute("aria-expanded", "true");
    await expect(body.getByRole("link", { name: "Jobs" })).toBeVisible();
    await section.focus();
    await page.keyboard.press("Enter");
    await expect(section).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(body.getByRole("link", { name: "Jobs" })).toBeVisible();
  },
  "the column collapses to icons with tooltips, and stays so after a reload": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("default");
    const sidebar = body.locator(".t-shell-sidebar");
    const wide = (await sidebar.boundingBox())?.width ?? 0;
    await body.getByRole("button", { name: "Collapse sidebar" }).click();
    const toggle = body.getByRole("button", { name: "Expand sidebar" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect.poll(async () => (await sidebar.boundingBox())?.width ?? 0).toBeLessThan(wide / 2);
    const link = body.getByRole("link", { name: "Hosts" });
    await expect(link).toBeVisible();
    await link.hover();
    await expect(page.locator(".t-tooltip", { hasText: "Hosts" })).toBeVisible();
    await page.mouse.move(900, 700);
    const section = body.getByRole("button", { name: "System" });
    await section.click();
    const menu = page.getByRole("menu", { name: "System" });
    await expect(menu.getByRole("menuitem", { name: "Logs" })).toBeVisible();
    // The menu opens beside the collapsed column, not under its button.
    const from = (await section.boundingBox())?.x ?? 0;
    const width = (await section.boundingBox())?.width ?? 0;
    expect((await menu.boundingBox())?.x ?? 0).toBeGreaterThanOrEqual(from + width);
    await page.keyboard.press("Escape");
    await page.reload();
    await page.locator(".sc-example").first().waitFor();
    await expect(example("default").getByRole("button", { name: "Expand sidebar" })).toBeVisible();
    await example("default").getByRole("button", { name: "Expand sidebar" }).click();
    await expect(example("default").getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
  },
  "an open section is remembered after a reload": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "System" }).click();
    await page.reload();
    await page.locator(".sc-example").first().waitFor();
    await expect(example("default").getByRole("button", { name: "System" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
  "a tablet starts collapsed": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 820, height: 800 });
    await page.reload();
    await page.locator(".sc-example").first().waitFor();
    await expect(example("default").getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  },
  "the phone form: a top bar with the menu button opens the drawer": async ({ page, example, expect }) => {
    const body = example("narrow");
    await expect(body.getByRole("button", { name: "Collapse sidebar" })).toBeHidden();
    const button = body.getByRole("button", { name: "Menu" });
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer.getByRole("link", { name: "Overview" })).toBeFocused();
    await drawer.getByRole("link", { name: "Deploys" }).click();
    await expect(drawer).toBeHidden();
    await button.click();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
  },
  "the bottom bar holds the first-level links of every group": async ({ page, example, expect }) => {
    const bar = example("phone-bar").getByRole("navigation", { name: "Main navigation" });
    await expect(bar.getByRole("link")).toHaveCount(4);
    await bar.getByRole("button", { name: "More" }).click();
    await expect(
      page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Settings" }),
    ).toBeVisible();
  },
  "no links: no toggle, no menu button": async ({ page, example, expect }) => {
    await expect(example("empty").getByRole("button", { name: "Collapse sidebar" })).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(example("empty").getByRole("button", { name: "Menu" })).toHaveCount(0);
  },
  "the skip link works": async ({ page, example }) => {
    await skipLinkWorks(page, example("default"));
  },
  "the frame never scrolls, the page body does": async ({ page, example }) => {
    await frameStays(page, example("section"));
  },
});
