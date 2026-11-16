import { behaviour } from "../../src/behaviour";

export default behaviour("rating", {
  "a click on a star rates": async ({ example, expect }) => {
    const group = example("default").getByRole("radiogroup", { name: "Support quality" });
    await group.getByRole("radio", { name: "4 of 5" }).click({ force: true });
    await expect(group.getByRole("radio", { name: "4 of 5" })).toBeChecked();
    await expect(group.locator(".t-rating-star").nth(2)).toHaveCSS("--t-rating-on", "1");
  },
  "the arrow keys change the rating": async ({ page, example, expect }) => {
    const group = example("value").getByRole("radiogroup", { name: "Speed", exact: true });
    await group.getByRole("radio", { name: "4 of 5" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(group.getByRole("radio", { name: "3 of 5" })).toBeChecked();
  },
  "read-only is an image with the label and the value": async ({ example, expect }) => {
    await expect(example("readonly").getByRole("img", { name: "Average rating: 4 of 5" })).toBeVisible();
  },
  "a disabled rating takes no pick": async ({ example, expect }) => {
    await expect(
      example("disabled")
        .getByRole("radiogroup", { name: "Locked rating" })
        .getByRole("radio", { name: "1 of 5" }),
    ).toBeDisabled();
  },
  "inside a Field: the label names the group, help and error describe it": async ({ example, expect }) => {
    const body = example("field");
    const group = body.getByRole("radiogroup", { name: "Support quality" });
    await expect(group).toHaveAccessibleDescription(
      "How well the issue was solved. Tell us why in a comment.",
    );
    await expect(group).toHaveAttribute("aria-invalid", "true");
  },
});
