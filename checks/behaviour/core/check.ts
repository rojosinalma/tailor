import { behaviour } from "../../src/behaviour";

export default behaviour("check", {
  "a click on the label ticks the box and the form sends it": async ({ example, expect }) => {
    const body = example("default");
    const box = body.getByRole("checkbox", { name: "I accept the terms" });
    await expect(box).not.toBeChecked();
    await body.getByText("I accept the terms").click();
    await expect(box).toBeChecked();
    await expect(body.locator('input[name="terms"]')).toBeChecked();
    await expect(body.locator('input[name="terms"]')).toHaveValue("yes");
  },
  "Space toggles the focused box": async ({ page, example, expect }) => {
    const box = example("default").getByRole("checkbox", { name: "I accept the terms" });
    await box.focus();
    await page.keyboard.press("Space");
    await expect(box).toBeChecked();
    await page.keyboard.press("Space");
    await expect(box).not.toBeChecked();
  },
  "the description describes the box": async ({ example, expect }) => {
    const box = example("description").getByRole("checkbox", { name: "Back up every night" });
    await expect(box).toHaveAccessibleDescription(
      "Keeps seven daily copies on nas. Older copies are removed.",
    );
  },
  "a mixed box reports its state": async ({ example, expect }) => {
    await expect(example("states").getByRole("checkbox", { name: "Mixed" })).toBeChecked({
      indeterminate: true,
    });
  },
  "a disabled box does not change": async ({ example, expect }) => {
    const body = example("states");
    const box = body.getByRole("checkbox", { name: "Disabled", exact: true });
    await expect(box).toBeDisabled();
    await body.getByText("Disabled", { exact: true }).click({ force: true });
    await expect(box).not.toBeChecked();
  },
  "a group starts from its value and is named by its legend": async ({ example, expect }) => {
    const body = example("group");
    await expect(body.getByRole("group", { name: "Protocols" })).toBeVisible();
    await expect(body.getByRole("checkbox", { name: "HTTPS" })).toBeChecked();
    await expect(body.getByRole("checkbox", { name: "HTTP", exact: true })).not.toBeChecked();
    await body.getByText("SSH").click();
    await expect(body.getByRole("checkbox", { name: "SSH" })).toBeChecked();
  },
  "in a field, the field names and describes the group": async ({ example, expect }) => {
    const body = example("field");
    const group = body.getByRole("group", { name: "Notify by" });
    await expect(group).toHaveAccessibleDescription("Pick one or more. Pick at least one way.");
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(body.locator("legend")).toHaveCount(0);
    const box = body.getByRole("checkbox", { name: "Email" });
    await expect(box).not.toHaveAttribute("aria-describedby", /.+/);
    await body.getByText("Text message").click();
    await expect(body.locator('input[name="notify"][value="sms"]')).toBeChecked();
  },
});
