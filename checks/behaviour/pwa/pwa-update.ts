import { behaviour } from "../../src/behaviour";

export default behaviour("pwa-update", {
  "shows the notice with a Reload button in a live region": async ({ example, expect }) => {
    const region = example("ready").getByRole("status");
    await expect(region).toContainText("A new version is ready");
    await expect(region.getByRole("button", { name: "Reload" })).toBeVisible();
  },
  "shows nothing while no new version waits": async ({ example, expect }) => {
    const region = example("live").getByRole("status");
    await expect(region).toBeAttached();
    await expect(region).toBeEmpty();
  },
  "the Reload button wraps under the text in a narrow region": async ({ example, expect }) => {
    const text = await example("narrow").getByText("A new version is ready").boundingBox();
    const button = await example("narrow").getByRole("button", { name: "Reload" }).boundingBox();
    expect(text && button && button.y >= text.y + text.height).toBe(true);
  },
});
