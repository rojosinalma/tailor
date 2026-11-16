import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

const atEnd = (view: Locator) =>
  view.evaluate((el) => Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <= 4);

export default behaviour("log-view", {
  "follow keeps the end in view and stops when the user scrolls up": async ({ example, expect }) => {
    const body = example("default");
    const view = body.getByRole("region", { name: "Service log" });
    const follow = body.getByRole("switch", { name: "Follow" });
    await expect(follow).toBeChecked();
    await expect.poll(() => atEnd(view)).toBe(true);
    await expect(body.getByRole("button", { name: "Jump to end" })).toBeHidden();
    await view.hover();
    await view.evaluate((el) => {
      el.scrollTop = el.scrollTop - 300;
    });
    await expect(follow).not.toBeChecked();
    await body.getByRole("button", { name: "Jump to end" }).click();
    await expect(follow).toBeChecked();
    await expect.poll(() => atEnd(view)).toBe(true);
    await expect(body.getByRole("button", { name: "Jump to end" })).toBeHidden();
  },
  "Add a line appends one line and the view stays at the end while following": async ({
    example,
    expect,
  }) => {
    const body = example("live");
    const view = body.getByRole("region", { name: "Live log" });
    const lines = body.locator(".t-log-line");
    await expect(lines).toHaveCount(30);
    const add = body.getByRole("button", { name: "Add a line" });
    for (let i = 0; i < 12; i++) await add.click();
    await expect(lines).toHaveCount(42);
    const last = lines.last();
    await expect(last).toContainText("deploy of web-1 done in 42s");
    await expect(last.locator(".t-log-time")).toHaveText("10:05:00");
    await expect(last).toHaveAttribute("data-level", "info");
    expect(await last.textContent()).not.toContain("\x1b");
    await expect.poll(() => atEnd(view)).toBe(true);
  },
  "a wrapped log of a few hundred lines renders every line, as the HTML kit does": async ({
    example,
    expect,
  }) => {
    await expect(example("wrap").locator(".t-log-line")).toHaveCount(80);
  },
  "the filter hides other lines and marks the matches": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("searchbox", { name: "Filter" }).fill("TIMEOUT after");
    const visible = body.locator(".t-log-line:visible");
    await expect(visible.first()).toContainText("timeout after");
    const count = await visible.count();
    expect(count).toBeGreaterThan(5);
    for (let i = 0; i < Math.min(count, 5); i++) await expect(visible.nth(i)).toContainText("ERROR");
    await expect(body.locator("mark.t-log-mark").first()).toHaveText("timeout after");
  },
  "ANSI codes show as palette colours and leave no codes in the text": async ({ example, expect }) => {
    const body = example("default");
    const error = body.locator(".t-log-line[data-level='error']").last();
    await expect(error.locator('[data-fg="red"][data-bold]')).toHaveText("failed");
    await expect(error.locator('[data-fg="cyan"]')).toHaveText(/\d+ms/);
    await expect(error).toHaveAttribute("data-tone", "danger");
    expect(await error.textContent()).not.toContain("\x1b");
    const color = await error.locator('[data-fg="red"]').evaluate((el) => getComputedStyle(el).color);
    const hue = await error.evaluate((el) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--t-hue-red-text)";
      el.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    expect(color).toBe(hue);
  },
  "copy puts the shown lines on the clipboard": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("searchbox", { name: "Filter" }).fill("/api/items/49");
    const copy = body.getByRole("button", { name: "Copy" });
    await copy.click();
    await expect(body.getByRole("button", { name: "Copied" })).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const rows = text.split("\n");
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) expect(row).toContain("/api/items/49");
    expect(text).not.toContain("\x1b");
    expect(rows[0]).toMatch(/^\d\d:\d\d:\d\d [A-Z]+ /);
  },
});
