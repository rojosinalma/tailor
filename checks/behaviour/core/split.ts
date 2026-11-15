import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The size of the first pane in percent of the split, measured on the page. */
async function measured(split: Locator, handle: Locator, row = true): Promise<number> {
  const id = (await handle.getAttribute("aria-controls")) ?? "";
  const pane = split.locator(`[id="${id}"]`);
  const [whole, first] = await Promise.all([split.boundingBox(), pane.boundingBox()]);
  if (!whole || !first) throw new Error("no box");
  return row ? (first.width / whole.width) * 100 : (first.height / whole.height) * 100;
}

export default behaviour("split", {
  "the handle is a named separator with its value and limits": async ({ example, expect }) => {
    const handle = example("default").getByRole("separator", { name: "Resize the host list" });
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    await expect(handle).toHaveAttribute("aria-valuenow", "50");
    await expect(handle).toHaveAttribute("aria-valuemin", "15");
    await expect(handle).toHaveAttribute("aria-valuemax", "85");
  },
  "arrow keys move by 2, Home and End go to the limits": async ({ page, example, expect }) => {
    const split = example("default").locator(".t-split");
    const handle = example("default").getByRole("separator", { name: "Resize the host list" });
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "52");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(handle).toHaveAttribute("aria-valuenow", "48");
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", "15");
    expect(Math.abs((await measured(split, handle)) - 15)).toBeLessThan(1.5);
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "85");
    expect(Math.abs((await measured(split, handle)) - 85)).toBeLessThan(1.5);
  },
  "a pointer drag moves the handle and stops at the limits": async ({ page, example, expect }) => {
    const split = example("default").locator(".t-split");
    const handle = example("default").getByRole("separator", { name: "Resize the host list" });
    const [whole, grip] = await Promise.all([split.boundingBox(), handle.boundingBox()]);
    if (!whole || !grip) throw new Error("no box");
    const y = grip.y + grip.height / 2;
    await page.mouse.move(grip.x + grip.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(whole.x + whole.width * 0.3, y, { steps: 5 });
    await expect(handle).toHaveAttribute("aria-valuenow", "30");
    await page.mouse.move(whole.x + 2, y, { steps: 5 });
    await expect(handle).toHaveAttribute("aria-valuenow", "15");
    await page.mouse.up();
    expect(Math.abs((await measured(split, handle)) - 15)).toBeLessThan(1.5);
    // After the release a move does nothing.
    await page.mouse.move(whole.x + whole.width * 0.6, y);
    await expect(handle).toHaveAttribute("aria-valuenow", "15");
  },
  "a column split uses its own size and limits": async ({ page, example, expect }) => {
    const handle = example("column").getByRole("separator", { name: "Resize the output" });
    await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    await expect(handle).toHaveAttribute("aria-valuenow", "30");
    await handle.focus();
    await page.keyboard.press("ArrowDown");
    await expect(handle).toHaveAttribute("aria-valuenow", "32");
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "60");
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", "20");
  },
  "with a storage key the size stays after a reload": async ({ page, example, expect }) => {
    const handle = example("remembered").getByRole("separator", { name: "Resize the side list" });
    await expect(handle).toHaveAttribute("aria-valuenow", "35");
    await handle.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(handle).toHaveAttribute("aria-valuenow", "33");
    await page.reload();
    await expect(
      example("remembered").getByRole("separator", { name: "Resize the side list" }),
    ).toHaveAttribute("aria-valuenow", "33");
  },
  "in a narrow space a row split stacks its panes and hides the handle": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("default");
    await expect(body.getByRole("separator", { name: "Resize the host list" })).toBeHidden();
    const panes = body.locator(".t-split-pane");
    const [first, second] = await Promise.all([panes.nth(0).boundingBox(), panes.nth(1).boundingBox()]);
    const whole = await body.locator(".t-split").boundingBox();
    if (!first || !second || !whole) throw new Error("no box");
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    expect(Math.round(first.width)).toBe(Math.round(whole.width));
    expect(Math.round(second.width)).toBe(Math.round(whole.width));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
});
