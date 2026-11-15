import { behaviour } from "../../src/behaviour";

export default behaviour("segmented", {
  "a click picks an option and sets the form value": async ({ example, expect }) => {
    const body = example("default");
    const group = body.getByRole("radiogroup", { name: "View" });
    await expect(group.getByRole("radio", { name: "List" })).toBeChecked();
    await group.getByText("Grid").click();
    await expect(group.getByRole("radio", { name: "Grid" })).toBeChecked();
    await expect(group.getByRole("radio", { name: "List" })).not.toBeChecked();
    await expect(body.locator('input[name="view"]:checked')).toHaveValue("grid");
  },
  "arrow keys move the choice": async ({ page, example, expect }) => {
    const body = example("default");
    const group = body.getByRole("radiogroup", { name: "View" });
    await group.getByRole("radio", { name: "List" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Grid" })).toBeChecked();
    await expect(group.getByRole("radio", { name: "Grid" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Map" })).toBeChecked();
    await page.keyboard.press("ArrowLeft");
    await expect(group.getByRole("radio", { name: "Grid" })).toBeChecked();
    await expect(body.locator('input[name="view"]:checked')).toHaveValue("grid");
  },
  "a disabled control does not change": async ({ example, expect }) => {
    const group = example("disabled").getByRole("radiogroup", { name: "Locked view" });
    await expect(group.getByRole("radio", { name: "Map" })).toBeDisabled();
    await group.getByText("Map").click({ force: true });
    await expect(group.getByRole("radio", { name: "Grid" })).toBeChecked();
  },
});
