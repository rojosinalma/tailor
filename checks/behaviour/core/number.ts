import { behaviour } from "../../src/behaviour";

export default behaviour("number", {
  "the step buttons change the value": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Increase" }).click();
    await expect(body.getByLabel("Replicas")).toHaveValue("4");
    await expect(body.locator('[name="replicas"]')).toHaveValue("4");
    await body.getByRole("button", { name: "Decrease" }).click();
    await body.getByRole("button", { name: "Decrease" }).click();
    await expect(body.locator('[name="replicas"]')).toHaveValue("2");
  },
  "the arrow keys step the value": async ({ page, example, expect }) => {
    const body = example("unit");
    await body.getByLabel("Timeout").focus();
    await page.keyboard.press("ArrowUp");
    await expect(body.locator('[name="timeout"]')).toHaveValue("600");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(body.locator('[name="timeout"]')).toHaveValue("400");
  },
  "the value stays between min and max": async ({ page, example, expect }) => {
    const body = example("default");
    const increase = body.getByRole("button", { name: "Increase" });
    for (let i = 0; i < 4; i++) await increase.click({ force: true });
    await expect(body.locator('[name="replicas"]')).toHaveValue("5");
    const input = body.getByLabel("Replicas");
    await input.fill("0");
    await page.keyboard.press("Tab");
    await expect(body.locator('[name="replicas"]')).toHaveValue("1");
  },
  "holding a step button repeats it": async ({ page, example, expect }) => {
    const body = example("unit");
    const box = await body.getByRole("button", { name: "Increase" }).boundingBox();
    if (!box) throw new Error("no increase button");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    const value = Number(await body.locator('[name="timeout"]').inputValue());
    expect(value).toBeGreaterThanOrEqual(900);
  },
  "a step fires input and change on the field": async ({ kit, example, expect }) => {
    if (kit !== "html") return;
    const body = example("default");
    const input = body.locator('[name="replicas"]');
    await input.evaluate((element) => {
      const seen: string[] = [];
      (window as unknown as { seen: string[] }).seen = seen;
      for (const type of ["input", "change"]) element.addEventListener(type, () => seen.push(type));
    });
    await body.getByRole("button", { name: "Increase" }).click();
    const seen = await input.evaluate(() => (window as unknown as { seen: string[] }).seen);
    expect(seen).toEqual(["input", "change"]);
  },
  "a disabled field does not change": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByLabel("Locked count")).toBeDisabled();
    await body.getByRole("button", { name: "Increase" }).click({ force: true });
    await expect(body.getByLabel("Locked count")).toHaveValue("4");
  },
});
