import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

const trigger = (body: Locator, title: string): Locator =>
  body.locator(".t-accordion-trigger", { hasText: title });

export default behaviour("accordion", {
  "a click opens a section and a second click closes it": async ({ example, expect }) => {
    const body = example("single");
    const panel = body.getByText("Stand-by for web-1");
    await expect(panel).toBeHidden();
    await trigger(body, "web-2").click();
    await expect(panel).toBeVisible();
    await trigger(body, "web-2").click();
    await expect(panel).toBeHidden();
  },
  "one section at a time: opening one closes the open one": async ({ example, expect }) => {
    const body = example("single");
    const first = body.getByText("Serves example.com");
    const third = body.getByText("Holds the backups");
    await expect(first).toBeVisible();
    await trigger(body, "nas").click();
    await expect(third).toBeVisible();
    await expect(first).toBeHidden();
  },
  "with multiple, sections open on their own": async ({ example, expect }) => {
    const body = example("multiple");
    await expect(body.getByText("Serves example.com")).toBeVisible();
    await expect(body.getByText("Holds the backups")).toBeVisible();
    await trigger(body, "web-2").click();
    await expect(body.getByText("Stand-by for web-1")).toBeVisible();
    await expect(body.getByText("Serves example.com")).toBeVisible();
    await expect(body.getByText("Holds the backups")).toBeVisible();
  },
  "the Tab key moves between titles, Enter and Space open and close": async ({ page, example, expect }) => {
    const body = example("single");
    await trigger(body, "web-1").focus();
    await page.keyboard.press("Tab");
    await expect(trigger(body, "web-2")).toBeFocused();
    const panel = body.getByText("Stand-by for web-1");
    await page.keyboard.press("Enter");
    await expect(panel).toBeVisible();
    await expect(body.getByText("Serves example.com")).toBeHidden();
    await page.keyboard.press(" ");
    await expect(panel).toBeHidden();
  },
  "the open section's title and chevron show the open state": async ({ example, expect }) => {
    const body = example("single");
    const open = body.locator(".t-accordion-item", { hasText: "web-1" }).first();
    const icon = open.locator(".t-accordion-icon");
    await expect(icon).toHaveCSS("rotate", "180deg");
    await trigger(body, "web-1").click();
    await expect(icon).toHaveCSS("rotate", "none");
  },
  "a disabled section does not open and takes no focus": async ({ page, example, expect }) => {
    const body = example("disabled");
    const locked = trigger(body, "console");
    await locked.click({ force: true });
    await expect(body.getByText("No data.")).toBeHidden();
    await trigger(body, "web-2").focus();
    await page.keyboard.press("Tab");
    await expect(locked).not.toBeFocused();
  },
});
