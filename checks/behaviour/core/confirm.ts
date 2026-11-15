import { behaviour } from "../../src/behaviour";

const open = async (
  { page, example }: Parameters<Parameters<typeof behaviour>[1][string]>[0],
  name = "Delete web-1",
) => {
  await example("default").getByRole("button", { name }).click();
  return page.getByRole("alertdialog");
};

export default behaviour("confirm", {
  "it asks, with the focus on Cancel": async (context) => {
    const dialog = await open(context);
    const { expect } = context;
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Delete web-1?");
    await expect(dialog).toContainText("go away for good");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "Delete" })).toHaveAttribute("data-variant", "danger");
  },
  "the confirm button answers true": async (context) => {
    const dialog = await open(context);
    await dialog.getByRole("button", { name: "Delete" }).click();
    await context.expect(dialog).toBeHidden();
    await context.expect(context.example("default").locator("#confirm-delete")).toHaveText("true");
  },
  "Cancel answers false": async (context) => {
    const dialog = await open(context);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await context.expect(dialog).toBeHidden();
    await context.expect(context.example("default").locator("#confirm-delete")).toHaveText("false");
  },
  "Escape answers false and the focus returns": async (context) => {
    const dialog = await open(context);
    await context.expect(dialog).toBeVisible();
    await context.page.keyboard.press("Escape");
    await context.expect(dialog).toBeHidden();
    await context.expect(context.example("default").locator("#confirm-delete")).toHaveText("false");
    await context
      .expect(context.example("default").getByRole("button", { name: "Delete web-1" }))
      .toBeFocused();
  },
  "a click on the backdrop answers false": async (context) => {
    const dialog = await open(context);
    await context.expect(dialog).toBeVisible();
    await context.page.mouse.click(5, 5);
    await context.expect(dialog).toBeHidden();
    await context.expect(context.example("default").locator("#confirm-delete")).toHaveText("false");
  },
  "without danger the confirm button is primary": async (context) => {
    const dialog = await open(context, "Restart nas");
    await context.expect(dialog).toHaveAccessibleName("Restart nas?");
    await context
      .expect(dialog.getByRole("button", { name: "Restart" }))
      .toHaveAttribute("data-variant", "primary");
  },
  "on a phone it stays a small box": async (context) => {
    await context.page.setViewportSize({ width: 390, height: 800 });
    const dialog = await open(context);
    await context.expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    context.expect(box?.width).toBeLessThan(390);
    context.expect(box?.height).toBeLessThan(400);
  },
});
