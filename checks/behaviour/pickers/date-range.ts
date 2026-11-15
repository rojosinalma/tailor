import { behaviour } from "../../src/behaviour";

const day = (iso: string) => `[data-iso="${iso}"]`;

export default behaviour("date-range", {
  "shows the placeholder and opens two months": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Report period" });
    await expect(trigger).toContainText("Pick a report period");
    await trigger.click();
    await expect(page.getByRole("grid")).toHaveCount(2);
    await expect(page.locator(".t-calendar-day[data-today]")).toBeFocused();
  },
  "the first click sets the start, the second the end": async ({ page, example, expect }) => {
    const body = example("value");
    const trigger = body.getByRole("button", { name: "Maintenance window" });
    await expect(trigger).toContainText(/Nov 10\s–\s20, 2026/);
    await trigger.click();
    await expect(page.locator(day("2026-11-10"))).toBeFocused();
    await expect(page.locator(day("2026-11-15"))).toHaveAttribute("data-in-range", "");
    await page.locator(day("2026-11-03")).click();
    await expect(page.locator(day("2026-11-03"))).toHaveAttribute("data-range-start", "");
    await page.locator(day("2026-11-06")).hover();
    await expect(page.locator(day("2026-11-05"))).toHaveAttribute("data-in-range", "");
    await expect(page.locator(day("2026-11-06"))).toHaveAttribute("data-range-end", "");
    await expect(page.locator(day("2026-11-15"))).not.toHaveAttribute("data-in-range", "");
    await page.locator(day("2026-11-06")).click();
    await expect(page.getByRole("grid").first()).toBeHidden();
    await expect(body.locator('[name="start"]')).toHaveValue("2026-11-03");
    await expect(body.locator('[name="end"]')).toHaveValue("2026-11-06");
    await expect(trigger).toBeFocused();
  },
  "an end before the start swaps the two": async ({ page, example, expect }) => {
    const body = example("value");
    await body.getByRole("button", { name: "Maintenance window" }).click();
    await page.locator(day("2026-12-04")).click();
    await page.locator(day("2026-11-25")).click();
    await expect(body.locator('[name="start"]')).toHaveValue("2026-11-25");
    await expect(body.locator('[name="end"]')).toHaveValue("2026-12-04");
  },
  "arrows show the range in progress, Enter picks": async ({ page, example, expect }) => {
    const body = example("value");
    await body.getByRole("button", { name: "Maintenance window" }).click();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(day("2026-11-17"))).toBeFocused();
    await expect(page.locator(day("2026-11-13"))).toHaveAttribute("data-in-range", "");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(body.locator('[name="start"]')).toHaveValue("2026-11-10");
    await expect(body.locator('[name="end"]')).toHaveValue("2026-11-18");
  },
  "a preset picks its range at once": async ({ page, example, expect }) => {
    const body = example("presets");
    const trigger = body.getByRole("button", { name: "Log period" });
    await trigger.click();
    await page.getByRole("group", { name: "Presets" }).getByRole("button", { name: "Last 7 days" }).click();
    await expect(body.locator('[name="since"]')).toHaveValue("2026-11-09");
    await expect(body.locator('[name="until"]')).toHaveValue("2026-11-15");
    await expect(trigger).toContainText(/Nov 9\s–\s15, 2026/);
  },
  "Escape drops a range in progress": async ({ page, example, expect }) => {
    const body = example("value");
    const trigger = body.getByRole("button", { name: "Maintenance window" });
    await trigger.click();
    await page.locator(day("2026-11-03")).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("grid").first()).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(body.locator('[name="start"]')).toHaveValue("2026-11-10");
    await expect(body.locator('[name="end"]')).toHaveValue("2026-11-20");
  },
  "days outside min and max cannot be picked": async ({ page, example, expect }) => {
    await example("limits").getByRole("button", { name: "Leave" }).click();
    await expect(page.locator(day("2026-11-09"))).toBeDisabled();
    await expect(page.locator(day("2026-11-26"))).toBeDisabled();
    await expect(page.locator(day("2026-11-10"))).toBeEnabled();
  },
  "a disabled picker does not open": async ({ example, expect }) => {
    await expect(example("disabled").getByRole("button", { name: "Locked period" })).toBeDisabled();
  },
  "on a phone one month opens as a bottom sheet": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("presets").getByRole("button", { name: "Log period" }).click();
    await expect(page.getByRole("grid")).toHaveCount(1);
    const sheet = page.getByRole("dialog");
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return [box?.width, Math.round((box?.y ?? 0) + (box?.height ?? 0))];
      })
      .toEqual([390, 800]);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(390);
  },
  "inside a Field: the label names and focuses it, help and error describe it": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("field");
    const trigger = body.getByRole("button", { name: "Report period" });
    await expect(trigger).toHaveAccessibleName(/^Report period Nov 2\s–\s6, 2026$/);
    await expect(trigger).toHaveAccessibleDescription(
      "The days the report covers. The period is longer than a month.",
    );
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await body.locator(".t-field-label").click();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole("grid")).toHaveCount(0);
    await expect(body.locator('[name="report-start"]')).toHaveValue("2026-11-02");
  },
});
