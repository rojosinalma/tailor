import { behaviour } from "../../src/behaviour";

export default behaviour("markdown", {
  "a document renders its headings, link, image, table, task list and code block": async ({
    example,
    expect,
  }) => {
    const body = example("document");
    const doc = body.getByRole("region", { name: "Moving web-1" });
    await expect(
      doc.getByRole("heading", { level: 2, name: "Moving web-1 to another host" }),
    ).toHaveAttribute("id", "user-content-moving-web-1-to-another-host");
    const guide = doc.getByRole("link", { name: "the host guide" });
    await expect(guide).toHaveAttribute("href", "https://example.com/docs/hosts");
    await expect(guide).toHaveAttribute("rel", "noopener noreferrer");
    await expect(guide).toHaveAttribute("target", "_blank");
    const steps = doc.getByRole("link", { name: "steps" });
    await expect(steps).toHaveAttribute("href", "#user-content-steps");
    await expect(steps).not.toHaveAttribute("target");
    await expect(doc.locator("#user-content-steps")).toHaveCount(1);
    await expect(doc.getByRole("table").getByRole("cell", { name: "2.4 GB" })).toBeVisible();
    await expect(doc.getByRole("checkbox", { name: "Backup made" })).toBeChecked();
    await expect(doc.getByRole("checkbox", { name: "Backup made" })).toBeDisabled();
    await expect(doc.getByRole("checkbox", { name: "Old copy removed after a week" })).not.toBeChecked();
    const image = doc.getByRole("img", { name: "Requests per minute after the move" });
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const code = doc.locator("pre code");
    await expect(code).toHaveClass("language-sh");
    await expect(code).toContainText("rsync -a");
    await expect(doc.locator("pre")).toHaveClass("t-code-pre");
    await expect(doc.locator("del")).toHaveText("Ask for a maintenance window");
  },
  "unsafe HTML is neither active nor present": async ({ page, example, expect }) => {
    const body = example("unsafe");
    await expect(body.getByText("Only the safe parts of this text stay.")).toBeVisible();
    // The image loads (its handlers would have run by then) and has no handler left.
    const image = body.getByRole("img", { name: "Chart" });
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete)).toBe(true);
    expect(await page.evaluate(() => (window as { tailorUnsafe?: string }).tailorUnsafe)).toBeUndefined();
    const html = await body.locator(".t-markdown").innerHTML();
    for (const bad of [
      "<script",
      "onload",
      "onerror",
      "javascript:",
      "<iframe",
      "style=",
      "data:text/html",
      "<form",
      "<button",
      "data-t",
      "t-dialog",
    ])
      expect(html).not.toContain(bad);
    expect(await body.locator("[style], iframe, object, form, button, script").count()).toBe(0);
    expect(await body.locator("#main").count()).toBe(0);
    // The two links stay as text, without an address.
    await expect(body.getByRole("link")).toHaveCount(0);
    await expect(body.getByText("A script link")).toBeVisible();
    await expect(body.getByText("A paragraph with an inline style.")).toHaveCSS("position", "static");
  },
  "a short comment links its bare address": async ({ example, expect }) => {
    const link = example("comment").getByRole("link", { name: "https://example.com/docs/restart" });
    await expect(link).toHaveAttribute("target", "_blank");
  },
  "the narrow box does not scroll sideways": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const view = example("narrow").locator(".t-markdown");
    await expect(view.getByRole("table")).toBeVisible();
    expect(await view.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
});
