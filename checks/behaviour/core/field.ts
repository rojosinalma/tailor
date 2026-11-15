import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

const cases: {
  example: string;
  what: string;
  help: string;
  error: string;
  control: (body: Locator) => Locator;
}[] = [
  {
    example: "input",
    what: "text input",
    help: "Lower-case letters, digits and dashes.",
    error: "This name is already taken.",
    control: (body) => body.getByRole("textbox", { name: "Host name" }),
  },
  {
    example: "select",
    what: "select",
    help: "Where the host runs.",
    error: "Pick a region.",
    control: (body) => body.getByRole("combobox", { name: "Region" }),
  },
  {
    example: "date",
    what: "date picker",
    help: "The first day of the window.",
    error: "The date is in the past.",
    control: (body) => body.getByRole("button", { name: "Start date" }),
  },
];

const tests: Parameters<typeof behaviour>[1] = {};
for (const c of cases) {
  tests[`a click on the label focuses the ${c.what}`] = async ({ page, example, expect }) => {
    const body = example(c.example);
    await body.locator(".t-field-label").click();
    await expect(c.control(body)).toBeFocused();
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(page.getByRole("grid")).toBeHidden();
  };
  tests[`the help and the error describe the ${c.what}, which is invalid`] = async ({ example, expect }) => {
    const control = c.control(example(c.example));
    await expect(control).toHaveAccessibleDescription(`${c.help} ${c.error}`);
    await expect(control).toHaveAttribute("aria-invalid", "true");
  };
}

export default behaviour("field", {
  ...tests,
  "the error text is in a polite live region": async ({ example, expect }) => {
    const error = example("input").locator(".t-field-error");
    await expect(error).toHaveAttribute("aria-live", "polite");
    await expect(error).toHaveText("This name is already taken.");
  },
  "a field with no error is valid; required reaches the control": async ({ example, expect }) => {
    const control = example("valid").getByRole("textbox", { name: "Email" });
    await expect(control).not.toHaveAttribute("aria-invalid", "true");
    await expect(control).toHaveAttribute("required", "");
    await expect(control).toHaveAccessibleDescription("Alerts go to this address.");
    await expect(example("valid").locator(".t-field-error")).toBeHidden();
  },
  "a disabled field disables its control": async ({ example, expect }) => {
    await expect(example("disabled").getByRole("textbox", { name: "Owner" })).toBeDisabled();
  },
  "the form sends the values of its fields": async ({ example, expect }) => {
    const body = example("form");
    await body.getByRole("textbox", { name: "Host name" }).fill("web-2");
    const values = await body.locator("form").evaluate((form) => {
      const data = new FormData(form as HTMLFormElement);
      return { name: data.get("name"), port: data.get("port"), monitor: data.get("monitor") };
    });
    expect(values).toEqual({ name: "web-2", port: "80", monitor: "on" });
  },
});
