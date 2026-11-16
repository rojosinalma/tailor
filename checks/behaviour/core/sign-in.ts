import { behaviour } from "../../src/behaviour";

export default behaviour("sign-in", {
  "a form that password managers fill": async ({ example, expect }) => {
    const body = example("alternatives");
    await expect(body.getByRole("heading", { level: 1 })).toHaveText("Sign in");
    const form = body.locator("form");
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute("action", "/sign-in");
    await expect(form).toHaveAttribute("novalidate", "");
    const email = body.getByRole("textbox", { name: "Email" });
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("name", "email");
    await expect(email).toHaveAttribute("autocomplete", "username");
    const password = body.getByLabel("Password", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveAttribute("name", "password");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    await expect(form.locator('[type="submit"]')).toHaveCount(1);
    await expect(form.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
    await expect(body.getByRole("separator", { name: "or" })).toBeVisible();
  },
  "a user name sign-in names its field username": async ({ example, expect }) => {
    const name = example("default").getByRole("textbox", { name: "Username" });
    await expect(name).toHaveAttribute("type", "text");
    await expect(name).toHaveAttribute("name", "username");
    await expect(name).toHaveAttribute("autocomplete", "username");
    await expect(example("default").getByRole("checkbox", { name: "Keep me signed in" })).toBeVisible();
  },
  "the server's error is announced above the form": async ({ example, expect }) => {
    await expect(example("error").getByRole("alert")).toHaveText("Wrong email or password.");
  },
  "empty fields show their error and the first one takes the focus": async ({ kit, example, expect }) => {
    // In the HTML kit the server, or the forms pack's script, checks the fields.
    if (kit !== "react") return;
    const body = example("default");
    const name = body.getByRole("textbox", { name: "Username" });
    const password = body.getByLabel("Password", { exact: true });
    await body.getByRole("button", { name: "Sign in" }).click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(body.getByText("Fill in this field.")).toHaveCount(2);
    await name.fill("alice");
    await password.press("Enter");
    await expect(password).toBeFocused();
    await expect(name).not.toHaveAttribute("aria-invalid", "true");
  },
  "a filled form calls onSubmit and the button works until it settles": async ({ kit, example, expect }) => {
    if (kit !== "react") return;
    const body = example("default");
    await body.getByRole("textbox", { name: "Username" }).fill("alice");
    await body.getByLabel("Password", { exact: true }).fill("wrong");
    const button = body.getByRole("button", { name: "Sign in" });
    await button.click();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(body.getByRole("alert")).toHaveText("Wrong name or password.");
    await expect(button).not.toHaveAttribute("aria-busy", "true");
  },
});
