import { behaviour } from "../../src/behaviour";

export default behaviour("secret", {
  "the reveal button shows and hides the value": async ({ example, expect }) => {
    const body = example("default");
    const input = body.getByLabel("API token");
    const reveal = body.getByRole("button", { name: "Show" });
    await expect(input).toHaveAttribute("type", "password");
    await expect(reveal).toHaveAttribute("aria-pressed", "false");
    await reveal.click();
    await expect(input).toHaveAttribute("type", "text");
    await expect(reveal).toHaveAttribute("aria-pressed", "true");
    await reveal.click();
    await expect(input).toHaveAttribute("type", "password");
    await expect(body.locator('[name="token"]')).toHaveValue("tok_4f2a9c81e7d3");
  },
  "the copy button copies the value and says so": async ({ page, example, expect }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    const body = example("default");
    await body.getByRole("button", { name: "Copy" }).click();
    await expect(body.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("tok_4f2a9c81e7d3");
  },
  "a field without copyable has no copy button": async ({ example, expect }) => {
    await expect(example("password").getByRole("button", { name: "Copy" })).toHaveCount(0);
  },
  "a disabled field has disabled buttons": async ({ example, expect }) => {
    const body = example("states");
    await expect(body.getByLabel("Locked token")).toBeDisabled();
  },
});
