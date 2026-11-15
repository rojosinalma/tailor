import { behaviour } from "../../src/behaviour";

export default behaviour("button", {
  "a loading button is busy, ignores clicks and keeps the focus": async ({ page, example, expect }) => {
    const button = example("loading").getByRole("button", { name: "Saving" });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).not.toHaveAttribute("disabled");
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(example("loading").getByRole("button", { name: "Add host" })).toBeFocused();
  },
  "a button link is a link": async ({ example, expect }) => {
    const link = example("links").getByRole("link", { name: "New host" });
    await expect(link).toHaveAttribute("href", "#new-host");
    await expect(link).toHaveClass("t-btn");
  },
});
