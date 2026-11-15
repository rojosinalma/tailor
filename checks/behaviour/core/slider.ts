import { behaviour } from "../../src/behaviour";

export default behaviour("slider", {
  "the arrow keys change the value": async ({ page, example, expect }) => {
    const body = example("default");
    const slider = body.getByRole("slider", { name: "Volume" });
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("41");
    await expect(body.locator(".t-slider-value")).toHaveText("41");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(body.locator('[name="volume"]')).toHaveValue("39");
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("100");
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");
  },
  "a click on the track sets the value": async ({ page, example, expect }) => {
    const body = example("step");
    const slider = body.getByRole("slider", { name: "CPU limit" });
    const box = await body.locator(".t-slider-track, .t-slider-native").first().boundingBox();
    if (!box) throw new Error("no track");
    await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
    await expect(slider).toHaveValue("16");
  },
  "a disabled slider does not move": async ({ example, expect }) => {
    await expect(example("states").getByRole("slider", { name: "Locked" })).toBeDisabled();
  },
});
