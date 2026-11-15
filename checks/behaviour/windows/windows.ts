import type { Locator, Page } from "playwright";
import { behaviour } from "../../src/behaviour";

/** Presses a page button with the keyboard: an open window may lie over it. */
const press = async (page: Page, button: Locator): Promise<void> => {
  await button.focus();
  await page.keyboard.press("Enter");
};

const win = (page: Page, name: string): Locator => page.getByRole("group", { name, exact: true });
const bar = (window: Locator): Locator => window.getByRole("group", { name: "Move and resize" });
const box = async (locator: Locator) => {
  const found = await locator.boundingBox();
  if (!found) throw new Error("no box");
  return found;
};
const z = (locator: Locator): Promise<number> =>
  locator.evaluate((el) => Number(getComputedStyle(el).zIndex));

async function openBoth(page: Page, body: Locator): Promise<{ notes: Locator; preview: Locator }> {
  await press(page, body.getByRole("button", { name: "Open notes" }));
  await press(page, body.getByRole("button", { name: "Open preview" }));
  return { notes: win(page, "Notes"), preview: win(page, "Preview") };
}

export default behaviour("windows", {
  "two windows open; the newest is in front and its bar takes the focus": async ({
    page,
    example,
    expect,
  }) => {
    const { notes, preview } = await openBoth(page, example("default"));
    await expect(notes).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(bar(preview)).toBeFocused();
    expect(await z(preview)).toBeGreaterThan(await z(notes));
    await expect(example("default")).toContainText("2 windows open");
  },
  "dragging the title bar moves the window": async ({ page, example, expect }) => {
    const { preview } = await openBoth(page, example("default"));
    const before = await box(preview);
    const title = await box(preview.getByRole("heading", { name: "Preview" }));
    await page.mouse.move(title.x + 10, title.y + title.height / 2);
    await page.mouse.down();
    await page.mouse.move(title.x + 110, title.y + title.height / 2 + 60, { steps: 5 });
    await page.mouse.up();
    const after = await box(preview);
    expect(Math.round(after.x - before.x)).toBe(100);
    expect(Math.round(after.y - before.y)).toBe(60);
    expect(after.width).toBe(before.width);
  },
  "a corner resizes the window, down to the least size": async ({ page, example, expect }) => {
    const { preview } = await openBoth(page, example("default"));
    const before = await box(preview);
    const corner = { x: before.x + before.width + 2, y: before.y + before.height + 2 };
    await page.mouse.move(corner.x, corner.y);
    await page.mouse.down();
    await page.mouse.move(corner.x + 80, corner.y + 40, { steps: 4 });
    await page.mouse.up();
    let after = await box(preview);
    expect(Math.round(after.width - before.width)).toBe(80);
    expect(Math.round(after.height - before.height)).toBe(40);
    expect(after.x).toBe(before.x);
    await page.mouse.move(corner.x + 80, corner.y + 40);
    await page.mouse.down();
    await page.mouse.move(corner.x - 1000, corner.y - 1000, { steps: 4 });
    await page.mouse.up();
    after = await box(preview);
    const min = await preview.evaluate((el) => Number.parseFloat(getComputedStyle(el).minWidth));
    expect(Math.round(after.width)).toBe(Math.round(min));
  },
  "the keys on the bar move and resize the window": async ({ page, example, expect }) => {
    const { preview } = await openBoth(page, example("default"));
    await expect(bar(preview)).toBeFocused();
    await expect(bar(preview)).toHaveAccessibleDescription(/Arrow keys move the window/);
    const start = await box(preview);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowDown");
    let now = await box(preview);
    expect(Math.round(now.x - start.x)).toBe(16);
    expect(Math.round(now.y - start.y)).toBe(64);
    await page.keyboard.press("Alt+ArrowRight");
    await page.keyboard.press("Alt+ArrowUp");
    now = await box(preview);
    expect(Math.round(now.width - start.width)).toBe(16);
    expect(Math.round(now.height - start.height)).toBe(-16);
  },
  "a click brings a window to the front": async ({ page, example, expect }) => {
    const { notes, preview } = await openBoth(page, example("default"));
    const n = await box(notes);
    // The top start corner of the notes window lies outside the preview window.
    await page.mouse.click(n.x + 8, n.y + n.height - 8);
    expect(await z(notes)).toBeGreaterThan(await z(preview));
    await expect(notes).toHaveAttribute("data-focused", "");
    await expect(preview).not.toHaveAttribute("data-focused", "");
  },
  "minimise goes to the tray and keeps the content; restore brings it back": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("default");
    await press(page, body.getByRole("button", { name: "Open notes" }));
    const notes = win(page, "Notes");
    const text = notes.getByRole("textbox", { name: "Notes" });
    await text.fill("Check the disks of nas.");
    await notes.getByRole("button", { name: "Minimise" }).click();
    await expect(notes).toBeHidden();
    const tray = page.getByRole("group", { name: "Minimised windows" });
    const restore = tray.getByRole("button", { name: "Restore Notes" });
    await expect(restore).toBeFocused();
    await restore.click();
    await expect(notes).toBeVisible();
    await expect(text).toHaveValue("Check the disks of nas.");
    await expect(bar(notes)).toBeFocused();
    await expect(tray).toBeHidden();
  },
  "maximise fills the viewport and restore returns the box": async ({ page, example, expect }) => {
    await press(page, example("default").getByRole("button", { name: "Open notes" }));
    const notes = win(page, "Notes");
    const before = await box(notes);
    await notes.getByRole("button", { name: "Maximise" }).click();
    const full = await box(notes);
    const viewport = page.viewportSize();
    expect(full.width).toBe(viewport?.width);
    expect(full.height).toBe(viewport?.height);
    await notes.getByRole("button", { name: "Restore" }).click();
    expect(await box(notes)).toEqual(before);
    await bar(notes).dblclick({ position: { x: 120, y: 10 } });
    expect((await box(notes)).width).toBe(viewport?.width);
    await bar(notes).focus();
    await page.keyboard.press("Enter");
    expect(await box(notes)).toEqual(before);
  },
  "Escape keeps the window; the close button returns the focus to the opener": async ({
    page,
    example,
    expect,
  }) => {
    const opener = example("default").getByRole("button", { name: "Open notes" });
    await press(page, opener);
    const notes = win(page, "Notes");
    await notes.getByRole("textbox", { name: "Notes" }).focus();
    await page.keyboard.press("Escape");
    await expect(notes).toBeVisible();
    await notes.getByRole("button", { name: "Close", exact: true }).click();
    await expect(notes).toBeHidden();
    await expect(opener).toBeFocused();
  },
  "a window opens a third one, and an open id comes to the front": async ({ page, example, expect }) => {
    const { notes, preview } = await openBoth(page, example("default"));
    await press(page, notes.getByRole("button", { name: "Open host web-1" }));
    const host = win(page, "Host web-1");
    await expect(host).toBeVisible();
    await press(page, example("default").getByRole("button", { name: "Open preview" }));
    expect(await z(preview)).toBeGreaterThan(await z(host));
    await expect(example("default")).toContainText("3 windows open");
  },
  "F6 moves the focus between the page and the windows": async ({ page, example, expect }) => {
    const { notes, preview } = await openBoth(page, example("default"));
    const opener = example("default").getByRole("button", { name: "Open preview" });
    await opener.focus();
    await page.keyboard.press("F6");
    await expect(bar(notes)).toBeFocused();
    await page.keyboard.press("F6");
    await expect(bar(preview)).toBeFocused();
    await page.keyboard.press("F6");
    await expect(opener).toBeFocused();
    await page.keyboard.press("Shift+F6");
    await expect(bar(preview)).toBeFocused();
  },
  "a window cannot leave the viewport": async ({ page, example, expect }) => {
    await press(page, example("default").getByRole("button", { name: "Open notes" }));
    const notes = win(page, "Notes");
    const title = await box(notes.getByRole("heading", { name: "Notes" }));
    await page.mouse.move(title.x + 5, title.y + 5);
    await page.mouse.down();
    await page.mouse.move(3000, 3000, { steps: 4 });
    await page.mouse.up();
    let now = await box(notes);
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    expect(now.x).toBeLessThanOrEqual(viewport.width - 48);
    expect(now.y).toBeLessThanOrEqual(viewport.height - 48);
    await page.mouse.move(now.x + 20, now.y + 10);
    await page.mouse.down();
    await page.mouse.move(-3000, -3000, { steps: 4 });
    await page.mouse.up();
    now = await box(notes);
    expect(now.x + now.width).toBeGreaterThanOrEqual(48);
    expect(now.y).toBe(0);
    // A smaller viewport pulls the window back in.
    await page.setViewportSize({ width: 900, height: 600 });
    await press(page, example("default").getByRole("button", { name: "Open notes" }));
    await page.keyboard.press("Shift+ArrowRight");
    for (let i = 0; i < 20; i++) await page.keyboard.press("Shift+ArrowRight");
    await page.setViewportSize({ width: 700, height: 600 });
    await expect.poll(async () => (await box(notes)).x).toBeLessThanOrEqual(700 - 48);
  },
  "the layout comes back after a reload with a storage key": async ({ page, example, expect }) => {
    await press(page, example("remembered").getByRole("button", { name: "Open notes" }));
    const notes = win(page, "Notes");
    for (let i = 0; i < 3; i++) await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Alt+ArrowDown");
    const before = await box(notes);
    await page.reload();
    await press(page, example("remembered").getByRole("button", { name: "Open notes" }));
    await expect(notes).toBeVisible();
    expect(await box(notes)).toEqual(before);
  },
  "the body that scrolls takes the focus": async ({ page, example, expect }) => {
    await press(page, example("declarative").getByRole("button", { name: "Show the log" }));
    const log = win(page, "Log of web-1");
    await expect(log.getByRole("region", { name: "Log of web-1" })).toHaveAttribute("tabindex", "0");
    await log.getByRole("button", { name: "Close", exact: true }).click();
    await expect(log).toBeHidden();
    await press(page, example("declarative").getByRole("button", { name: "Show the log" }));
    await expect(log).toBeVisible();
  },
  "on a phone a window takes the full screen and has no maximise": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const { preview } = await openBoth(page, example("default"));
    expect(await box(preview)).toEqual({ x: 0, y: 0, width: 390, height: 800 });
    await expect(preview.getByRole("button", { name: "Maximise" })).toBeHidden();
    await page.keyboard.press("ArrowRight");
    expect((await box(preview)).x).toBe(0);
    await preview.getByRole("button", { name: "Minimise" }).click();
    const tray = page.getByRole("group", { name: "Minimised windows" });
    await expect(tray).toBeVisible();
    const trayBox = await box(tray);
    expect(trayBox.x).toBe(0);
    expect(trayBox.width).toBe(390);
    const notes = win(page, "Notes");
    expect((await box(notes)).y + (await box(notes)).height).toBeLessThanOrEqual(trayBox.y + 1);
  },
});
