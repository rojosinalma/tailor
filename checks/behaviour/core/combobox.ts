import { behaviour } from "../../src/behaviour";

export default behaviour("combobox", {
  "the list opens at the chosen value, with every choice": async ({ page, example, expect }) => {
    const body = example("many-value");
    const input = body.getByRole("combobox", { name: "Chosen node" });
    for (const opener of [input, body.getByRole("button", { name: /show|open|choices/i }).first()]) {
      if (opener !== input && (await opener.count()) === 0) continue;
      await opener.click();
      await expect(page.getByRole("option")).toHaveCount(40);
      await expect(page.getByRole("option", { name: "queue-9" })).toBeInViewport();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("listbox")).toBeHidden();
    }
  },
  "typing filters the list and opens it": async ({ page, example, expect }) => {
    const input = example("default").getByRole("combobox", { name: "Host" });
    await input.click();
    await expect(page.getByRole("option")).toHaveCount(4);
    await page.keyboard.type("web");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option")).toHaveText(["web-1", "web-2"]);
  },
  "a click on an option picks it and the form sends it": async ({ page, example, expect }) => {
    const body = example("default");
    const input = body.getByRole("combobox", { name: "Host" });
    await input.click();
    await page.getByRole("option", { name: "nas" }).click();
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(input).toHaveValue("nas");
    await expect(body.locator('[name="host"]')).toHaveValue("nas");
    await expect(input).toBeFocused();
  },
  "the arrow keys move the highlight and Enter picks": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("combobox", { name: "Host" }).click();
    await page.keyboard.type("w");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "web-2" })).toHaveAttribute("data-highlighted", "");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(body.locator('[name="host"]')).toHaveValue("web-2");
  },
  "Tab closes the list without picking": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("combobox", { name: "Host" }).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(body.locator('[name="host"]')).toHaveValue("");
  },
  "a disabled option cannot be picked": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("combobox", { name: "Host" }).click();
    await page.getByRole("option", { name: "console" }).click({ force: true });
    await expect(body.locator('[name="host"]')).toHaveValue("");
  },
  "the clear button clears the value": async ({ example, expect }) => {
    const body = example("value");
    const input = body.getByRole("combobox", { name: "Medium host" });
    await expect(input).toHaveValue("nas");
    const clear = body.getByRole("button", { name: "Clear" }).nth(1);
    await clear.click();
    await expect(input).toHaveValue("");
    await expect(body.locator('[name="medium"]')).toHaveValue("");
    await expect(input).toBeFocused();
  },
  "Escape closes the list, a second Escape clears": async ({ page, example, expect }) => {
    const body = example("value");
    const input = body.getByRole("combobox", { name: "Medium host" });
    await input.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(body.locator('[name="medium"]')).toHaveValue("nas");
    await expect(input).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    await expect(body.locator('[name="medium"]')).toHaveValue("");
  },
  "text that matches nothing shows no results": async ({ page, example, expect }) => {
    await example("default").getByRole("combobox", { name: "Host" }).click();
    await page.keyboard.type("zzz");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.getByText("No results")).toBeVisible();
  },
  "with allowCustom, Enter keeps typed text as the value": async ({ page, example, expect }) => {
    const body = example("custom");
    const input = body.getByRole("combobox", { name: "Environment" });
    await input.click();
    await page.keyboard.type("dev");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("dev");
    await expect(body.locator('[name="env"]')).toHaveValue("dev");
    await input.click();
    await expect(page.getByRole("option", { name: "dev" })).toBeVisible();
  },
  "the loading line shows while the options load": async ({ page, example, expect }) => {
    await example("loading").getByRole("combobox", { name: "Owner" }).click();
    await expect(page.locator(".t-combobox-status")).toContainText("Loading");
    await expect(page.getByText("No results")).toBeHidden();
  },
  "a disabled combobox does not open": async ({ page, example, expect }) => {
    const input = example("disabled").getByRole("combobox", { name: "Locked host" });
    await expect(input).toBeDisabled();
    await input.click({ force: true });
    await expect(page.getByRole("listbox")).toBeHidden();
  },
  "in a field, the label focuses it and the messages describe it": async ({ example, expect }) => {
    const body = example("field");
    const input = body.getByRole("combobox", { name: "Backup host" });
    await body.locator(".t-field-label").click();
    await expect(input).toBeFocused();
    await expect(input).toHaveAccessibleDescription("Where the nightly copy goes. nas is full.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  },
  "on a phone the list is a sheet at the bottom of the screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await example("default").getByRole("combobox", { name: "Host" }).click();
    const popup = page.locator(".t-combobox-popup");
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box?.width).toBe(390);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(800);
  },
});
