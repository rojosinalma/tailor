import { behaviour } from "../../src/behaviour";

export default behaviour("switch", {
  "a click on the label turns it on and the form sends it": async ({ example, expect }) => {
    const body = example("default");
    const toggle = body.getByRole("switch", { name: "Alerts" });
    await expect(toggle).not.toBeChecked();
    await body.getByText("Alerts").click();
    await expect(toggle).toBeChecked();
    await expect(body.locator('input[name="alerts"]')).toBeChecked();
    await expect(body.locator('input[name="alerts"]')).toHaveValue("on");
  },
  "Space toggles the focused switch": async ({ page, example, expect }) => {
    const toggle = example("default").getByRole("switch", { name: "Alerts" });
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toBeChecked();
    await page.keyboard.press("Space");
    await expect(toggle).not.toBeChecked();
  },
  "the description describes the switch": async ({ example, expect }) => {
    await expect(
      example("description").getByRole("switch", { name: "Maintenance mode" }),
    ).toHaveAccessibleDescription("Visitors see a notice while web-1 is down.");
  },
  "a disabled switch does not change": async ({ example, expect }) => {
    const body = example("states");
    const toggle = body.getByRole("switch", { name: "Disabled", exact: true });
    await expect(toggle).toBeDisabled();
    await body.getByText("Disabled", { exact: true }).click({ force: true });
    await expect(toggle).not.toBeChecked();
  },
});
