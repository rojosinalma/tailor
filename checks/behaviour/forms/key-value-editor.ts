import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The KEY=value lines that the editor holds, read from its controls. */
const lines = (body: Locator) =>
  body.locator(".t-kv-editor-row").evaluateAll((rows) =>
    rows.map((row) => {
      const key = row.querySelector<HTMLInputElement>(".t-kv-editor-key input");
      const value = row.querySelector<HTMLInputElement>(".t-kv-editor-value input");
      return `${key?.value ?? ""}=${value?.value ?? ""}`;
    }),
  );

export default behaviour("key-value-editor", {
  "shows a key and a value per row; a secret key hides its value": async ({ example, expect }) => {
    const body = example("default");
    await expect(body.getByRole("group", { name: "Environment" })).toBeVisible();
    await expect(body.getByRole("textbox", { name: "Key 1" })).toHaveValue("PORT");
    await expect(body.getByRole("textbox", { name: "Value 1" })).toHaveValue("8080");
    await expect(body.getByLabel("Value 3", { exact: true })).toHaveAttribute("type", "password");
    await body.getByRole("button", { name: "Show" }).click();
    await expect(body.getByLabel("Value 3", { exact: true })).toHaveAttribute("type", "text");
  },
  "a key that becomes secret hides its value": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("textbox", { name: "Key 1" }).fill("API_TOKEN");
    await expect(body.getByLabel("Value 1", { exact: true })).toHaveAttribute("type", "password");
    await expect(body.getByLabel("Value 1", { exact: true })).toHaveValue("8080");
  },
  "Add appends a row and focuses its key; remove takes a row out": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Add" }).click();
    await expect(body.getByRole("textbox", { name: "Key 4" })).toBeFocused();
    await page.keyboard.type("DEBUG");
    await page.keyboard.press("Tab");
    await page.keyboard.type("1");
    expect(await lines(body)).toEqual([
      "PORT=8080",
      "HOST=web-1.example.com",
      "DB_PASSWORD=correct-horse",
      "DEBUG=1",
    ]);
    await body.getByRole("button", { name: "Remove row 1" }).click();
    await expect(body.getByRole("textbox", { name: "Key 1" })).toBeFocused();
    expect(await lines(body)).toEqual(["HOST=web-1.example.com", "DB_PASSWORD=correct-horse", "DEBUG=1"]);
  },
  "a key used twice is marked until it changes": async ({ example, expect }) => {
    const body = example("duplicate");
    const third = body.getByRole("textbox", { name: "Key 3" });
    await expect(third).toHaveAttribute("aria-invalid", "true");
    await expect(third).toHaveAccessibleDescription("This key is used twice.");
    await expect(body.getByRole("textbox", { name: "Key 1" })).toHaveAttribute("aria-invalid", "true");
    await expect(body.getByRole("textbox", { name: "Key 2" })).not.toHaveAttribute("aria-invalid", "true");
    await third.fill("owner");
    await expect(third).not.toHaveAttribute("aria-invalid", "true");
    await expect(body.getByText("This key is used twice.")).toHaveCount(0);
  },
  "a paste of KEY=value lines into a key fills one row per line": async ({ page, example, expect }) => {
    const body = example("empty");
    await body.getByRole("button", { name: "Add" }).click();
    const key = body.getByRole("textbox", { name: "Key 1" });
    await page.evaluate(() => navigator.clipboard.writeText("A=1\nB=two\n# note\nC=x=y"));
    await key.focus();
    await page.keyboard.press("ControlOrMeta+v");
    expect(await lines(body)).toEqual(["A=1", "B=two", "C=x=y"]);
    await expect(body.getByRole("textbox", { name: "Value 3" })).toBeFocused();
  },
  "the form gets KEY=value lines": async ({ example, expect }) => {
    const body = example("duplicate");
    await body.getByRole("button", { name: "Remove row 2" }).click();
    await expect(body.locator('[name="labels"]')).toHaveValue("team=ops\nteam=web");
  },
  "a click on the field label focuses the first key": async ({ example, expect }) => {
    const body = example("field");
    await body.locator(".t-field-label").click();
    await expect(body.getByRole("textbox", { name: "Key 1" })).toBeFocused();
  },
  "a disabled editor takes no input": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByRole("textbox", { name: "Key 1" })).toBeDisabled();
    await expect(body.getByRole("button", { name: "Add" })).toBeDisabled();
  },
});
