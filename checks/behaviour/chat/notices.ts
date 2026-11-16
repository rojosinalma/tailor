import { behaviour } from "../../src/behaviour";

export default behaviour("notices", {
  "a notice's buttons fire and the answered notice goes": async ({ example, expect }) => {
    const body = example("default");
    const region = body.getByRole("region", { name: "Waiting for you" });
    await expect(region.getByRole("listitem")).toHaveCount(2);
    await region.getByRole("button", { name: "Restart" }).click();
    await expect(body.getByText("Restart web-2? Restart")).toBeVisible();
    await expect(region.getByRole("listitem")).toHaveCount(1);
  },
  "more than three collapse into a button that expands": async ({ example, expect }) => {
    const body = example("many");
    const region = body.getByRole("region", { name: "Open questions" });
    await expect(region.getByRole("listitem")).toHaveCount(3);
    const more = region.getByRole("button", { name: "2 more" });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(region.getByRole("listitem")).toHaveCount(5);
    await region.getByRole("button", { name: "Show fewer" }).click();
    await expect(region.getByRole("listitem")).toHaveCount(3);
    await region.getByRole("button", { name: "Share", exact: true }).click();
    await expect(region.getByRole("listitem")).toHaveCount(3);
    await expect(region.getByRole("button", { name: "1 more" })).toBeVisible();
  },
});
