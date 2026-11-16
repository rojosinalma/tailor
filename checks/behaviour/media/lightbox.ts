import { behaviour } from "../../src/behaviour";

const NAME = "Trip photos";

export default behaviour("lightbox", {
  "the third thumbnail opens item 3 with its counter and caption": async ({ page, example, expect }) => {
    await example("gallery").getByRole("link", { name: "Old bridge at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: NAME });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByText("3 of 6")).toBeVisible();
    await expect(viewer.getByRole("img", { name: "Old bridge, sample photo 3" })).toBeVisible();
    await expect(viewer.getByText("Old bridge at dawn")).toBeVisible();
    await expect.poll(() => viewer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  },
  "arrow keys, Home and End move": async ({ page, example, expect }) => {
    await example("gallery").getByRole("link", { name: "Old bridge at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: NAME });
    await expect(viewer.getByText("3 of 6")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(viewer.getByText("4 of 6")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(viewer.getByText("2 of 6")).toBeVisible();
    await page.keyboard.press("End");
    await expect(viewer.getByText("6 of 6")).toBeVisible();
    await page.keyboard.press("Home");
    await expect(viewer.getByText("1 of 6")).toBeVisible();
  },
  "the buttons hide at the ends and stop there": async ({ page, example, expect }) => {
    await example("gallery").getByRole("link", { name: "Harbour at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: NAME });
    await expect(viewer.getByText("1 of 6")).toBeVisible();
    await expect(viewer.getByRole("button", { name: "Previous" })).toBeHidden();
    await page.keyboard.press("ArrowLeft");
    await expect(viewer.getByText("1 of 6")).toBeVisible();
    await viewer.getByRole("button", { name: "Next" }).click();
    await expect(viewer.getByText("2 of 6")).toBeVisible();
    await page.keyboard.press("End");
    await expect(viewer.getByRole("button", { name: "Next" })).toBeHidden();
    await expect(viewer.getByRole("button", { name: "Previous" })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(viewer.getByText("6 of 6")).toBeVisible();
  },
  "the last Next click hands the focus to Previous": async ({ page, example, expect }) => {
    await example("gallery").getByRole("link", { name: "Forest edge at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: NAME });
    const next = viewer.getByRole("button", { name: "Next" });
    await next.click();
    await expect(viewer.getByText("6 of 6")).toBeVisible();
    await expect(viewer.getByRole("button", { name: "Previous" })).toBeFocused();
  },
  "with loop, next goes from the last item to the first": async ({ page, example, expect }) => {
    await example("loop").getByRole("link", { name: "Lake shore at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: "Loop album" });
    await expect(viewer.getByText("4 of 4")).toBeVisible();
    await viewer.getByRole("button", { name: "Next" }).click();
    await expect(viewer.getByText("1 of 4")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(viewer.getByText("4 of 4")).toBeVisible();
  },
  "Escape closes and the focus returns to the thumbnail": async ({ page, example, expect }) => {
    const tile = example("gallery").getByRole("link", { name: "Old bridge at dawn" });
    await tile.click();
    const viewer = page.getByRole("dialog", { name: NAME });
    await expect(viewer).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(tile).toBeFocused();
  },
  "the close button closes; the keyboard opens it too": async ({ page, example, expect }) => {
    const tile = example("gallery").getByRole("link", { name: "Hill path at dawn" });
    await tile.focus();
    await page.keyboard.press("Enter");
    const viewer = page.getByRole("dialog", { name: NAME });
    await expect(viewer.getByText("2 of 6")).toBeVisible();
    await viewer.getByRole("button", { name: "Close" }).click();
    await expect(viewer).toBeHidden();
    await expect(tile).toBeFocused();
  },
  "a download link points at the item on show": async ({ page, example, expect }) => {
    await example("gallery").getByRole("link", { name: "Old bridge at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: NAME });
    const image = viewer.getByRole("img", { name: "Old bridge, sample photo 3" });
    const src = await image.getAttribute("src");
    await expect(viewer.getByRole("link", { name: "Download" })).toHaveAttribute("href", src ?? "");
  },
  "a button opens it at the first item": async ({ page, example, expect }) => {
    const trigger = example("trigger").getByRole("button", { name: "Show screenshots" });
    await trigger.click();
    const viewer = page.getByRole("dialog", { name: "Release screenshots" });
    await expect(viewer.getByText("1 of 3")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "on a phone a swipe moves and a swipe down closes": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("gallery").getByRole("link", { name: "Old bridge at dawn" }).click();
    const viewer = page.getByRole("dialog", { name: NAME });
    await expect(viewer.getByText("3 of 6")).toBeVisible();
    const box = await viewer.boundingBox();
    expect(box?.width).toBe(390);
    const swipe = async (dx: number, dy: number): Promise<void> => {
      await page.mouse.move(195, 400);
      await page.mouse.down();
      await page.mouse.move(195 + dx / 2, 400 + dy / 2);
      await page.mouse.move(195 + dx, 400 + dy);
      await page.mouse.up();
    };
    await swipe(-120, 0);
    await expect(viewer.getByText("4 of 6")).toBeVisible();
    await swipe(120, 10);
    await expect(viewer.getByText("3 of 6")).toBeVisible();
    await swipe(0, 150);
    await expect(viewer).toBeHidden();
  },
});
