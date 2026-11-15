import { behaviour } from "../../src/behaviour";

export default behaviour("relative-time", {
  "shows the distance, names the full date and updates on its own": async ({ page, example, expect }) => {
    await page.clock.install({ time: new Date("2026-11-15T12:00:00Z") });
    await page.reload();
    const time = example("fixed").locator("time");
    await expect(time).toHaveText("2 hours ago");
    await expect(time).toHaveAttribute("datetime", "2026-11-15T10:00:00.000Z");
    await expect(time).toHaveAttribute("aria-label", /November 15, 2026/);
    // The browser exposes the element with the role "time" and the full date as its name.
    const cdp = await page.context().newCDPSession(page);
    const tree = (await cdp.send("Accessibility.getFullAXTree")) as {
      nodes: { role?: { value: string }; name?: { value: string } }[];
    };
    expect(
      tree.nodes.some((n) => n.role?.value === "time" && /^November 15, 2026/.test(n.name?.value ?? "")),
    ).toBe(true);
    await page.clock.runFor(60 * 60_000);
    await expect(time).toHaveText("3 hours ago");
  },
  "a time less than a minute away is just now": async ({ page, example, expect }) => {
    await page.clock.install({ time: new Date("2026-11-15T10:00:30Z") });
    await page.reload();
    const time = example("fixed").locator("time");
    await expect(time).toHaveText("just now");
    await page.clock.runFor(60_000);
    await expect(time).toHaveText("1 minute ago");
  },
  "follows the locale": async ({ example, expect }) => {
    await expect(example("locale").locator("time")).toHaveText(/^vor \d+ Minuten$/);
  },
});
