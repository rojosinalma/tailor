import { behaviour } from "../../src/behaviour";
import { fullScreen, skipLinkWorks } from "../core/shell-base";

export default behaviour("bare", {
  "the content sits in the middle at a card's width": async ({ example, expect }) => {
    const body = example("sign-in");
    const frame = await body.boundingBox();
    const column = await body.locator(".t-bare-column").boundingBox();
    if (!frame || !column) throw new Error("no box");
    expect(Math.abs(frame.x + frame.width / 2 - (column.x + column.width / 2))).toBeLessThan(2);
    expect(column.width).toBeLessThanOrEqual(321);
  },
  "the skip link works": async ({ page, example }) => {
    await skipLinkWorks(page, example("sign-in"));
  },
  "a full-screen view fills the window and never scrolls": async ({ page, example, expect }) => {
    await fullScreen(example("wall"));
    expect(await page.evaluate(() => document.scrollingElement?.scrollHeight)).toBe(800);
    expect(Math.round((await page.locator(".t-shell").boundingBox())?.height ?? 0)).toBe(800);
  },
});
