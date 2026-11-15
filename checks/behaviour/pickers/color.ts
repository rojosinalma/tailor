import { behaviour } from "../../src/behaviour";

export default behaviour("color", {
  "shows the colour and opens on the area": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Accent colour" });
    await expect(trigger).toHaveAccessibleName("Accent colour: #3366cc");
    await trigger.click();
    const area = page.getByRole("slider", { name: "Saturation and brightness" });
    await expect(area).toBeFocused();
    await expect(area).toHaveAttribute("aria-valuetext", "Saturation 75%, Brightness 80%");
    await expect(page.getByRole("slider", { name: "Hue" })).toHaveAttribute("aria-valuenow", "220");
    await expect(page.getByRole("textbox", { name: "Hex" })).toHaveValue("#3366cc");
  },
  "the arrow keys move the thumbs": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Accent colour" }).click();
    await page.keyboard.press("Shift+ArrowUp");
    await page.keyboard.press("Shift+ArrowUp");
    await expect(page.getByRole("slider", { name: "Saturation and brightness" })).toHaveAttribute(
      "aria-valuetext",
      "Saturation 75%, Brightness 100%",
    );
    await expect(body.locator('[name="accent"]')).toHaveValue("#4080ff");
    await page.keyboard.press("Tab");
    const hue = page.getByRole("slider", { name: "Hue" });
    await expect(hue).toBeFocused();
    await page.keyboard.press("Home");
    await expect(hue).toHaveAttribute("aria-valuenow", "0");
    await expect(body.locator('[name="accent"]')).toHaveValue("#ff4040");
    await page.keyboard.press("Enter");
    await expect(hue).toBeHidden();
    await expect(body.getByRole("button", { name: "Accent colour" })).toContainText("#ff4040");
  },
  "a click in the area picks the colour there": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Accent colour" }).click();
    const area = page.locator(".t-color-area");
    const box = await area.boundingBox();
    await area.click({ position: { x: 0, y: (box?.height ?? 0) / 2 } });
    const thumb = page.getByRole("slider", { name: "Saturation and brightness" });
    await expect(thumb).toHaveAttribute("aria-valuetext", /^Saturation 0%, Brightness 50%/);
    await expect(body.locator('[name="accent"]')).toHaveValue(/^#(..)\1\1$/);
    await expect(thumb).toBeFocused();
  },
  "the hex field sets the colour, Enter closes": async ({ page, example, expect }) => {
    const body = example("default");
    const trigger = body.getByRole("button", { name: "Accent colour" });
    await trigger.click();
    await page.getByRole("textbox", { name: "Hex" }).fill("#E63946");
    await expect(body.locator('[name="accent"]')).toHaveValue("#e63946");
    await page.keyboard.press("Enter");
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("#e63946");
  },
  "a swatch sets the colour": async ({ page, example, expect }) => {
    const body = example("swatches");
    await body.getByRole("button", { name: "Label colour" }).click();
    const swatches = page.getByRole("group", { name: "Swatches" });
    await expect(swatches.getByRole("button", { name: "#2a9d8f" })).toHaveAttribute("aria-pressed", "true");
    await swatches.getByRole("button", { name: "#e63946" }).click();
    await expect(body.locator('[name="label"]')).toHaveValue("#e63946");
    await expect(swatches.getByRole("button", { name: "#e63946" })).toHaveAttribute("aria-pressed", "true");
  },
  "None empties the value": async ({ page, example, expect }) => {
    const body = example("none");
    const trigger = body.getByRole("button", { name: "Highlight" });
    await expect(trigger).toContainText("None");
    await trigger.click();
    await page.getByRole("textbox", { name: "Hex" }).fill("#e9c46a");
    await expect(body.locator('[name="highlight"]')).toHaveValue("#e9c46a");
    await page.getByRole("button", { name: "None" }).click();
    await expect(body.locator('[name="highlight"]')).toHaveValue("");
    await expect(trigger).toContainText("None");
  },
  "Escape closes and returns the focus": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Accent colour" });
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("slider", { name: "Hue" })).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "a disabled picker does not open": async ({ example, expect }) => {
    await expect(example("disabled").getByRole("button", { name: "Locked colour" })).toBeDisabled();
  },
  "on a phone it opens as a bottom sheet": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("swatches").getByRole("button", { name: "Label colour" }).click();
    const sheet = page.getByRole("dialog");
    await expect(page.getByRole("slider", { name: "Saturation and brightness" })).toBeFocused();
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return [box?.width, Math.round((box?.y ?? 0) + (box?.height ?? 0))];
      })
      .toEqual([390, 800]);
  },
});
