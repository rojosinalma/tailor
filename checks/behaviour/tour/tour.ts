import { behaviour } from "../../src/behaviour";

export default behaviour("tour", {
  "Next and Back step through, Done finishes and the focus goes back": async ({ page, example, expect }) => {
    const body = example("basic");
    const start = body.getByRole("button", { name: "Take the tour" });
    await start.click();
    const dialog = page.getByRole("dialog", { name: "Hosts tour Search" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Step 1 of 4");
    await expect(dialog.getByRole("button", { name: "Next" })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "Back" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Next" }).click();
    const second = page.getByRole("dialog", { name: "Hosts tour Add a host" });
    await expect(second).toContainText("Step 2 of 4");
    await expect(second.getByRole("button", { name: "Next" })).toBeFocused();
    await second.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("dialog", { name: "Hosts tour Search" })).toBeVisible();
    for (let i = 0; i < 3; i++) await page.getByRole("dialog").getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("dialog")).toContainText("Step 4 of 4");
    await page.getByRole("dialog").getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(body.getByText("The tour is done.")).toBeVisible();
    await expect(start).toBeFocused();
  },
  "the arrow keys move and Escape skips": async ({ page, example, expect }) => {
    const body = example("basic");
    const start = body.getByRole("button", { name: "Take the tour" });
    await start.click();
    await expect(page.getByRole("dialog")).toContainText("Step 1 of 4");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog")).toContainText("Step 2 of 4");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: "Hosts tour Status" })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("dialog")).toContainText("Step 2 of 4");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(body.getByText("The tour was skipped.")).toBeVisible();
    await expect(start).toBeFocused();
  },
  "Skip ends the tour": async ({ page, example, expect }) => {
    const body = example("basic");
    await body.getByRole("button", { name: "Take the tour" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Skip tour" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(body.getByText("The tour was skipped.")).toBeVisible();
  },
  "the focus stays in the step and the page takes no clicks": async ({ page, example, expect }) => {
    const body = example("basic");
    await body.getByRole("button", { name: "Take the tour" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Base UI moves the focus back from its focus guards a frame later: wait for it each time.
    const inside = () => dialog.evaluate((el) => el.contains(document.activeElement));
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect.poll(inside).toBe(true);
    }
    // The target stays visible, but a click on it lands on the layer.
    const box = await page.locator("#basic-search").boundingBox();
    if (!box) throw new Error("no box");
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className ?? "", {
      x: box.x + 2,
      y: box.y + 2,
    });
    expect(hit).toContain("t-tour-layer");
  },
  "a step whose element is missing is passed over": async ({ page, example, expect }) => {
    await example("missing").getByRole("button", { name: "Take the tour" }).click();
    await expect(page.getByRole("dialog")).toContainText("Step 1 of 4");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: "Hosts tour Add a host" })).toContainText("Step 2 of 4");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("dialog", { name: "Hosts tour Search" })).toBeVisible();
  },
  "the cut-out matches the target and follows it": async ({ page, example, expect }) => {
    const body = example("basic");
    await body.getByRole("button", { name: "Take the tour" }).click();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: "Hosts tour Add a host" })).toBeVisible();
    // The page is hidden from the accessibility tree while the tour runs, so the target is found by its id.
    const target = body.locator("#basic-add");
    const cut = page.locator(".t-tour-cutout");
    const matches = async (): Promise<void> => {
      await expect
        .poll(async () => {
          const [a, b] = await Promise.all([target.boundingBox(), cut.boundingBox()]);
          if (!a || !b) return Number.POSITIVE_INFINITY;
          return Math.max(
            Math.abs(a.x - 6 - b.x),
            Math.abs(a.y - 6 - b.y),
            Math.abs(a.width + 12 - b.width),
            Math.abs(a.height + 12 - b.height),
          );
        })
        .toBeLessThan(1.5);
    };
    await matches();
    await page.mouse.wheel(0, 50);
    await matches();
    await page.setViewportSize({ width: 1000, height: 700 });
    await matches();
  },
  "on a phone the step is a bottom sheet and the target stays above it": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await example("basic").getByRole("button", { name: "Take the tour" }).click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const dialog = page.getByRole("dialog", { name: "Hosts tour Status" });
    await expect(dialog).toBeVisible();
    await expect
      .poll(async () => {
        const [sheet, target] = await Promise.all([
          dialog.boundingBox(),
          example("basic").getByText("Last check passed at 12:00.").boundingBox(),
        ]);
        if (!sheet || !target) return false;
        return (
          Math.round(sheet.y + sheet.height) === 700 &&
          sheet.width === 390 &&
          target.y + target.height <= sheet.y
        );
      })
      .toBe(true);
  },
});
