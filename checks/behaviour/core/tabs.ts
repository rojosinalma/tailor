import { behaviour } from "../../src/behaviour";

export default behaviour("tabs", {
  "a click shows the panel of the tab": async ({ example, expect }) => {
    const body = example("default");
    const overview = body.getByRole("tab", { name: "Overview" });
    const logs = body.getByRole("tab", { name: "Logs" });
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await expect(body.getByRole("tabpanel")).toHaveCount(1);
    await expect(body.getByRole("tabpanel")).toContainText("up for 12 days");
    await logs.click();
    await expect(logs).toHaveAttribute("aria-selected", "true");
    await expect(overview).toHaveAttribute("aria-selected", "false");
    await expect(body.getByRole("tabpanel")).toHaveCount(1);
    await expect(body.getByRole("tabpanel", { name: "Logs" })).toContainText("128 new lines");
  },
  "the arrow keys move the focus, Enter shows the panel": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("tab", { name: "Overview" }).focus();
    await page.keyboard.press("ArrowRight");
    const services = body.getByRole("tab", { name: "Services" });
    await expect(services).toBeFocused();
    await expect(services).toHaveAttribute("tabindex", "0");
    await expect(body.getByRole("tab", { name: "Overview" })).toHaveAttribute("tabindex", "-1");
    await expect(body.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(services).toHaveAttribute("aria-selected", "true");
    await expect(body.getByRole("tabpanel")).toContainText("nginx, api and worker");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(body.getByRole("tab", { name: "Settings" })).toBeFocused();
    await page.keyboard.press(" ");
    await expect(body.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  },
  "Home and End go to the first and the last tab": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("tab", { name: "Overview" }).focus();
    await page.keyboard.press("End");
    await expect(body.getByRole("tab", { name: "Settings" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(body.getByRole("tab", { name: "Overview" })).toBeFocused();
  },
  "Tab leaves the list and reaches the panel": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("tab", { name: "Overview" }).focus();
    await page.keyboard.press("Tab");
    await expect(body.getByRole("tabpanel")).toBeFocused();
  },
  "a disabled tab takes the focus but never shows": async ({ page, example, expect }) => {
    const body = example("default");
    const backups = body.getByRole("tab", { name: "Backups" });
    await expect(backups).toHaveAttribute("aria-disabled", "true");
    await backups.click({ force: true });
    await expect(backups).toHaveAttribute("aria-selected", "false");
    await body.getByRole("tab", { name: "Logs" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(backups).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(backups).toHaveAttribute("aria-selected", "false");
    await expect(body.getByRole("tabpanel")).toContainText("up for 12 days");
  },
  "in a narrow container the list scrolls inside itself to the selected tab": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.reload();
    const body = example("many");
    const list = body.getByRole("tablist");
    const settings = body.getByRole("tab", { name: "Settings" });
    await expect(settings).toHaveAttribute("aria-selected", "true");
    await expect(settings).toBeInViewport({ ratio: 1 });
    const page390 = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(page390).toBe(390);
    const sizes = await list.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    await body.getByRole("tab", { name: "Overview" }).focus();
    await expect(body.getByRole("tab", { name: "Overview" })).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Enter");
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await expect(settings).toHaveAttribute("aria-selected", "true");
    await expect(settings).toBeInViewport({ ratio: 1 });
    const box = await list.boundingBox();
    const tab = await settings.boundingBox();
    expect(Math.round((tab?.x ?? 0) + (tab?.width ?? 0))).toBeLessThanOrEqual(
      Math.round((box?.x ?? 0) + (box?.width ?? 0)),
    );
  },
});
