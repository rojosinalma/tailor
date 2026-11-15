import { behaviour } from "../../src/behaviour";

export default behaviour("carousel", {
  "the buttons move one view and stop at the ends": async ({ example, expect }) => {
    const carousel = example("cards").getByRole("region", { name: "Hosts" });
    const track = carousel.locator(".t-carousel-track");
    const prev = carousel.getByRole("button", { name: "Previous" });
    const next = carousel.getByRole("button", { name: "Next" });
    await expect(prev).toBeDisabled();
    const width = await track.evaluate((el) => el.clientWidth);
    await next.click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(width * 0.9);
    await expect(prev).toBeEnabled();
    await next.click();
    await expect(next).toBeDisabled();
    await expect
      .poll(() => track.evaluate((el) => el.scrollWidth - el.clientWidth - el.scrollLeft))
      .toBeLessThan(2);
    await prev.click();
    await expect(next).toBeEnabled();
  },
  "the dots follow the scroll and move to their page": async ({ example, expect }) => {
    const carousel = example("cards").getByRole("region", { name: "Hosts" });
    const dots = carousel.getByRole("button", { name: /^Page \d+$/ });
    await expect(dots).toHaveCount(3);
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
    await carousel.getByRole("button", { name: "Next" }).click();
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(0)).not.toHaveAttribute("aria-current", "true");
    await carousel.getByRole("button", { name: "Page 3" }).click();
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    await carousel.getByRole("button", { name: "Page 1" }).click();
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
    await expect.poll(() => carousel.locator(".t-carousel-track").evaluate((el) => el.scrollLeft)).toBe(0);
  },
  "arrow keys move when the focus is inside": async ({ page, example, expect }) => {
    const carousel = example("cards").getByRole("region", { name: "Hosts" });
    const track = carousel.locator(".t-carousel-track");
    await track.focus();
    await page.keyboard.press("ArrowRight");
    await expect(carousel.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(carousel.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "true");
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBe(0);
  },
  "slides are named groups and the track takes the focus": async ({ example, expect }) => {
    const carousel = example("cards").getByRole("region", { name: "Hosts" });
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    await expect(carousel.getByRole("group", { name: "1 of 7" })).toHaveAttribute(
      "aria-roledescription",
      "slide",
    );
    await expect(carousel.locator(".t-carousel-track")).toHaveAttribute("tabindex", "0");
  },
  "with loop, next goes from the end to the start": async ({ example, expect }) => {
    const carousel = example("photos").getByRole("region", { name: "Photos" });
    const track = carousel.locator(".t-carousel-track");
    const prev = carousel.getByRole("button", { name: "Previous" });
    await expect(prev).toBeEnabled();
    await prev.click();
    await expect
      .poll(() => track.evaluate((el) => el.scrollWidth - el.clientWidth - el.scrollLeft))
      .toBeLessThan(2);
    await carousel.getByRole("button", { name: "Next" }).click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBe(0);
  },
  "a narrow container shows one slide per view": async ({ example, expect }) => {
    const carousel = example("narrow").getByRole("region", { name: "Narrow hosts" });
    await expect(carousel.getByRole("button", { name: /^Page \d+$/ })).toHaveCount(4);
  },
  "controls stay hidden when everything fits": async ({ example, expect }) => {
    const carousel = example("fits").getByRole("region", { name: "Two hosts" });
    await expect(carousel.getByRole("button", { name: "Next" })).toBeHidden();
  },
  "on a phone it shows one slide per view": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const carousel = example("cards").getByRole("region", { name: "Hosts" });
    await expect(carousel.getByRole("button", { name: /^Page \d+$/ })).toHaveCount(7);
  },
});
