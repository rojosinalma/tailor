import type { Page } from "playwright";
import { behaviour } from "../../src/behaviour";

interface Sent {
  name: string;
  value: unknown;
}

/** The settings server: French fails until `fix` is called; each save takes a moment. */
async function server(page: Page): Promise<{ sent: Sent[]; fix: () => void }> {
  const sent: Sent[] = [];
  let broken = true;
  await page.route("**/api/settings/**", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Sent;
    sent.push(body);
    await new Promise((done) => setTimeout(done, 300));
    const fails = broken && body.value === "fr";
    await route.fulfill({ json: fails ? { ok: false, message: "French is not ready yet." } : { ok: true } });
  });
  return {
    sent,
    fix: () => {
      broken = false;
    },
  };
}

export default behaviour("settings", {
  "a pick saves at once and the row shows saving, then saved": async ({ page, example, expect }) => {
    const { sent } = await server(page);
    const body = example("page");
    const row = body.locator(".t-setting", { hasText: "Theme" });
    await row.getByRole("combobox", { name: /Theme/ }).click();
    await page.getByRole("option", { name: "Dark" }).click();
    await expect(row.locator(".t-setting-state")).toHaveText("Saving");
    await expect(row.locator(".t-setting-state")).toHaveText("Saved");
    await expect(row.locator(".t-setting-state")).toHaveAttribute("aria-live", "polite");
    expect(sent).toEqual([{ name: "theme", value: "dark" }]);
    await expect(row.locator(".t-setting-state")).toHaveText("", { timeout: 4000 });
    await expect(body.getByRole("button", { name: "Save" })).toHaveCount(0);
  },
  "a failure puts the old value back, with a toast and a retry": async ({ page, example, expect }) => {
    const { fix } = await server(page);
    const body = example("page");
    const row = body.locator(".t-setting", { hasText: "Language" });
    const select = row.getByRole("combobox", { name: /Language/ });
    await select.click();
    await page.getByRole("option", { name: "Français" }).click();
    await expect(row.locator(".t-setting-state")).toContainText("Not saved");
    await expect(select).toContainText("English");
    const toast = page.locator(".t-toast", { hasText: "French is not ready yet." });
    await expect(toast).toHaveAttribute("data-tone", "danger");
    fix();
    await row.getByRole("button", { name: "Try again" }).click();
    await expect(row.locator(".t-setting-state")).toHaveText("Saved");
    await expect(select).toContainText("Français");
  },
  "a switch saves its state": async ({ page, example, expect }) => {
    const { sent } = await server(page);
    const body = example("page");
    const toggle = body.getByRole("switch", { name: "Compact lists" });
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(
      body.locator(".t-setting", { hasText: "Compact lists" }).locator(".t-setting-state"),
    ).toHaveText("Saved");
    expect(sent).toEqual([{ name: "compact", value: true }]);
  },
  "text saves once after a pause": async ({ page, example, expect }) => {
    const { sent } = await server(page);
    const body = example("page");
    const input = body.getByRole("textbox", { name: "Display name" });
    await input.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Smith", { delay: 50 });
    expect(sent).toEqual([]);
    await expect(
      body.locator(".t-setting", { hasText: "Display name" }).locator(".t-setting-state"),
    ).toHaveText("Saved");
    expect(sent).toEqual([{ name: "display-name", value: "Alice Smith" }]);
  },
  "the list marks the section in view; a link scrolls to its section": async ({ example, expect }) => {
    const body = example("page");
    const nav = body.getByRole("navigation", { name: "Sections" });
    await expect(nav.getByRole("link", { name: "Look" })).toHaveAttribute("aria-current", "true");
    await nav.getByRole("link", { name: "Alerts" }).click();
    await expect(nav.getByRole("link", { name: "Alerts" })).toHaveAttribute("aria-current", "true");
    await expect(body.getByRole("heading", { name: "Alerts" })).toBeFocused();
    await expect(body.getByRole("heading", { name: "Alerts" })).toBeInViewport();
    await body.locator(".t-settings-content").evaluate((content) => content.scrollTo({ top: 0 }));
    await expect(nav.getByRole("link", { name: "Look" })).toHaveAttribute("aria-current", "true");
  },
  "a help button beside a label opens its explanation": async ({ page, example, expect }) => {
    await example("page").getByRole("button", { name: "More information: Language" }).click();
    await expect(page.getByText("Dates and numbers follow the language too.")).toBeVisible();
  },
  "in a narrow box the links form a row above the content": async ({ example, expect }) => {
    const body = example("narrow");
    const nav = await body.getByRole("navigation", { name: "Sections" }).boundingBox();
    const content = await body.locator(".t-settings-content").boundingBox();
    expect(nav && content && nav.y + nav.height <= content.y + 1).toBe(true);
    const control = await body.getByRole("textbox", { name: "Display name" }).boundingBox();
    expect(control && content && control.width > content.width * 0.8).toBe(true);
  },
  "in a dialog the page fills the dialog and scrolls inside it": async ({ page, example, expect }) => {
    await example("dialog").getByRole("button", { name: "Open settings" }).click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Alerts" }).click();
    await expect(dialog.getByRole("link", { name: "Alerts" })).toHaveAttribute("aria-current", "true");
    await expect(dialog.getByRole("heading", { name: "Alerts" })).toBeInViewport();
    const box = await dialog.boundingBox();
    expect(box && box.y >= 0 && box.y + box.height <= 800).toBe(true);
  },
  "on a phone the settings stay inside the screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const box = await example("page").getByRole("textbox", { name: "Email" }).boundingBox();
    expect(box && box.x + box.width <= 390).toBe(true);
  },
});
