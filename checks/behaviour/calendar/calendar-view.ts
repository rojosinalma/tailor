import { behaviour } from "../../src/behaviour";

const day = (name: string) => ({ name: new RegExp(`^${name}, `) });

export default behaviour("calendar-view", {
  "the period buttons change the month": async ({ example, expect }) => {
    const body = example("month");
    await expect(body.getByRole("grid", { name: "November 2026" })).toBeVisible();
    await body.getByRole("button", { name: "Next" }).click();
    await expect(body.getByRole("grid", { name: "December 2026" })).toBeVisible();
    await body.getByRole("button", { name: "Previous" }).click();
    await body.getByRole("button", { name: "Previous" }).click();
    await expect(body.getByRole("grid", { name: "October 2026" })).toBeVisible();
    await body.getByRole("button", { name: "Today" }).click();
    await expect(body.getByRole("grid")).not.toHaveAccessibleName("October 2026");
  },
  "the view switch shows the week and the agenda": async ({ example, expect }) => {
    const body = example("month");
    await body.getByRole("radio", { name: "Week" }).click();
    await expect(body.getByText("Nov 9 – 15, 2026")).toBeVisible();
    const hours = body.getByRole("region", { name: "Hours" });
    await expect(hours).toBeVisible();
    // The week opens on the working hours.
    expect(await hours.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await expect(
      body.getByRole("button", { name: "Deploy window, Nov 15, 2:30 PM to 4:00 PM" }),
    ).toBeVisible();
    await body.getByRole("button", { name: "Next" }).click();
    await expect(body.getByText("Nov 16 – 22, 2026")).toBeVisible();
    await body.getByRole("radio", { name: "Agenda" }).click();
    await expect(body.getByRole("heading", { name: "Monday, November 16" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Standup, Nov 16, 9:00 AM to 9:30 AM" })).toBeVisible();
  },
  "arrow keys move between days and past the month edge": async ({ page, example, expect }) => {
    const body = example("month");
    await body.getByRole("button", day("Sunday, November 15, 2026")).focus();
    await page.keyboard.press("ArrowRight");
    await expect(body.getByRole("button", day("Monday, November 16, 2026"))).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(body.getByRole("button", day("Monday, November 23, 2026"))).toBeFocused();
    await page.keyboard.press("PageDown");
    await expect(body.getByRole("grid", { name: "December 2026" })).toBeVisible();
    await expect(body.getByRole("button", day("Wednesday, December 23, 2026"))).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(body.getByRole("button", day("Wednesday, December 16, 2026"))).toBeFocused();
  },
  "Tab goes from the day to its events, then out of the grid": async ({ page, example, expect }) => {
    const body = example("month");
    await body.getByRole("button", day("Sunday, November 15, 2026")).focus();
    await page.keyboard.press("Tab");
    await expect(
      body.getByRole("button", { name: "Backup check on nas, Nov 15, 9:00 AM to 10:00 AM" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(body.getByRole("button", { name: /^\+3 more/ })).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await body.getByRole("grid").evaluate((grid) => grid.contains(document.activeElement))).toBe(
      false,
    );
  },
  "Enter opens the day in a popover; Escape closes it": async ({ page, example, expect }) => {
    const body = example("month");
    const fifteen = body.getByRole("button", day("Sunday, November 15, 2026"));
    await fifteen.focus();
    await page.keyboard.press("Enter");
    const popup = page.getByRole("dialog", { name: "Sunday, November 15" });
    await expect(popup).toBeVisible();
    await expect(popup.getByRole("button")).toHaveCount(6);
    await expect(popup.getByText("Rotate the certificates of example.com")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(fifteen).toBeFocused();
  },
  "+N more lists the whole day": async ({ page, example, expect }) => {
    await example("month")
      .getByRole("button", { name: /^\+3 more/ })
      .click();
    const popup = page.getByRole("dialog", { name: "Sunday, November 15" });
    await expect(popup.getByText("Deploy window")).toBeVisible();
    await expect(popup.getByText("2:30 PM – 4:00 PM")).toBeVisible();
  },
  "events and free days report what was picked": async ({ page, example, expect }) => {
    const body = example("actions");
    await body.getByRole("button", day("Friday, November 20, 2026")).focus();
    await page.keyboard.press("Enter");
    await expect(body.getByText("Free time: 2026-11-20 to 2026-11-21")).toBeVisible();
    await body.getByRole("button", { name: /^Standup, / }).click();
    await expect(body.getByText("Event: Standup")).toBeVisible();
  },
  "an event with an address is a link": async ({ example, expect }) => {
    await expect(example("month").getByRole("link", { name: /^Read the runbook, / })).toHaveAttribute(
      "href",
      "#runbook",
    );
  },
  "the narrow month shows dots and the picked day under the grid": async ({ example, expect }) => {
    const body = example("narrow-month");
    await expect(body.getByRole("heading", { name: "Sunday, November 15" })).toBeVisible();
    await expect(body.getByRole("button", { name: /^Deploy window, / })).toBeVisible();
    await expect(body.getByRole("button", { name: /^\+3 more/ })).toBeHidden();
    await body.getByRole("button", day("Monday, November 16, 2026")).click();
    await expect(body.getByRole("heading", { name: "Monday, November 16" })).toBeVisible();
    await expect(body.getByRole("button", { name: /^Standup, / })).toBeVisible();
    await expect(body.getByRole("button", { name: /^Deploy window, / })).toBeHidden();
  },
  "the narrow week shows one day, picked with the day buttons": async ({ example, expect }) => {
    const body = example("narrow-week");
    await expect(body.getByRole("button", { name: /^Deploy window, / })).toBeVisible();
    await expect(body.getByRole("button", { name: /^Change freeze, / })).toBeVisible();
    await body.getByRole("button", { name: "Tue 10" }).click();
    await expect(body.getByRole("button", { name: "Tue 10" })).toHaveAttribute("aria-pressed", "true");
    await expect(body.getByRole("button", { name: /^Early build, / })).toBeVisible();
    await expect(body.getByRole("button", { name: /^Deploy window, / })).toBeHidden();
    await expect(body.getByRole("button", { name: /^Change freeze, / })).toBeHidden();
  },
});
