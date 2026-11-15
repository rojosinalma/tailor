import { behaviour } from "../../src/behaviour";

export default behaviour("radio", {
  "a click on a label picks the option and the form sends it": async ({ example, expect }) => {
    const body = example("default");
    await expect(body.getByRole("radio", { name: "Medium" })).toBeChecked();
    await body.getByText("Large").click();
    await expect(body.getByRole("radio", { name: "Large" })).toBeChecked();
    await expect(body.getByRole("radio", { name: "Medium" })).not.toBeChecked();
    await expect(body.locator('input[name="plan"]:checked')).toHaveValue("large");
  },
  "the arrow keys move the choice, Space picks the focused option": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("radio", { name: "Medium" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(body.getByRole("radio", { name: "Large" })).toBeChecked();
    await expect(body.getByRole("radio", { name: "Large" })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(body.getByRole("radio", { name: "Small" })).toBeChecked();
    await page.keyboard.press("Space");
    await expect(body.getByRole("radio", { name: "Small" })).toBeChecked();
    await expect(body.locator('input[name="plan"]:checked')).toHaveValue("small");
  },
  "each option is described by its description": async ({ example, expect }) => {
    await expect(example("default").getByRole("radio", { name: "Small" })).toHaveAccessibleDescription(
      "1 CPU, 1 GB memory.",
    );
  },
  "a disabled option cannot be picked": async ({ example, expect }) => {
    const body = example("default");
    await body.getByText("Custom").click({ force: true });
    await expect(body.getByRole("radio", { name: "Custom" })).not.toBeChecked();
    await expect(body.getByRole("radio", { name: "Medium" })).toBeChecked();
  },
  "a disabled group cannot change": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByRole("radio", { name: "nas" })).toBeDisabled();
    await body.getByText("example.com storage").click({ force: true });
    await expect(body.getByRole("radio", { name: "nas" })).toBeChecked();
  },
  "in a field, the field names and describes the group": async ({ example, expect }) => {
    const body = example("field");
    const group = body.getByRole("radiogroup", { name: "Plan" });
    await expect(group).toHaveAccessibleDescription("You can change it later. Pick a plan.");
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(body.locator("legend")).toHaveCount(0);
    await body.getByText("Large").click();
    await expect(body.locator('input[name="plan-field"]:checked')).toHaveValue("large");
  },
});
