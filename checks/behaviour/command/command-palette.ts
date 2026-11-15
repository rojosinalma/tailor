import { behaviour } from "../../src/behaviour";

export default behaviour("command-palette", {
  "Mod+K opens it with the search field focused": async ({ page, example, expect }) => {
    await example("groups").getByText("Last command").waitFor();
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    const search = dialog.getByRole("combobox", { name: "Command palette" });
    await expect(search).toBeFocused();
    const list = dialog.getByRole("listbox");
    await expect(search).toHaveAttribute("aria-controls", (await list.getAttribute("id")) ?? "");
    await expect(list.getByRole("group")).toHaveCount(4);
    await expect(list.getByRole("group", { name: "Recent" })).toBeVisible();
    await expect(dialog.getByRole("option", { name: "Delete nas" })).toHaveAttribute("aria-disabled", "true");
    // The page's own shortcuts are a group too, without the palette's own.
    const shortcuts = list.getByRole("group", { name: "Shortcuts" }).getByRole("option");
    await expect(shortcuts).toHaveText([/^Refresh the list/, /^Go to settings/]);
  },
  "typing filters and marks the matched letters": async ({ page, example, expect }) => {
    await example("groups")
      .getByRole("button", { name: /Search commands/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog.getByRole("combobox")).toBeFocused();
    await page.keyboard.type("sett");
    const options = dialog.getByRole("option");
    await expect(options.first()).toHaveText(/^Settings/);
    await expect(dialog.getByRole("option", { name: /^Go to settings/ })).toBeVisible();
    await expect(dialog.getByRole("option", { name: /^Dashboard/ })).toHaveCount(0);
    await expect(dialog.getByRole("group", { name: "Recent" })).toHaveCount(0);
    await expect(options.first().locator("mark")).toHaveText(["Sett"]);
    await dialog.getByRole("combobox").fill("machines");
    await expect(options).toHaveText([/^Hosts/]);
    await dialog.getByRole("combobox").fill("qqq");
    await expect(options).toHaveCount(0);
    await expect(dialog.getByText("No results")).toBeVisible();
  },
  "arrows, Home and End move the highlight and skip disabled items": async ({ page, example, expect }) => {
    await example("groups")
      .getByRole("button", { name: /Search commands/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    const search = dialog.getByRole("combobox");
    await expect(search).toBeFocused();
    await page.keyboard.type("e");
    const activeName = () =>
      search.evaluate(
        (el) => document.getElementById(el.getAttribute("aria-activedescendant") ?? "")?.textContent,
      );
    const first = await activeName();
    await page.keyboard.press("ArrowDown");
    expect(await activeName()).not.toBe(first);
    await page.keyboard.press("ArrowUp");
    expect(await activeName()).toBe(first);
    await page.keyboard.press("End");
    const last = await activeName();
    await page.keyboard.press("ArrowDown");
    expect(await activeName()).toBe(first);
    await page.keyboard.press("ArrowUp");
    expect(await activeName()).toBe(last);
    await search.fill("nas");
    await expect(dialog.getByRole("option")).toHaveText([/^Delete nas/]);
    await expect(search).not.toHaveAttribute("aria-activedescendant");
    await search.fill("restart");
    await page.keyboard.press("Home");
    await expect(dialog.getByRole("option", { selected: true })).toHaveText(/^Restart web-1/);
  },
  "Enter runs the action, closes and gives the focus back": async ({ page, example, expect }) => {
    const body = example("groups");
    const trigger = body.getByRole("button", { name: /Search commands/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog.getByRole("combobox")).toBeFocused();
    await page.keyboard.type("add");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(body.getByText("Last command: Add a host")).toBeVisible();
    await expect(trigger).toBeFocused();
  },
  "a hotkey in the list runs its shortcut's action": async ({ page, example, expect }) => {
    const body = example("groups");
    await body.getByRole("button", { name: /Search commands/ }).click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await dialog
      .getByRole("group", { name: "Shortcuts" })
      .getByRole("option", { name: /Refresh the list/ })
      .click();
    await expect(dialog).toBeHidden();
    await expect(body.getByText("Last command: Refresh the list")).toBeVisible();
  },
  "Escape clears the text first, then closes and the focus returns": async ({ page, example, expect }) => {
    const trigger = example("groups").getByRole("button", { name: /Search commands/ });
    await trigger.focus();
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    const search = dialog.getByRole("combobox");
    await expect(search).toBeFocused();
    await page.keyboard.type("host");
    await page.keyboard.press("Escape");
    await expect(search).toHaveValue("");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  },
  "a search that the caller runs shows a spinner, then its results": async ({ page, example, expect }) => {
    await example("remote").getByRole("button", { name: "Search hosts" }).click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog.getByText("Type a host name")).toBeVisible();
    await page.keyboard.type("web");
    await expect(dialog.getByRole("status")).toBeVisible();
    await expect(dialog.getByRole("option")).toHaveText(["web-1", "web-2", "web-3"]);
    await expect(dialog.getByRole("status")).toHaveCount(0);
  },
  "a palette with nothing says so": async ({ page, example, expect }) => {
    await example("empty").getByRole("button", { name: "Open an empty palette" }).click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog.getByText("No commands yet")).toBeVisible();
  },
  "it sits near the top, and on a phone it takes the full screen": async ({ page, example, expect }) => {
    const trigger = example("groups").getByRole("button", { name: /Search commands/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog.getByRole("button", { name: "Close" })).toBeHidden();
    const desk = await dialog.boundingBox();
    const height = page.viewportSize()?.height ?? 0;
    expect(desk && desk.y < height / 4).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.setViewportSize({ width: 390, height: 800 });
    await trigger.click();
    await expect(dialog).toBeVisible();
    // The opening scale ends a frame later.
    await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(390);
    expect((await dialog.boundingBox())?.height).toBe(800);
    // No Escape key on a phone: a close button ends it.
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  },
});
