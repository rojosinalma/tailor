import { behaviour } from "../../src/behaviour";

export default behaviour("code-field", {
  "typing colours the code and Tab indents": async ({ page, example, expect }) => {
    const body = example("placeholder");
    const field = body.getByRole("textbox", { name: "Environment" });
    await field.click();
    await page.keyboard.type("[server]\nport=80");
    await expect(body.locator(".hljs-section")).toHaveText("[server]");
    await page.keyboard.press("Home");
    await page.keyboard.press("Tab");
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("[server]\n  port=80");
    await expect(field).toHaveAccessibleDescription(/Escape, then Tab/);
  },
  "Escape, then Tab leaves the field": async ({ page, example, expect }) => {
    const field = example("sql").getByRole("textbox", { name: "Query" });
    await field.focus();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(field).not.toBeFocused();
    await expect(field).toHaveValue(/^SELECT name/);
  },
  "Tab on a selection indents every line": async ({ page, example, expect }) => {
    const field = example("sql").getByRole("textbox", { name: "Query" });
    await field.focus();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Tab");
    await expect(field).toHaveValue("  SELECT name, address\n  FROM hosts\n  WHERE role = 'web';");
  },
  "it grows with its lines up to the most rows, then scrolls": async ({ page, example, expect }) => {
    const body = example("grow");
    const field = body.getByRole("textbox", { name: "Environment" });
    await expect(field).toHaveAttribute("rows", "3");
    await field.click();
    await page.keyboard.press("ControlOrMeta+End");
    for (let i = 0; i < 4; i++) await page.keyboard.press("Enter");
    await expect(field).toHaveAttribute("rows", "5");
    await expect.poll(() => field.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // The colour layer and the numbers follow the scroll of the text.
    const top = await field.evaluate((el) => el.scrollTop);
    expect(await body.locator(".t-code-field-colour").evaluate((el) => el.scrollTop)).toBe(top);
    await expect(body.locator(".t-code-field-numbers")).toContainText("7");
  },
  "the value is in the form, and the controlled value follows": async ({ page, example, expect }) => {
    await expect(example("sql").locator("textarea[name='query']")).toHaveValue(/FROM hosts/);
    const body = example("controlled");
    await body.getByRole("textbox", { name: "Query" }).click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type(" --");
    await expect(body).toContainText("54 characters");
  },
  "read only and disabled": async ({ page, example, expect }) => {
    const readOnly = example("read-only").getByRole("textbox", { name: "Environment" });
    await readOnly.focus();
    await page.keyboard.press("Tab");
    await expect(readOnly).not.toBeFocused();
    await expect(example("disabled").getByRole("textbox", { name: "Query" })).toBeDisabled();
    await expect(example("invalid").getByRole("textbox", { name: "Query" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
});
