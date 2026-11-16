import { behaviour } from "../../src/behaviour";

export default behaviour("hotkeys", {
  "a shortcut fires and a sequence works": async ({ page, example, expect }) => {
    const body = example("registered");
    await body.getByText("Last shortcut").waitFor();
    await page.keyboard.press("Shift+R");
    await expect(body.getByText("Last shortcut: Refresh the list")).toBeVisible();
    await page.keyboard.press("g");
    await page.keyboard.press("s");
    await expect(body.getByText("Last shortcut: Go to settings")).toBeVisible();
    await page.keyboard.press("g");
    await page.keyboard.press("h");
    await expect(body.getByText("Last shortcut: Go to hosts")).toBeVisible();
  },
  "Mod works as Control": async ({ page, example, expect }) => {
    const body = example("registered");
    await body.getByText("Last shortcut").waitFor();
    await page.keyboard.press("Control+s");
    await expect(body.getByText("Last shortcut: Save")).toBeVisible();
  },
  "in a text field only a shortcut with Mod fires": async ({ page, example, expect }) => {
    const body = example("registered");
    const field = body.getByRole("textbox", { name: "Host name" });
    await field.click();
    await page.keyboard.press("n");
    await page.keyboard.press("Shift+R");
    await expect(field).toHaveValue("nR");
    await expect(body.getByText("Last shortcut: none yet")).toBeVisible();
    await page.keyboard.press("Control+s");
    await expect(body.getByText("Last shortcut: Save")).toBeVisible();
  },
  "the list shows each shortcut, and unmounting unregisters it": async ({ page, example, expect }) => {
    const body = example("registered");
    const list = body.locator("dl");
    await expect(list.getByText("New host")).toBeVisible();
    await expect(list.getByText("Go to settings")).toBeVisible();
    await page.keyboard.press("n");
    await expect(body.getByText("Last shortcut: New host")).toBeVisible();
    await page.keyboard.press("Shift+R");
    await body.getByRole("switch", { name: "The N shortcut" }).click();
    await expect(list.getByText("New host")).toHaveCount(0);
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await page.keyboard.press("n");
    await expect(body.getByText("Last shortcut: Refresh the list")).toBeVisible();
  },
  "inside a dialog only the dialog's shortcut fires": async ({ page, example, expect }) => {
    const body = example("dialog");
    await body.getByRole("button", { name: "Host web-1" }).click();
    const dialog = page.getByRole("dialog", { name: "Host web-1" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("e");
    await expect(body.getByText("Last shortcut: Edit the host")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.keyboard.press("e");
    await expect(body.getByText("Last shortcut: Export")).toBeVisible();
  },
  "the keys show Ctrl where Mod is written": async ({ example, expect }) => {
    const values = example("keys").getByRole("definition");
    await expect(values.first().locator("kbd kbd")).toHaveText(["Ctrl", "K"]);
    await expect(values.nth(3)).toHaveText(/^G\s*then\s*S$/);
  },
});
