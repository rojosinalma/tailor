import { behaviour } from "../../src/behaviour";

export default behaviour("date", {
  "shows the placeholder and opens on the month of today": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Start date" });
    await expect(trigger).toContainText("Pick a start date");
    await trigger.click();
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.locator(".t-calendar-day[data-today]")).toBeFocused();
  },
  "a click on a day sets the value and closes": async ({ page, example, expect }) => {
    const body = example("value");
    const trigger = body.getByRole("button", { name: "Due date" });
    await expect(trigger).toContainText("Nov 15, 2026");
    await trigger.click();
    await expect(page.getByRole("grid", { name: "November 2026" })).toBeVisible();
    await expect(page.locator('[data-iso="2026-11-15"]')).toBeFocused();
    await page.locator('[data-iso="2026-11-20"]').click();
    await expect(page.getByRole("grid")).toBeHidden();
    await expect(trigger).toContainText("Nov 20, 2026");
    await expect(body.locator('[name="due"]')).toHaveValue("2026-11-20");
    await expect(trigger).toBeFocused();
  },
  "the arrow keys move by day and by week, Enter picks": async ({ page, example, expect }) => {
    const body = example("value");
    await body.getByRole("button", { name: "Due date" }).click();
    await expect(page.locator('[data-iso="2026-11-15"]')).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[data-iso="2026-11-16"]')).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator('[data-iso="2026-11-23"]')).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(body.locator('[name="due"]')).toHaveValue("2026-11-22");
  },
  "moving past the month edge shows the next month": async ({ page, example, expect }) => {
    await example("value").getByRole("button", { name: "Due date" }).click();
    await page.keyboard.press("PageDown");
    await expect(page.getByRole("grid", { name: "December 2026" })).toBeVisible();
    await expect(page.locator('[data-iso="2026-12-15"]')).toBeFocused();
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("grid", { name: "January 2027" })).toBeVisible();
    await expect(page.locator('[data-iso="2027-01-05"]')).toBeFocused();
  },
  "the Previous and Next buttons change the month": async ({ page, example, expect }) => {
    await example("value").getByRole("button", { name: "Due date" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("grid", { name: "December 2026" })).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByRole("grid", { name: "October 2026" })).toBeVisible();
  },
  "Escape closes and keeps the value": async ({ page, example, expect }) => {
    const body = example("value");
    const trigger = body.getByRole("button", { name: "Due date" });
    await trigger.click();
    await expect(page.getByRole("grid")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("grid")).toBeHidden();
    await expect(body.locator('[name="due"]')).toHaveValue("2026-11-15");
    await expect(trigger).toBeFocused();
  },
  "days outside min and max cannot be picked": async ({ page, example, expect }) => {
    const trigger = example("range").getByRole("button", { name: "Maintenance day" });
    await trigger.click();
    await expect(page.locator('[data-iso="2026-11-09"]')).toBeDisabled();
    await expect(page.locator('[data-iso="2026-11-21"]')).toBeDisabled();
    await expect(page.locator('[data-iso="2026-11-10"]')).toBeEnabled();
    await page.locator('[data-iso="2026-11-10"]').click();
    await expect(trigger).toContainText("Nov 10, 2026");
  },
  "a click outside closes the calendar": async ({ page, example, expect }) => {
    await example("value").getByRole("button", { name: "Due date" }).click();
    await expect(page.getByRole("grid")).toBeVisible();
    await page.mouse.click(1000, 700);
    await expect(page.getByRole("grid")).toBeHidden();
  },
  "a disabled picker does not open": async ({ example, expect }) => {
    const trigger = example("disabled").getByRole("button", { name: "Locked date" });
    await expect(trigger).toBeDisabled();
  },
  "inside a Field: the label names and focuses it, help and error describe it": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("field");
    const trigger = body.getByRole("button", { name: "Due date" });
    await expect(trigger).toHaveAccessibleName("Due date Nov 2, 2026");
    await expect(trigger).toHaveAccessibleDescription("The day the work is due. The date is in the past.");
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await body.locator(".t-field-label").click();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole("grid")).toBeHidden();
    await expect(body.locator('[name="due-field"]')).toHaveValue("2026-11-02");
  },
});
