import { behaviour } from "../../src/behaviour";

export default behaviour("nav-drawer", {
  "the menu button opens it from the start edge with the focus on the first link": async ({
    page,
    example,
    expect,
  }) => {
    const button = example("default").getByRole("button", { name: "Menu" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    expect((await drawer.boundingBox())?.x).toBe(0);
    await expect(drawer.getByRole("link", { name: "Overview" })).toBeFocused();
    await expect(drawer.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Jobs" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Docs" })).toBeVisible();
  },
  "Escape closes it and the focus returns to the menu button": async ({ page, example, expect }) => {
    const button = example("default").getByRole("button", { name: "Menu" });
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  },
  "the keyboard opens it": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Menu" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  },
  "choosing a link closes it": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await drawer.getByRole("link", { name: "Hosts" }).click();
    await expect(drawer).toBeHidden();
  },
  "the backdrop and the close button close it": async ({ page, example, expect }) => {
    const button = example("default").getByRole("button", { name: "Menu" });
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await button.click();
    await drawer.getByRole("button", { name: "Close" }).click();
    await expect(drawer).toBeHidden();
    await button.click();
    await expect(drawer).toBeVisible();
    await page.mouse.click(1200, 400);
    await expect(drawer).toBeHidden();
  },
  "a swipe toward the start edge closes it": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await page.mouse.move(250, 600);
    await page.mouse.down();
    await page.mouse.move(150, 605, { steps: 4 });
    await page.mouse.move(60, 610, { steps: 4 });
    await page.mouse.up();
    await expect(drawer).toBeHidden();
  },
  "global actions sit under the links": async ({ page, example, expect }) => {
    await example("sections").getByRole("button", { name: "Menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer.getByRole("button", { name: "alice" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Backups" })).toHaveAttribute("aria-current", "page");
  },
});
