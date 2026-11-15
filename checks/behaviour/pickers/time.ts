import { behaviour } from "../../src/behaviour";

export default behaviour("time", {
  "shows the placeholder, opens on the hours, Escape closes": async ({ page, example, expect }) => {
    const body = example("default");
    const trigger = body.getByRole("button", { name: "Backup time" });
    await expect(trigger).toContainText("Pick a backup time");
    await trigger.click();
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeFocused();
    await expect(page.getByRole("listbox", { name: "Minutes" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(body.locator('[name="backup"]')).toHaveValue("");
  },
  "a click on an hour and a minute sets the value": async ({ page, example, expect }) => {
    const body = example("value");
    const trigger = body.getByRole("button", { name: "Window start" });
    await expect(trigger).toHaveAccessibleName("Window start: 14:30");
    await trigger.click();
    const hours = page.getByRole("listbox", { name: "Hours" });
    await expect(hours.getByRole("option", { name: "14" })).toHaveAttribute("aria-selected", "true");
    await hours.getByRole("option", { name: "16" }).click();
    await page.getByRole("listbox", { name: "Minutes" }).getByRole("option", { name: "45" }).click();
    await expect(body.locator('[name="window"]')).toHaveValue("16:45");
    await expect(trigger).toContainText("16:45");
    await page.keyboard.press("Enter");
    await expect(hours).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "arrows move, digits jump, Enter confirms and closes": async ({ page, example, expect }) => {
    const body = example("value");
    const trigger = body.getByRole("button", { name: "Window start" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(body.locator('[name="window"]')).toHaveValue("15:30");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("listbox", { name: "Minutes" })).toBeFocused();
    await page.keyboard.type("45");
    await expect(body.locator('[name="window"]')).toHaveValue("15:45");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.type("9");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeHidden();
    await expect(body.locator('[name="window"]')).toHaveValue("09:45");
    await expect(trigger).toContainText("09:45");
    await expect(trigger).toBeFocused();
  },
  "Enter picks the shown time when no value is set": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Backup time" }).click();
    await page.keyboard.press("Enter");
    await expect(body.locator('[name="backup"]')).toHaveValue("12:00");
  },
  "a 12-hour clock has an AM/PM column": async ({ page, example, expect }) => {
    const body = example("twelve");
    const trigger = body.getByRole("button", { name: "Alarm" });
    await expect(trigger).toContainText("7:15 AM");
    await trigger.click();
    await page.getByRole("listbox", { name: "AM/PM" }).getByRole("option", { name: "PM" }).click();
    await expect(body.locator('[name="alarm"]')).toHaveValue("19:15");
    await expect(trigger).toContainText("7:15 PM");
  },
  "a seconds column when asked": async ({ page, example, expect }) => {
    const body = example("seconds");
    await body.getByRole("button", { name: "Offset" }).click();
    await page.getByRole("listbox", { name: "Seconds" }).getByRole("option", { name: "45" }).click();
    await expect(body.locator('[name="offset"]')).toHaveValue("00:01:45");
  },
  "times outside min and max cannot be picked": async ({ page, example, expect }) => {
    const body = example("limits");
    await body.getByRole("button", { name: "Maintenance slot" }).click();
    const hours = page.getByRole("listbox", { name: "Hours" });
    await expect(hours.getByRole("option", { name: "08" })).toHaveAttribute("aria-disabled", "true");
    await hours.getByRole("option", { name: "08" }).click({ force: true });
    await expect(body.locator('[name="slot"]')).toHaveValue("10:00");
    const minutes = page.getByRole("listbox", { name: "Minutes" });
    await expect(minutes.getByRole("option")).toHaveCount(4);
    await page.keyboard.press("End");
    await expect(body.locator('[name="slot"]')).toHaveValue("17:00");
  },
  "a click outside closes the columns": async ({ page, example, expect }) => {
    await example("value").getByRole("button", { name: "Window start" }).click();
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeVisible();
    await page.mouse.click(1000, 700);
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeHidden();
  },
  "a disabled picker does not open": async ({ example, expect }) => {
    await expect(example("disabled").getByRole("button", { name: "Locked time" })).toBeDisabled();
  },
  "on a phone the columns open as a bottom sheet": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("value").getByRole("button", { name: "Window start" }).click();
    const sheet = page.getByRole("dialog");
    await expect(page.getByRole("listbox", { name: "Hours" })).toBeFocused();
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return [box?.width, Math.round((box?.y ?? 0) + (box?.height ?? 0))];
      })
      .toEqual([390, 800]);
  },
  "inside a Field: the label names and focuses it, help and error describe it": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("field");
    const trigger = body.getByRole("button", { name: "Backup time" });
    await expect(trigger).toHaveAccessibleName("Backup time 03:30");
    await expect(trigger).toHaveAccessibleDescription(
      "The time of the nightly backup. Backups cannot run at that time.",
    );
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await body.locator(".t-field-label").click();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(body.locator('[name="backup-field"]')).toHaveValue("03:30");
  },
});
