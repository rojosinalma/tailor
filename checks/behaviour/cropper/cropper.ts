import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The crop that the example reports: width, height, x and y. */
const reported = async (body: Locator): Promise<number[]> => {
  const text = (await body.getByText(/^Crop: /).textContent()) ?? "";
  return (text.match(/\d+/g) ?? []).map(Number);
};

export default behaviour("cropper", {
  "+ and - zoom while the frame has the focus, and change the crop": async ({ example, expect }) => {
    const body = example("aspects");
    await expect.poll(() => reported(body)).toEqual([800, 450, 0, 75]);
    const frame = body.getByRole("group", { name: "Header picture" });
    await frame.focus();
    await frame.press("+");
    await frame.press("+");
    await expect.poll(async () => (await reported(body))[0]).toBeLessThan(800);
    await expect(body.getByRole("slider", { name: "Zoom" })).toHaveValue("1.2");
    await frame.press("-");
    await expect(body.getByRole("slider", { name: "Zoom" })).toHaveValue("1.1");
  },
  "the arrow keys move the image": async ({ example, expect }) => {
    const body = example("aspects");
    const frame = body.getByRole("group", { name: "Header picture" });
    await frame.focus();
    await frame.press("+");
    await frame.press("+");
    await expect.poll(async () => (await reported(body))[0]).toBeLessThan(800);
    const before = await reported(body);
    await frame.press("ArrowLeft");
    await frame.press("ArrowLeft");
    await expect.poll(async () => (await reported(body))[2]).not.toBe(before[2]);
  },
  "the zoom slider and buttons change the crop": async ({ page, example, expect }) => {
    const body = example("aspects");
    await expect.poll(() => reported(body)).toEqual([800, 450, 0, 75]);
    const zoomOut = body.getByRole("button", { name: "Zoom out" });
    await expect(zoomOut).toBeDisabled();
    await body.getByRole("slider", { name: "Zoom" }).focus();
    for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await reported(body))[0]).toBeLessThan(700);
    await expect(zoomOut).toBeEnabled();
    await body.getByRole("button", { name: "Zoom in" }).click();
    await expect(body.getByRole("slider", { name: "Zoom" })).toHaveValue("1.3");
  },
  "the aspect switch and Reset": async ({ example, expect }) => {
    const body = example("aspects");
    await expect.poll(() => reported(body)).toEqual([800, 450, 0, 75]);
    await body.getByRole("radio", { name: "1:1" }).click();
    await expect.poll(() => reported(body)).toEqual([600, 600, 100, 0]);
    await body.getByRole("radio", { name: "Free" }).click();
    await expect.poll(() => reported(body)).toEqual([800, 600, 0, 0]);
    await body.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => reported(body)).toEqual([800, 450, 0, 75]);
    await expect(body.getByRole("radio", { name: "16:9" })).toBeChecked();
  },
  "cropImage makes an image of the crop, at most maxSize": async ({ example, expect }) => {
    const full = example("aspects");
    await expect.poll(() => reported(full)).toEqual([800, 450, 0, 75]);
    await full.getByRole("button", { name: "Make the image" }).click();
    await expect(full.getByText("Made a image/png image of 800 × 450.")).toBeVisible();
    const small = example("max-size");
    await expect.poll(() => reported(small)).toEqual([800, 450, 0, 75]);
    await small.getByRole("button", { name: "Make the image" }).click();
    await expect(small.getByText("Made a image/png image of 200 × 113.")).toBeVisible();
  },
  "the frame has a name and a hint": async ({ example, expect }) => {
    const frame = example("default").getByRole("group", { name: "Profile picture" });
    await expect(frame).toHaveAccessibleDescription(/arrow keys/);
  },
});
