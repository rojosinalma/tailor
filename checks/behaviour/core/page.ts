import { behaviour } from "../../src/behaviour";

export default behaviour("page", {
  "a wide page shows the other actions as buttons, next to the main action": async ({ example, expect }) => {
    const body = example("more-actions");
    await expect(body.getByRole("button", { name: "Start now" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Postpone" })).toBeVisible();
    await expect(body.getByRole("link", { name: "Read the plan" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Cancel window" })).toBeVisible();
    await expect(body.getByRole("button", { name: "More" })).toBeHidden();
  },
  "a narrow page puts them into one menu; the main action stays": async ({ page, example, expect }) => {
    const body = example("more-actions-narrow");
    await expect(body.getByRole("button", { name: "Start now" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Postpone" })).toBeHidden();
    const more = body.getByRole("button", { name: "More" });
    await expect(more).toBeVisible();
    await more.click();
    const menu = page.getByRole("menu", { name: "More" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Postpone" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Read the plan" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Cancel window" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(more).toBeFocused();
  },
  "a fill page never scrolls; its panes do": async ({ example, expect }) => {
    const body = example("fill");
    const page = body.locator(".t-page-body");
    const scrolls = await page.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(scrolls).toBe(false);
    const log = body.getByRole("region", { name: "web-1" });
    expect(await log.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await log.focus();
    await log.press("End");
    expect(await log.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  },
  "a scroll page keeps its header while the body scrolls": async ({ example, expect }) => {
    const body = example("scroll");
    const title = body.getByRole("heading", { level: 1, name: "Hosts" });
    const before = await title.boundingBox();
    await body.locator(".t-page-body").evaluate((el) => el.scrollTo(0, el.scrollHeight));
    expect(await body.locator(".t-page-body").evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect((await title.boundingBox())?.y).toBe(before?.y);
  },
});
