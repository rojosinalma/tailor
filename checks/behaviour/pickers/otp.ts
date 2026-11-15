import { behaviour } from "../../src/behaviour";

export default behaviour("otp", {
  "typing fills the boxes and moves on": async ({ page, example, expect }) => {
    const body = example("default");
    const group = body.getByRole("group", { name: "Verification code" });
    await expect(group.getByRole("textbox")).toHaveCount(6);
    await body.getByRole("textbox", { name: "Verification code" }).click();
    await page.keyboard.type("12a3");
    await expect(body.locator('[name="code"]')).toHaveValue("123");
    await expect(body.getByRole("textbox", { name: "Character 4 of 6" })).toBeFocused();
    await page.keyboard.type("456");
    await expect(body.locator('[name="code"]')).toHaveValue("123456");
    await expect(group).toHaveAttribute("data-complete", "");
  },
  "Backspace clears and moves back, arrows move": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("textbox", { name: "Verification code" }).click();
    await page.keyboard.type("123");
    await page.keyboard.press("Backspace");
    await expect(body.locator('[name="code"]')).toHaveValue("12");
    await expect(body.getByRole("textbox", { name: "Character 3 of 6" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(body.getByRole("textbox", { name: "Character 2 of 6" })).toBeFocused();
    await page.keyboard.type("9");
    await expect(body.locator('[name="code"]')).toHaveValue("19");
    await page.keyboard.press("Home");
    await expect(body.getByRole("textbox", { name: "Verification code" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(body.getByRole("textbox", { name: "Character 3 of 6" })).toBeFocused();
  },
  "a paste fills every box": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("textbox", { name: "Verification code" }).click();
    await page.evaluate(() => navigator.clipboard.writeText("482 913"));
    await page.keyboard.press("ControlOrMeta+V");
    await expect(body.locator('[name="code"]')).toHaveValue("482913");
    await expect(body.getByRole("textbox", { name: "Character 6 of 6" })).toBeFocused();
  },
  "a click past the code lands on the first empty box": async ({ example, expect }) => {
    const body = example("narrow");
    await body.getByRole("textbox", { name: "Character 5 of 6" }).click();
    await expect(body.getByRole("textbox", { name: "Character 3 of 6" })).toBeFocused();
  },
  "letters when not numeric": async ({ page, example, expect }) => {
    const body = example("letters");
    await body.getByRole("textbox", { name: "Pairing code" }).click();
    await page.keyboard.type("ab-12");
    await expect(body.locator('[name="pair"]')).toHaveValue("ab12");
  },
  "the value shows in the boxes": async ({ example, expect }) => {
    const body = example("value");
    await expect(body.getByRole("textbox", { name: "Medium code" })).toHaveValue("4");
    await expect(body.getByRole("textbox", { name: "Character 6 of 6" }).nth(1)).toHaveValue("3");
  },
  "a disabled code takes no input": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByRole("textbox", { name: "Locked code" })).toBeDisabled();
    await expect(body.getByRole("textbox", { name: "Character 4 of 4" })).toBeDisabled();
  },
  "on a phone the boxes fit and ask for digits": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const first = example("default").getByRole("textbox", { name: "Verification code" });
    await expect(first).toHaveAttribute("inputmode", "numeric");
    await expect(first).toHaveAttribute("autocomplete", "one-time-code");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
});
