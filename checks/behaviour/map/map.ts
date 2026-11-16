import { behaviour } from "../../src/behaviour";

const zoomIn = "Zoom in";
const zoomOut = "Zoom out";

export default behaviour("map", {
  "the map is a region with its label": async ({ page, expect }) => {
    await expect(page.getByRole("region", { name: "Host locations" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Office" })).toBeVisible();
  },
  "the zoom buttons change the zoom and stop at the limits": async ({ example, expect }) => {
    // The small map starts at zoom 5 of 0 to 8.
    const body = example("small");
    const inButton = body.getByRole("button", { name: zoomIn });
    const outButton = body.getByRole("button", { name: zoomOut });
    await expect(inButton).not.toHaveAttribute("aria-disabled", "true");
    await inButton.click();
    await inButton.click();
    await expect(inButton).not.toHaveAttribute("aria-disabled", "true");
    await inButton.click();
    await expect(inButton).toHaveAttribute("aria-disabled", "true");
    for (let i = 0; i < 7; i++) await outButton.click();
    await expect(outButton).not.toHaveAttribute("aria-disabled", "true");
    await expect(inButton).not.toHaveAttribute("aria-disabled", "true");
    await outButton.click();
    await expect(outButton).toHaveAttribute("aria-disabled", "true");
  },
  "+ and - zoom while the map has the focus": async ({ page, example, expect }) => {
    const body = example("small");
    const region = page.getByRole("region", { name: "Office" });
    await region.focus();
    await expect(region).toBeFocused();
    for (let i = 0; i < 3; i++) await page.keyboard.press("NumpadAdd");
    await expect(body.getByRole("button", { name: zoomIn })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Minus");
    await expect(body.getByRole("button", { name: zoomIn })).not.toHaveAttribute("aria-disabled", "true");
  },
  "markers are buttons named by their label and take the focus": async ({ page, example, expect }) => {
    const body = example("default");
    for (const name of ["web-1", "nas", "db-1"])
      await expect(body.getByRole("button", { name })).toBeVisible();
    await page.getByRole("region", { name: "Host locations" }).focus();
    await page.keyboard.press("Tab");
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute("aria-label")))
      .toMatch(/^(web-1|nas|db-1)$/);
  },
  "Enter on a marker opens its card, Escape closes it": async ({ page, example, expect }) => {
    const marker = example("default").getByRole("button", { name: "web-1" });
    await marker.focus();
    await page.keyboard.press("Enter");
    const card = page.getByRole("dialog", { name: "web-1" });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Serves example.com.");
    await expect(card.getByRole("link", { name: "web-1" })).toHaveAttribute("href", "#web-1");
    await expect(marker).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => card.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    await expect(marker).toBeFocused();
    await expect(marker).toHaveAttribute("aria-expanded", "false");
  },
  "a click opens the card and its close button closes it": async ({ page, example, expect }) => {
    const marker = example("default").getByRole("button", { name: "db-1" });
    await marker.click();
    const card = page.getByRole("dialog", { name: "db-1" });
    await expect(card).toContainText("Not reachable.");
    await card.getByRole("button", { name: "Close" }).click();
    await expect(card).toBeHidden();
    await expect(marker).toBeFocused();
  },
  "fit shows every marker, also after zooming in": async ({ example, expect }) => {
    const body = example("default");
    const region = body.getByRole("region", { name: "Host locations" });
    const inside = async (): Promise<void> => {
      const box = await region.boundingBox();
      if (!box) throw new Error("no map box");
      for (const name of ["web-1", "nas", "db-1"]) {
        const m = await body.getByRole("button", { name }).boundingBox();
        if (!m) throw new Error(`no marker ${name}`);
        expect(m.x >= box.x && m.y >= box.y).toBe(true);
        expect(m.x + m.width <= box.x + box.width && m.y + m.height <= box.y + box.height).toBe(true);
      }
    };
    await inside();
    for (let i = 0; i < 3; i++) await body.getByRole("button", { name: zoomIn }).click();
    await body.getByRole("button", { name: "Show all markers" }).click();
    await inside();
  },
  "the wheel scrolls the page while the map has no focus": async ({ page, expect }) => {
    const region = page.getByRole("region", { name: "Host locations" });
    const box = await region.boundingBox();
    if (!box) throw new Error("no map box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  },
  "no Leaflet image is ever requested": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "nas" }).click();
    await expect(page.getByRole("dialog", { name: "nas" })).toBeVisible();
    const names = await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name));
    expect(names.filter((n) => /images\/|marker-icon|layers\.png/.test(n))).toEqual([]);
  },
  "a theme change recolours a line": async ({ page, example, expect }) => {
    const line = example("path").locator(".t-map-path");
    await expect(line).toHaveCount(1);
    const stroke = () => line.evaluate((el) => getComputedStyle(el).stroke);
    const before = await stroke();
    await page.evaluate(() => {
      document.documentElement.dataset.palette = "dracula";
    });
    await expect.poll(stroke).not.toBe(before);
    const dracula = await stroke();
    await page.evaluate(() => {
      document.documentElement.dataset.mode = "light";
    });
    await expect.poll(stroke).not.toBe(dracula);
  },
});
