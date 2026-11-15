import { behaviour } from "../../src/behaviour";

export default behaviour("hotkeys-help", {
  "Shift+? opens it with every shortcut, grouped": async ({ page, example, expect }) => {
    await example("default").getByText("Last shortcut").waitFor();
    await page.keyboard.press("Shift+?");
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toHaveText(["Keyboard shortcuts", "Go to", "Hosts", "General"]);
    await expect(dialog.getByRole("region", { name: "Go to" }).locator("dt")).toHaveText([
      "Go to the dashboard",
      "Go to hosts",
      "Go to settings",
    ]);
    await expect(dialog.getByRole("region", { name: "General" }).locator("dt")).toHaveText([
      "Save the changes",
      "Show the keyboard shortcuts",
    ]);
    await expect(dialog.getByRole("searchbox", { name: "Filter shortcuts" })).toBeFocused();
  },
  "the filter narrows the list": async ({ page, example, expect }) => {
    await example("default").getByRole("button", { name: "Keyboard shortcuts" }).click();
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    const filter = dialog.getByRole("searchbox", { name: "Filter shortcuts" });
    await expect(filter).toBeFocused();
    await page.keyboard.type("settings");
    await expect(dialog.locator("dt")).toHaveText(["Go to settings"]);
    await filter.fill("zzz");
    await expect(dialog.getByText("No shortcut matches")).toBeVisible();
  },
  "Escape clears the filter, then closes and gives the focus back": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Keyboard shortcuts" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    const filter = dialog.getByRole("searchbox", { name: "Filter shortcuts" });
    await expect(filter).toBeFocused();
    await page.keyboard.type("host");
    await page.keyboard.press("Escape");
    await expect(filter).toHaveValue("");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "the page's shortcuts do not fire while it is open": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Keyboard shortcuts" }).click();
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await dialog.getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Shift+R");
    await page.keyboard.press("n");
    await expect(dialog).toBeVisible();
    await expect(body.getByText("Last shortcut: none yet")).toBeVisible();
  },
  "on a phone it takes the full screen in one column": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("button", { name: "Keyboard shortcuts" }).click();
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(dialog).toBeVisible();
    // The opening scale ends a frame later.
    await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(390);
    expect((await dialog.boundingBox())?.height).toBe(800);
    const lefts = await dialog
      .getByRole("region")
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(1);
  },
});
