import { behaviour } from "../../src/behaviour";

export default behaviour("markdown-editor", {
  "toolbar buttons wrap the selection and keep it": async ({ example, expect }) => {
    const body = example("empty");
    const area = body.getByRole("textbox", { name: "Comment" });
    await area.fill("make this strong");
    await area.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(10, 16));
    await body.getByRole("button", { name: "Bold" }).click();
    await expect(area).toHaveValue("make this **strong**");
    await expect(area).toBeFocused();
    expect(
      await area.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd)),
    ).toBe("strong");
    await body.getByRole("button", { name: "Bold" }).click();
    await expect(area).toHaveValue("make this strong");
    await area.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, el.value.length));
    await body.getByRole("button", { name: "Bulleted list" }).click();
    await expect(area).toHaveValue("- make this strong");
    await body.getByRole("button", { name: "Heading" }).click();
    await expect(area).toHaveValue("## - make this strong");
  },
  "Ctrl+B, Ctrl+I and Ctrl+K format the selection": async ({ page, example, expect }) => {
    const body = example("empty");
    const area = body.getByRole("textbox", { name: "Comment" });
    await area.fill("docs");
    await area.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 4));
    await page.keyboard.press("Control+i");
    await expect(area).toHaveValue("_docs_");
    await page.keyboard.press("Control+b");
    await expect(area).toHaveValue("_**docs**_");
    await area.fill("docs");
    await area.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 4));
    await page.keyboard.press("Meta+k");
    await expect(area).toHaveValue("[docs](https://)");
    await page.keyboard.type("example.com");
    await expect(area).toHaveValue("[docs](example.com)");
  },
  "Tab leaves the text area and the toolbar is one tab stop": async ({ page, example, expect }) => {
    const body = example("empty");
    await body.getByRole("tab", { name: "Write" }).focus();
    await page.keyboard.press("Tab");
    // The panel, then the toolbar's first button, then the text area.
    await page.keyboard.press("Tab");
    await expect(body.getByRole("button", { name: "Bold" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(body.getByRole("button", { name: "Italic" })).toBeFocused();
    await page.keyboard.press("Tab");
    const area = body.getByRole("textbox", { name: "Comment" });
    await expect(area).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(area).not.toBeFocused();
    await expect(area).toHaveValue("");
  },
  "the preview shows the rendered text": async ({ example, expect }) => {
    const body = example("empty");
    await body.getByRole("tab", { name: "Preview" }).click();
    await expect(body.getByText("Nothing to preview")).toBeVisible();
    await body.getByRole("tab", { name: "Write" }).click();
    await body.getByRole("textbox", { name: "Comment" }).fill("## Hello\n\n**alice** <script>x</script>");
    await body.getByRole("tab", { name: "Preview" }).click();
    await expect(body.getByRole("heading", { name: "Hello" })).toBeVisible();
    await expect(body.locator("strong")).toHaveText("alice");
    await expect(body.locator(".t-markdown script")).toHaveCount(0);
  },
  "split mode shows both side by side when wide and tabs when narrow": async ({ page, example, expect }) => {
    const wide = example("split");
    await expect(wide.getByRole("tab")).toHaveCount(0);
    const area = wide.getByRole("textbox", { name: "Description" });
    await area.fill("# Live");
    await expect(
      wide.getByRole("region", { name: "Preview" }).getByRole("heading", { name: "Live" }),
    ).toBeVisible();
    await expect(example("narrow").getByRole("tab", { name: "Preview" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(wide.getByRole("tab", { name: "Preview" })).toBeVisible();
    await expect(wide.getByRole("textbox", { name: "Description" })).toHaveValue("# Live");
  },
  "the value goes with the form under its name, also from the preview tab": async ({ example, expect }) => {
    const body = example("tabs");
    await body.getByRole("textbox", { name: "Release notes" }).fill("Short *note*");
    await body.getByRole("tab", { name: "Preview" }).click();
    const value = await body
      .locator("form")
      .evaluate((form: HTMLFormElement) => new FormData(form).get("notes"));
    expect(value).toBe("Short *note*");
  },
  "a disabled editor takes no edits": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByRole("textbox", { name: "Locked notes" })).toBeDisabled();
    await expect(body.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-disabled", "true");
  },
});
