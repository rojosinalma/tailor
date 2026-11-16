import { behaviour } from "../../src/behaviour";

export default behaviour("duration", {
  "the value shows in the largest whole unit, in words": async ({ example, expect }) => {
    const body = example("default");
    await expect(body.getByLabel("Backup interval", { exact: true })).toHaveValue("2");
    await expect(body.getByRole("combobox", { name: "Backup interval unit" })).toContainText("hours");
    await expect(body.getByLabel("Timeout", { exact: true })).toHaveValue("5");
    await expect(body.getByRole("combobox", { name: "Timeout unit" })).toContainText("minutes");
    await expect(body.getByLabel("Retry delay", { exact: true })).toHaveValue("90");
    await expect(body.getByRole("combobox", { name: "Retry delay unit" })).toContainText("seconds");
  },
  "a new number or unit sets the value in seconds": async ({ page, example, expect }) => {
    const body = example("field");
    const value = body.locator('[name="session"]');
    await expect(value).toHaveValue("5400");
    await expect(body.getByLabel("Session length", { exact: true })).toHaveValue("90");
    await body.getByRole("combobox", { name: "Session length unit" }).click();
    await page.getByRole("option", { name: "hours" }).click();
    await expect(value).toHaveValue("324000");
    const amount = body.getByLabel("Session length", { exact: true });
    await amount.fill("2");
    await amount.press("Tab");
    await expect(value).toHaveValue("7200");
  },
  "the unit list works with the keyboard": async ({ page, example, expect }) => {
    const body = example("default");
    const unit = body.getByRole("combobox", { name: "Timeout unit" });
    await unit.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(unit).toContainText("hours");
    await expect(body.locator('[name="timeout"]')).toHaveValue("18000");
  },
  "only the given units show": async ({ page, example, expect }) => {
    const body = example("units");
    await expect(body.getByLabel("Keep logs for", { exact: true })).toHaveValue("14");
    await body.getByRole("combobox", { name: "Keep logs for unit" }).click();
    await expect(page.getByRole("option")).toHaveText(["minutes", "hours", "days"]);
  },
  "a click on the field label focuses the number": async ({ example, expect }) => {
    const body = example("field");
    await body.locator(".t-field-label").click();
    await expect(body.getByLabel("Session length", { exact: true })).toBeFocused();
  },
  "a disabled duration takes no input": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByLabel("Lock time", { exact: true })).toBeDisabled();
    await expect(body.getByRole("combobox", { name: "Lock time unit" })).toBeDisabled();
  },
});
