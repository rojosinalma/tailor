import { behaviour } from "../../src/behaviour";

export default behaviour("not-found", {
  "the one heading is the title; Home goes to its address": async ({ example, expect }) => {
    const body = example("default");
    await expect(body.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await expect(body.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(body.getByText("404")).toHaveAttribute("aria-hidden", "true");
  },
  "an own address and a second action": async ({ example, expect }) => {
    const body = example("actions");
    await expect(body.getByRole("heading", { level: 1 })).toHaveText("Host not found");
    await expect(body.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/dashboard");
    await expect(body.getByRole("link", { name: "All hosts" })).toHaveAttribute("href", "#hosts");
  },
});
