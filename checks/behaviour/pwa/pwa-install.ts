import { behaviour } from "../../src/behaviour";

export default behaviour("pwa-install", {
  "shows the button when the browser offers its prompt": async ({ example, expect }) => {
    await expect(example("prompt").getByRole("button", { name: "Install app" })).toBeVisible();
  },
  "with no prompt the button opens the manual steps": async ({ page, example, expect }) => {
    const button = example("steps").getByRole("button", { name: "Install app" });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Install this app" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Tap the Share button, then choose “Add to Home Screen”.");
    await dialog.getByRole("button", { name: "OK" }).click();
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  },
  "is an item of a menu": async ({ page, example, expect }) => {
    await example("menu").getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("menuitem", { name: "Install app" })).toBeVisible();
  },
  "the browser's install prompt shows the button, which opens it": async ({ page, example, expect }) => {
    const button = example("live").getByRole("button", { name: "Install app" });
    await expect(button).toHaveCount(0);
    await page.evaluate(() => {
      const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: () => {
          document.body.dataset.prompted = "true";
          return Promise.resolve();
        },
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      window.dispatchEvent(event);
    });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator("body")).toHaveAttribute("data-prompted", "true");
    // The prompt is used once; the button leaves.
    await expect(button).toHaveCount(0);
  },
});
