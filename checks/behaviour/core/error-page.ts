import { behaviour } from "../../src/behaviour";

export default behaviour("error-page", {
  "the details stay closed until asked for, with a copy button": async ({ page, example, expect }) => {
    // The system clipboard is shared by the tests that run at the same time: catch the copy in the page.
    await page.evaluate(() => {
      const holder = window as unknown as { copied?: string };
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            holder.copied = text;
          },
        },
      });
    });
    const body = example("details");
    await expect(body.getByRole("heading", { level: 1 })).toHaveText("The hosts could not load");
    const message = body.getByText("Reference: req_7c41f0e2");
    await expect(message).toBeHidden();
    await body.locator(".t-accordion-trigger", { hasText: "Details" }).click();
    await expect(message).toBeVisible();
    await body.getByRole("button", { name: "Copy" }).click();
    await expect(body.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { copied?: string }).copied ?? "")).toContain(
      "req_7c41f0e2",
    );
  },
  "Home goes home": async ({ example, expect }) => {
    await expect(example("default").getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  },
  "as a route error boundary it shows the error and Try again resets the route": async ({
    page,
    kit,
    example,
    expect,
  }) => {
    const body = example("route-error");
    await expect(body.getByRole("heading", { level: 1 })).toHaveText("Something went wrong");
    await body.locator(".t-accordion-trigger", { hasText: "Details" }).click();
    await expect(body.getByText("GET /api/hosts failed: 503 Service Unavailable")).toBeVisible();
    if (kit === "react") {
      await body.getByRole("button", { name: "Try again" }).click();
      await expect(body.getByText("The hosts loaded on the second try.")).toBeVisible();
      return;
    }
    // The HTML kit has no callback: Try again loads the page again.
    await page.evaluate(() => Object.assign(window, { beforeReload: true }));
    await Promise.all([page.waitForEvent("load"), body.getByRole("button", { name: "Try again" }).click()]);
    expect(await page.evaluate(() => "beforeReload" in window)).toBe(false);
  },
});
