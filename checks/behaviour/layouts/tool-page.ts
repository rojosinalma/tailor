import type { Locator, Page } from "playwright";
import { behaviour } from "../../src/behaviour";

/** A picture of one pixel. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/** The server of the HTML kit: it takes a moment and answers with the rendered picture, not with JSON. */
async function server(page: Page): Promise<void> {
  await page.route("**/api/render", async (route) => {
    const body = route.request().postData() ?? "";
    const file = /name="drawing"; filename="([^"]*)"/.exec(body)?.[1] ?? "drawing.svg";
    await new Promise((done) => setTimeout(done, 600));
    await route.fulfill({
      contentType: "image/png",
      headers: { "Content-Disposition": `attachment; filename="${file.replace(/\.[^.]*$/, "")}.png"` },
      body: PNG,
    });
  });
}

/** True when the element's content is taller than its box: it scrolls. */
const scrolls = (element: Locator) => element.evaluate((el) => el.scrollHeight > el.clientHeight + 1);

export default behaviour("tool-page", {
  "the page body never scrolls; the preview fits its pane; the settings scroll alone": async ({
    page,
    example,
    expect,
  }) => {
    for (const size of [
      { width: 1440, height: 900 },
      { width: 2560, height: 1600 },
    ]) {
      await page.setViewportSize(size);
      const body = example("default");
      const preview = body.getByRole("region", { name: "Preview" });
      const img = preview.getByRole("img", { name: "Preview of floor-plan.svg" });
      await img.evaluate((el) => (el as HTMLImageElement).decode());
      expect(await scrolls(body.locator(".t-page-body"))).toBe(false);
      expect(await scrolls(preview)).toBe(false);
      const [box, area] = await Promise.all([img.boundingBox(), preview.boundingBox()]);
      if (!box || !area) throw new Error("no box");
      expect(box.height).toBeLessThan(area.height);
      expect(box.width).toBeLessThan(area.width);
      const settings = body.getByRole("region", { name: "Settings" });
      expect(await scrolls(settings)).toBe(true);
      await settings.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await expect(settings.getByRole("switch", { name: "Draw the grid" })).toBeInViewport();
      expect(await body.locator(".t-page-body").evaluate((el) => el.scrollTop)).toBe(0);
    }
  },
  "Render with no drawing names the field; with one, Render is busy, the picture shows and downloads":
    async ({ page, kit, example, expect }) => {
      await server(page);
      const body = example("empty");
      await expect(body.getByText("No preview yet")).toBeVisible();
      const render = body.getByRole("button", { name: "Render" });
      await render.click();
      await expect(body.getByRole("group", { name: "Drawing" })).toHaveAttribute("aria-invalid", "true");
      await expect(body).toContainText("This field is required");
      await body.locator('input[name="drawing"]').setInputFiles({
        name: "site.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      });
      await expect(body.getByRole("group", { name: "Drawing" })).not.toHaveAttribute("aria-invalid", "true");
      // HTML kit: t:send tells the page what goes out, so it needs no watch on the button.
      if (kit === "html")
        await body.locator("form").evaluate((form) => {
          form.addEventListener("t:send", (event) => {
            const data = (event as CustomEvent<{ data: FormData }>).detail.data;
            form.setAttribute("data-sent", (data.get("drawing") as File | null)?.name ?? "");
          });
        });
      await render.click();
      if (kit === "html") await expect(body.locator("form")).toHaveAttribute("data-sent", "site.svg");
      // The button is busy while the render runs, in both kits: the page wrote no code for it.
      await expect(render).toHaveAttribute("aria-busy", "true");
      await expect(render).not.toHaveAttribute("aria-busy", "true");
      // The picture answer goes into the preview by itself; in the React kit onSubmit puts it there.
      await expect(body.getByRole("img", { name: "Preview of site.svg" })).toBeVisible();
      await expect(body.getByText("No preview yet")).toBeHidden();
      if (kit === "react")
        await expect(page.locator(".t-toast", { hasText: "site.svg is rendered." })).toBeVisible();
      const download = body.getByRole("button", { name: "Download" });
      await expect(download).toBeEnabled();
      const [file] = await Promise.all([page.waitForEvent("download"), download.click()]);
      expect(file.suggestedFilename()).toBe("site.png");
    },
  "narrow: one column that scrolls as a page, inputs in full above the result": async ({
    example,
    expect,
  }) => {
    const body = example("narrow");
    const settings = body.getByRole("region", { name: "Settings" });
    const preview = body.getByRole("region", { name: "Preview" });
    const page = body.locator(".t-page-body");
    const [a, b] = await Promise.all([settings.boundingBox(), preview.boundingBox(), page.boundingBox()]);
    if (!a || !b) throw new Error("no box");
    expect(a.y + a.height).toBeLessThanOrEqual(b.y);
    expect(Math.abs(a.x - b.x)).toBeLessThan(1);
    // The panes keep their natural height: neither scrolls, the page body does.
    expect(await scrolls(settings)).toBe(false);
    expect(await scrolls(preview)).toBe(false);
    expect(await scrolls(page)).toBe(true);
    const render = body.getByRole("button", { name: "Render" });
    await render.scrollIntoViewIfNeeded();
    await expect(render).toBeInViewport();
    await expect(settings.getByRole("switch", { name: "Draw the grid" })).toBeInViewport();
    // The picture fits the width of its pane and keeps its ratio.
    const img = preview.getByRole("img", { name: "Preview of floor-plan.svg" });
    await img.evaluate((el) => (el as HTMLImageElement).decode());
    await img.scrollIntoViewIfNeeded();
    const [box, pane] = await Promise.all([img.boundingBox(), preview.boundingBox()]);
    if (!box || !pane) throw new Error("no box");
    expect(box.width).toBeLessThan(pane.width);
    expect(Math.abs(box.width / box.height - 1200 / 900)).toBeLessThan(0.02);
  },
});
