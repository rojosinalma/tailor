import { behaviour } from "../../src/behaviour";

export default behaviour("offline-banner", {
  "offline, the actions that need the server are disabled with a note": async ({ example, expect }) => {
    const body = example("offline");
    await expect(body.getByRole("status")).toContainText("You are offline");
    const deploy = body.getByRole("button", { name: "Deploy web-1" });
    await expect(deploy).toHaveAttribute("aria-disabled", "true");
    await expect(deploy).toHaveAccessibleDescription("Needs a network connection");
    await expect(body.getByRole("button", { name: "Show the log" })).not.toHaveAttribute("aria-disabled");
  },
  "the banner comes and goes with the network, and the actions follow": async ({ page, example, expect }) => {
    const body = example("live");
    const region = body.getByRole("status");
    const deploy = body.getByRole("button", { name: "Deploy web-1" });
    await expect(region).toBeEmpty();
    await expect(deploy).not.toHaveAttribute("aria-disabled");
    await page.evaluate(() => {
      window.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("button")?.textContent === "Deploy web-1")
          document.body.dataset.deployed = "true";
      });
    });

    await page.context().setOffline(true);
    await expect(region).toContainText("You are offline");
    await expect(deploy).toHaveAttribute("aria-disabled", "true");
    // A disabled action still takes the focus and the click, and does nothing.
    await deploy.click({ force: true });
    await deploy.press("Enter");
    await expect(page.locator("body")).not.toHaveAttribute("data-deployed");

    await page.context().setOffline(false);
    await expect(region.getByText("You are offline")).toHaveCount(0);
    // The return is announced to a screen reader, not shown.
    await expect(region).toHaveText("You are back online");
    await expect(region.getByText("You are back online")).toHaveClass("t-sr-only");
    await expect(deploy).not.toHaveAttribute("aria-disabled");
    await deploy.click();
    await expect(page.locator("body")).toHaveAttribute("data-deployed", "true");
  },
});
