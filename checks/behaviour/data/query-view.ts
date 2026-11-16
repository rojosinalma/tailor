import { behaviour } from "../../src/behaviour";

export default behaviour("query-view", {
  "loading shows the placeholders after a moment, marked busy": async ({ example, expect }) => {
    const view = example("loading").locator(".t-query");
    await expect(view).toHaveAttribute("data-state", "loading");
    await expect(view).toHaveAttribute("aria-busy", "true");
    await expect(view.locator(".t-skeleton").first()).toBeVisible();
  },
  "an error shows the message, and Try again loads the data": async ({ kit, example, expect }) => {
    const body = example("error");
    await expect(body.getByRole("alert")).toContainText("The server did not answer in time.");
    // The HTML kit has no query: the server writes the state again.
    if (kit === "html") return;
    await body.getByRole("button", { name: "Try again" }).click();
    await expect(body.getByRole("table", { name: "Hosts" })).toBeVisible();
    await expect(body.getByRole("alert")).toHaveCount(0);
  },
  "empty data shows the empty state": async ({ example, expect }) => {
    const body = example("empty");
    await expect(body.locator(".t-query")).toHaveAttribute("data-state", "empty");
    await expect(body.getByText("No results")).toBeVisible();
  },
  "data shows the content; a refresh keeps it and marks it busy": async ({ example, expect }) => {
    await expect(example("ready").getByRole("table", { name: "Hosts" })).toBeVisible();
    await expect(example("ready").locator(".t-query")).not.toHaveAttribute("aria-busy", /./);
    const refreshing = example("refreshing");
    await expect(refreshing.getByRole("table", { name: "Hosts" })).toBeVisible();
    await expect(refreshing.locator(".t-query")).toHaveAttribute("aria-busy", "true");
    await expect(refreshing.locator(".t-query-progress")).toBeAttached();
  },
  "a TanStack Query result goes in as it is": async ({ kit, example, expect }) => {
    if (kit === "html") return;
    const body = example("tanstack");
    await expect(body.getByRole("table", { name: "Hosts" })).toBeVisible();
    await body.getByRole("button", { name: "Reload" }).click();
    await expect(body.locator(".t-query")).toHaveAttribute("aria-busy", "true");
    await expect(body.locator(".t-query")).not.toHaveAttribute("aria-busy", /./);
  },
});
