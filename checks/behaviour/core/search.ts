import { behaviour } from "../../src/behaviour";

export default behaviour("search", {
  "the clear button shows with text and clears it": async ({ example, expect }) => {
    const body = example("default");
    const input = body.getByRole("searchbox", { name: "Search hosts" });
    const clear = body.getByRole("button", { name: "Clear" });
    await expect(clear).toBeHidden();
    await input.fill("nas");
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(clear).toBeHidden();
  },
  "the / key focuses the field": async ({ page, example, expect }) => {
    const body = example("default");
    await expect(body.locator(".t-search-key")).toBeVisible();
    await page.keyboard.press("/");
    const input = body.getByRole("searchbox", { name: "Search hosts" });
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await expect(body.locator(".t-search-key")).toBeHidden();
  },
  "the / key types a slash in another field": async ({ page, example, expect }) => {
    const other = example("value").getByRole("searchbox", { name: "Medium search" });
    await other.focus();
    await page.keyboard.press("End");
    await page.keyboard.press("/");
    await expect(other).toHaveValue("web/");
    await expect(other).toBeFocused();
  },
  "Escape clears the text, then leaves the field": async ({ page, example, expect }) => {
    const input = example("default").getByRole("searchbox", { name: "Search hosts" });
    await input.fill("web");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(input).not.toBeFocused();
  },
  "a disabled field cannot be cleared or focused": async ({ example, expect }) => {
    await expect(example("disabled").getByRole("searchbox", { name: "Locked search" })).toBeDisabled();
  },
});
