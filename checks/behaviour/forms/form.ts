import type { Page } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The server of the HTML kit: it knows web-1 already, as the React example's onSubmit does. */
async function server(page: Page): Promise<void> {
  await page.route("**/api/hosts", async (route) => {
    const body = route.request().postData() ?? "";
    const name = /name="name"\r\n\r\n([^\r]*)/.exec(body)?.[1] ?? "";
    await new Promise((done) => setTimeout(done, 600));
    await route.fulfill({
      json:
        name === "web-1"
          ? { ok: false, message: "The host was not added.", errors: { name: "A host named web-1 exists." } }
          : { ok: true, message: `${name} is added.` },
    });
  });
}

const required = "This field is required";

export default behaviour("form", {
  "a field checks when the focus leaves it, not while the person types": async ({
    page,
    example,
    expect,
  }) => {
    const body = example("stack");
    const name = body.getByRole("textbox", { name: "Host name" });
    await name.fill("web");
    await name.fill("");
    await expect(name).not.toHaveAttribute("aria-invalid", "true");
    await page.keyboard.press("Tab");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(/This field is required/);
    await expect(
      body
        .locator(".t-form-field", { has: page.getByRole("textbox", { name: "Host name" }) })
        .locator(".t-field-error"),
    ).toHaveText(required);
  },
  "an error clears while the person fixes the value": async ({ page, example, expect }) => {
    const body = example("stack");
    const name = body.getByRole("textbox", { name: "Host name" });
    await name.focus();
    await page.keyboard.press("Tab");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await name.focus();
    await page.keyboard.type("w");
    await expect(name).not.toHaveAttribute("aria-invalid", "true");
    await expect(
      body
        .locator(".t-form-field", { has: page.getByRole("textbox", { name: "Host name" }) })
        .locator(".t-field-error"),
    ).toBeEmpty();
  },
  "an email field checks the type": async ({ page, example, expect }) => {
    const body = example("stack");
    const email = body.getByRole("textbox", { name: "Contact email" });
    await email.fill("alice");
    await page.keyboard.press("Tab");
    await expect(body.getByText("Enter an email address")).toBeVisible();
    await email.fill("alice@example.com");
    await expect(body.getByText("Enter an email address")).toHaveCount(0);
  },
  "a submit with errors focuses the first invalid field and lists the errors": async ({
    example,
    expect,
  }) => {
    const body = example("stack");
    await body.getByRole("button", { name: "Add host" }).click();
    await expect(body.getByRole("textbox", { name: "Host name" })).toBeFocused();
    const summary = body.getByRole("alert");
    await expect(summary).toContainText("Correct these fields");
    await expect(summary.getByRole("link")).toHaveText([
      `Host name: ${required}`,
      `Address: ${required}`,
      `Kind: ${required}`,
    ]);
    await summary.getByRole("link", { name: `Kind: ${required}` }).click();
    await expect(body.getByRole("combobox", { name: "Kind" })).toBeFocused();
  },
  "the summary shrinks as fields become valid": async ({ example, expect }) => {
    const body = example("stack");
    await body.getByRole("button", { name: "Add host" }).click();
    await body.getByRole("textbox", { name: "Host name" }).fill("web-2");
    await body.getByRole("textbox", { name: "Address" }).fill("192.0.2.10");
    await expect(body.getByRole("alert").getByRole("link")).toHaveText([`Kind: ${required}`]);
  },
  "a server error goes on its field, with a danger toast; the page stays": async ({
    page,
    example,
    expect,
  }) => {
    await server(page);
    const url = page.url();
    const body = example("stack");
    await body.getByRole("textbox", { name: "Host name" }).fill("web-1");
    await body.getByRole("textbox", { name: "Address" }).fill("192.0.2.10");
    await body.getByRole("combobox", { name: "Kind" }).click();
    await page.getByRole("option", { name: "Server" }).click();
    const submit = body.getByRole("button", { name: "Add host" });
    await submit.click();
    await expect(submit).toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".t-toast", { hasText: "The host was not added." })).toBeVisible();
    await expect(page.locator(".t-toast", { hasText: "The host was not added." })).toHaveAttribute(
      "data-tone",
      "danger",
    );
    const name = body.getByRole("textbox", { name: "Host name" });
    await expect(name).toBeFocused();
    await expect(name).toHaveAccessibleDescription(/A host named web-1 exists\./);
    await expect(submit).not.toHaveAttribute("aria-busy", "true");
    await page.keyboard.type("0");
    await expect(name).not.toHaveAttribute("aria-invalid", "true");
    expect(page.url()).toBe(url);
  },
  "a sent form shows a success toast": async ({ page, example, expect }) => {
    await server(page);
    const body = example("stack");
    await body.getByRole("textbox", { name: "Host name" }).fill("web-2");
    await body.getByRole("textbox", { name: "Address" }).fill("192.0.2.10");
    await body.getByRole("combobox", { name: "Kind" }).click();
    await page.getByRole("option", { name: "Storage" }).click();
    await body.getByRole("textbox", { name: "Host name" }).press("Enter");
    const done = page.locator(".t-toast", { hasText: "web-2 is added." });
    await expect(done).toBeVisible();
    await expect(done).toHaveAttribute("data-tone", "success");
    await expect(body.getByRole("alert")).toHaveCount(0);
  },
  "the grid puts two fields in a row, a narrow box one": async ({ example, expect }) => {
    const wide = example("grid");
    const a = await wide.getByRole("textbox", { name: "Host name" }).boundingBox();
    const b = await wide.getByRole("textbox", { name: "Address" }).boundingBox();
    expect(a && b && Math.abs(a.y - b.y) < 2 && b.x > a.x).toBe(true);
    const narrow = example("narrow");
    const c = await narrow.getByRole("textbox", { name: "Host name" }).boundingBox();
    const d = await narrow.getByRole("textbox", { name: "Address" }).boundingBox();
    expect(c && d && Math.abs(c.x - d.x) < 2 && d.y > c.y).toBe(true);
  },
  "a required editor in a section is checked on submit": async ({ example, expect }) => {
    const body = example("sections");
    for (const n of [2, 1]) await body.getByRole("button", { name: `Remove Hosts ${n}` }).click();
    await body.getByRole("button", { name: "Save job" }).click();
    await expect(body.getByRole("alert").getByRole("link")).toHaveText([`Hosts: ${required}`]);
    await expect(body.getByRole("button", { name: "Add", exact: true })).toBeFocused();
  },
  "on a phone the form keeps to the screen": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const box = await example("grid").getByRole("button", { name: "Add host" }).boundingBox();
    expect(box && box.x + box.width <= 390).toBe(true);
    const a = await example("grid").getByRole("textbox", { name: "Host name" }).boundingBox();
    const b = await example("grid").getByRole("textbox", { name: "Address" }).boundingBox();
    expect(a && b && b.y > a.y).toBe(true);
  },
  "a check of its own runs on blur (React kit)": async ({ page, example, expect, kit }) => {
    if (kit === "html") return;
    const body = example("check");
    const user = body.getByRole("textbox", { name: "User name" });
    await user.fill("Alice");
    await page.keyboard.press("Tab");
    await expect(body.getByText("Start with a letter; use a-z, 0-9 and -.")).toBeVisible();
    await user.fill("alice");
    await expect(body.getByText("Start with a letter; use a-z, 0-9 and -.")).toHaveCount(0);
  },
});
