import { behaviour } from "../../src/behaviour";

export default behaviour("detail-page", {
  "Delete asks first; Cancel keeps the service, Delete says it is gone": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toHaveAccessibleName("Delete api?");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".t-toast", { hasText: "api is deleted." })).toHaveCount(0);
    await body.getByRole("button", { name: "Delete" }).click();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".t-toast", { hasText: "api is deleted." })).toBeVisible();
  },
  "on a phone Delete sits in the menu and still asks": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("narrow");
    await expect(body.getByRole("button", { name: "Restart" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Delete" })).toBeHidden();
    await body.getByRole("button", { name: "More" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toHaveAccessibleName("Delete api?");
  },
  "the tabs show the activity": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("tab", { name: /Activity/ }).click();
    await expect(body.getByRole("list", { name: "Activity of api" })).toBeVisible();
  },
});
