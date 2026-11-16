import { behaviour } from "../../src/behaviour";

export default behaviour("swatch-picker", {
  "a click picks a swatch": async ({ example, expect }) => {
    const body = example("default");
    const group = body.getByRole("radiogroup", { name: "Tag colour" });
    await expect(group.getByRole("radio", { name: "Green" })).toBeChecked();
    await group.getByRole("radio", { name: "Blue" }).click({ force: true });
    await expect(group.getByRole("radio", { name: "Blue" })).toBeChecked();
    await expect(
      body.locator('input[name="tag"]:checked, input[name="tag"][type="hidden"]').first(),
    ).toHaveValue("blue");
  },
  "the arrow keys move the pick": async ({ page, example, expect }) => {
    const group = example("default").getByRole("radiogroup", { name: "Tag colour" });
    await group.getByRole("radio", { name: "Green" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Cyan" })).toBeFocused();
    await expect(group.getByRole("radio", { name: "Cyan" })).toBeChecked();
  },
  "a disabled picker takes no pick": async ({ example, expect }) => {
    await expect(
      example("disabled")
        .getByRole("radiogroup", { name: "Locked colour" })
        .getByRole("radio", { name: "Red" }),
    ).toBeDisabled();
  },
  "inside a Field: the label names the group, help and error describe it": async ({ example, expect }) => {
    const body = example("field");
    const group = body.getByRole("radiogroup", { name: "Tag colour" });
    await expect(group).toHaveAccessibleDescription(
      "The colour of the tag in lists. Pick another colour: red is taken.",
    );
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAttribute("aria-required", "true");
  },
});
