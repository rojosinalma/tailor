import { behaviour } from "../../src/behaviour";

export default behaviour("hover-card", {
  "the pointer on the link opens the card, leaving closes it": async ({ page, example, expect }) => {
    const link = example("default").getByRole("link", { name: "web-1" });
    const card = page.getByText("Serves example.com and its API");
    await link.hover();
    await expect(card).toBeVisible();
    await expect(link).toHaveAttribute("data-popup-open", "");
    await page.mouse.move(1200, 780);
    await expect(card).toBeHidden();
  },
  "keyboard focus opens the card, leaving the link closes it": async ({ page, example, expect }) => {
    const link = example("default").getByRole("link", { name: "web-1" });
    const card = page.getByText("Serves example.com and its API");
    await link.focus();
    await expect(link).toBeFocused();
    await expect(card).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(card).toBeHidden();
  },
  "Escape closes the card and the focus stays on the link": async ({ page, example, expect }) => {
    const link = example("default").getByRole("link", { name: "web-1" });
    const card = page.getByText("Serves example.com and its API");
    await link.focus();
    await expect(card).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    await expect(link).toBeFocused();
  },
  "on a phone the card stays next to its link, not a bottom sheet": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const link = example("default").getByRole("link", { name: "web-1" });
    await link.focus();
    const card = page.locator(".t-hover-card-popup");
    await expect(card).toBeVisible();
    const linkBox = await link.boundingBox();
    const box = await card.boundingBox();
    expect(box?.width ?? 0).toBeLessThan(390);
    expect(Math.abs((box?.y ?? 0) - ((linkBox?.y ?? 0) + (linkBox?.height ?? 0)))).toBeLessThan(12);
  },
});
