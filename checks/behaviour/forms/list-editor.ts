import { behaviour } from "../../src/behaviour";

const values = (body: import("playwright").Locator) =>
  body.locator(".t-list-editor-item").evaluateAll((items) =>
    items.map((item) => {
      const control = item.querySelector("input, select");
      return control instanceof HTMLInputElement || control instanceof HTMLSelectElement ? control.value : "";
    }),
  );

export default behaviour("list-editor", {
  "shows one row per value, each with its name": async ({ example, expect }) => {
    const body = example("default");
    await expect(body.getByRole("group", { name: "Hosts" })).toBeVisible();
    await expect(body.getByRole("textbox", { name: "Hosts 1" })).toHaveValue("web-1");
    await expect(body.getByRole("textbox", { name: "Hosts 3" })).toHaveValue("nas");
    await expect(body.getByRole("button", { name: "Move up Hosts 1" })).toBeDisabled();
    await expect(body.getByRole("button", { name: "Move down Hosts 3" })).toBeDisabled();
  },
  "Add appends a row and focuses it": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Add" }).click();
    const added = body.getByRole("textbox", { name: "Hosts 4" });
    await expect(added).toBeFocused();
    await page.keyboard.type("web-3");
    expect(await values(body)).toEqual(["web-1", "web-2", "nas", "web-3"]);
  },
  "move up and down reorder with the keyboard, the focus follows": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Move up Hosts 3" }).focus();
    await page.keyboard.press("Enter");
    expect(await values(body)).toEqual(["web-1", "nas", "web-2"]);
    await expect(body.getByRole("button", { name: "Move up Hosts 2" })).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await values(body)).toEqual(["nas", "web-1", "web-2"]);
    // At the top, move up is off; the focus goes to move down of the same row.
    await expect(body.getByRole("button", { name: "Move down Hosts 1" })).toBeFocused();
    await page.keyboard.press("Enter");
    expect(await values(body)).toEqual(["web-1", "nas", "web-2"]);
  },
  "remove takes the row out and focuses the next one": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Remove Hosts 2" }).click();
    expect(await values(body)).toEqual(["web-1", "nas"]);
    await expect(body.getByRole("textbox", { name: "Hosts 2" })).toBeFocused();
    await body.getByRole("button", { name: "Remove Hosts 2" }).click();
    await body.getByRole("button", { name: "Remove Hosts 1" }).click();
    await expect(body.getByRole("button", { name: "Add" })).toBeFocused();
  },
  "the form gets the values": async ({ example, expect, kit }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Remove Hosts 1" }).click();
    if (kit === "react") {
      const sent = await body
        .locator('input[type="hidden"][name="hosts[]"]')
        .evaluateAll((inputs) =>
          inputs.map((input) => (input instanceof HTMLInputElement ? input.value : "")),
        );
      expect(sent).toEqual(["web-2", "nas"]);
    } else await expect(body.locator('textarea[name="hosts"]')).toHaveValue("web-2\nnas");
  },
  "with options each row is a select; a held value cannot be picked twice": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("options");
    await expect(body.getByRole("combobox", { name: "Regions 1" })).toContainText("Europe");
    await body.getByRole("button", { name: "Add" }).click();
    const second = body.getByRole("combobox", { name: "Regions 2" });
    await expect(second).toBeFocused();
    await second.click();
    await expect(page.getByRole("option", { name: "Europe" })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("option", { name: "Asia Pacific" }).click();
    expect(await values(body)).toEqual(["eu", "ap"]);
  },
  "at the limit Add is off": async ({ example, expect }) => {
    const body = example("max");
    const add = body.getByRole("button", { name: "Add" });
    await add.click();
    await expect(add).toBeDisabled();
    await body.getByRole("button", { name: "Remove Tags 3" }).click();
    await expect(add).toBeEnabled();
  },
  "a click on the field label focuses the first row": async ({ example, expect }) => {
    const body = example("max");
    await body.locator(".t-field-label").click();
    await expect(body.getByRole("textbox", { name: "Tags 1" })).toBeFocused();
  },
  "a value that fails the check is marked (React kit)": async ({ example, expect, kit }) => {
    if (kit === "html") return;
    const body = example("field");
    const row = body.getByRole("textbox", { name: "Allowed hosts 2" });
    await row.fill("Web 2");
    await expect(row).toHaveAttribute("aria-invalid", "true");
    await expect(row).toHaveAccessibleDescription(/Use lower-case letters, digits, dots and dashes\./);
    await row.fill("web-2");
    await expect(row).not.toHaveAttribute("aria-invalid", "true");
  },
  "a disabled editor takes no input": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByRole("textbox", { name: "Locked hosts 1" })).toBeDisabled();
    await expect(body.getByRole("button", { name: "Add" })).toBeDisabled();
  },
});
