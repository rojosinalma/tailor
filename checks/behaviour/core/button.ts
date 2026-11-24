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
  "HTML kit: Tailor.busy puts a spinner in place of the icon, ignores clicks, and puts the icon back":
    async ({ kit, example, expect }) => {
      if (kit !== "html") return;
      const button = example("icons").getByRole("button", { name: "Add host" });
      await button.evaluate((el) => {
        el.addEventListener("click", () => el.setAttribute("data-clicked", ""));
        (window as unknown as { Tailor: { busy(b: Element, on: boolean): void } }).Tailor.busy(el, true);
      });
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button.locator(".t-btn-spinner")).toHaveCount(1);
      await expect(button.locator("svg")).toHaveCount(0);
      await button.click({ force: true });
      await expect(button).not.toHaveAttribute("data-clicked");
      await button.evaluate((el) =>
        (window as unknown as { Tailor: { busy(b: Element, on: boolean): void } }).Tailor.busy(el, false),
      );
      await expect(button).not.toHaveAttribute("aria-busy");
      await expect(button.locator(".t-btn-spinner")).toHaveCount(0);
      await expect(button.locator("svg")).toHaveCount(1);
      await button.click();
      await expect(button).toHaveAttribute("data-clicked", "");
    },
  "a button link is a link": async ({ example, expect }) => {
    const link = example("links").getByRole("link", { name: "New host" });
    await expect(link).toHaveAttribute("href", "#new-host");
    await expect(link).toHaveClass("t-btn");
  },
});
