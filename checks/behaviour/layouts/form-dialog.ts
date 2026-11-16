import type { Page } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The server of the HTML kit: it knows the service api already, as the React sample's addService does. */
async function server(page: Page): Promise<void> {
  await page.route("**/api/services", async (route) => {
    const body = route.request().postData() ?? "";
    const name = /name="name"\r\n\r\n([^\r]*)/.exec(body)?.[1] ?? "";
    await new Promise((done) => setTimeout(done, 600));
    await route.fulfill({
      json:
        name === "api"
          ? {
              ok: false,
              message: "The service was not added.",
              errors: { name: "A service named api exists." },
            }
          : { ok: true, message: `${name} is added.` },
    });
  });
}

export default behaviour("form-dialog", {
  "open, submit empty, correct, submit: a toast, and the dialog closes": async ({
    page,
    example,
    expect,
  }) => {
    await server(page);
    const trigger = example("default").getByRole("button", { name: "Add service" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Add service" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Add service" }).click();
    const name = dialog.getByRole("textbox", { name: "Name" });
    await expect(name).toBeFocused();
    await expect(dialog.getByRole("alert").getByRole("link")).toHaveText(["Name: This field is required"]);
    await dialog.getByRole("textbox", { name: "Owner email" }).fill("alice");
    await name.fill("files");
    await dialog.getByRole("button", { name: "Add service" }).click();
    await expect(dialog.getByRole("alert").getByRole("link")).toHaveText([/^Owner email: /]);
    await dialog.getByRole("textbox", { name: "Owner email" }).fill("alice@example.com");
    const submit = dialog.getByRole("button", { name: "Add service" });
    await submit.click();
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".t-toast", { hasText: "files is added." })).toBeVisible();
    await expect(dialog).toBeHidden();
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "Add service" }).getByRole("textbox", { name: "Name" }),
    ).toHaveValue("");
  },
  "a name the server knows stays open with the error on the field": async ({ page, example, expect }) => {
    await server(page);
    await example("default").getByRole("button", { name: "Add service" }).click();
    const dialog = page.getByRole("dialog", { name: "Add service" });
    await dialog.getByRole("textbox", { name: "Name" }).fill("api");
    await dialog.getByRole("button", { name: "Add service" }).click();
    await expect(page.locator(".t-toast", { hasText: "The service was not added." })).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(
      /A service named api exists\./,
    );
  },
  "Cancel closes and clears": async ({ page, example, expect }) => {
    const trigger = example("default").getByRole("button", { name: "Add service" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Add service" });
    await dialog.getByRole("textbox", { name: "Name" }).fill("files");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "Add service" }).getByRole("textbox", { name: "Name" }),
    ).toHaveValue("");
  },
  "on a phone the dialog takes the screen and its buttons stay in reach": async ({
    page,
    example,
    expect,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("narrow").getByRole("button", { name: "Add service" }).click();
    const dialog = page.getByRole("dialog", { name: "Add service" });
    const box = await dialog.boundingBox();
    expect(box && box.width >= 389 && box.height >= 799).toBe(true);
    const submit = dialog.getByRole("button", { name: "Add service" });
    await submit.scrollIntoViewIfNeeded();
    const button = await submit.boundingBox();
    expect(button && button.x + button.width <= 390 && button.y + button.height <= 800).toBe(true);
  },
});
