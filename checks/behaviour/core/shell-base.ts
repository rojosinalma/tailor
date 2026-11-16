import type { Locator, Page } from "playwright";
import { behaviour, expect } from "../../src/behaviour";

/** Puts a copy of the example's shell alone in the page, as an app has it: it fills the window. */
export async function fullScreen(example: Locator): Promise<void> {
  await example
    .locator(".t-shell")
    .first()
    .evaluate((shell) => {
      const copy = shell.cloneNode(true);
      if (!(copy instanceof HTMLElement)) return;
      copy.removeAttribute("data-contained");
      document.body.className = "";
      document.body.replaceChildren(copy);
    });
}

/** The frame fills the window and never scrolls; the page body inside it does. */
export async function frameStays(page: Page, example: Locator): Promise<void> {
  if ((page.viewportSize()?.height ?? 0) > 500) await page.setViewportSize({ width: 1280, height: 500 });
  await fullScreen(example);
  const sizes = await page.evaluate(() => ({
    scroll: document.scrollingElement?.scrollHeight ?? 0,
    window: innerHeight,
    shell: document.querySelector(".t-shell")?.getBoundingClientRect().height ?? 0,
  }));
  expect(sizes.scroll).toBe(sizes.window);
  expect(Math.round(sizes.shell)).toBe(sizes.window);
  const body = page.locator(".t-page-body").first();
  expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  const box = await body.boundingBox();
  await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.scrollingElement?.scrollTop)).toBe(0);
}

/** The skip link is the first focusable element, shows on focus and moves the focus to the main region. */
export async function skipLinkWorks(page: Page, example: Locator): Promise<void> {
  const skip = example.getByRole("link", { name: "Skip to content" });
  await skip.focus();
  expect((await skip.boundingBox())?.width ?? 0).toBeGreaterThan(20);
  await page.keyboard.press("Enter");
  await expect(example.getByRole("main")).toBeFocused();
  const first = await example
    .locator(".t-shell")
    .evaluate(
      (shell) =>
        shell.querySelector("a[href], button, input, select, [tabindex]:not([tabindex='-1'])")?.textContent,
    );
  expect(first).toBe("Skip to content");
}

export default behaviour("shell-base", {
  "the skip link moves the focus to the main region": async ({ page, example }) => {
    await skipLinkWorks(page, example("frame"));
  },
  "the frame fills the window and never scrolls, the page body does": async ({ page, example }) => {
    await frameStays(page, example("frame"));
  },
  "the current link has aria-current; its section is marked": async ({ example }) => {
    await expect(example("links").getByRole("link", { name: /^Services/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const sections = example("sections");
    await expect(sections.getByRole("link", { name: "Backups" })).toHaveAttribute("aria-current", "page");
    await expect(sections.locator("[data-current-section]")).toHaveText("System");
  },
});
