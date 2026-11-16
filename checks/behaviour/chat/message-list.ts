import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

const metrics = (log: Locator) =>
  log.evaluate((el) => ({ top: el.scrollTop, end: el.scrollHeight - el.clientHeight }));

export default behaviour("message-list", {
  "at the end, the view stays pinned while a message streams in": async ({ example, expect }) => {
    const body = example("live");
    const log = body.getByRole("log", { name: "Live thread" });
    await expect.poll(async () => (await metrics(log)).end).toBeGreaterThan(0);
    await expect
      .poll(async () => {
        const m = await metrics(log);
        return m.end - m.top;
      })
      .toBeLessThan(2);
    await body.getByRole("button", { name: "Receive a message" }).click();
    const reply = body.getByRole("article").last();
    await expect(reply).toHaveAttribute("aria-busy", "true");
    await expect(reply).not.toHaveAttribute("aria-busy", "true");
    await expect(reply).toContainText("as expected.");
    await expect
      .poll(async () => {
        const m = await metrics(log);
        return m.end - m.top;
      })
      .toBeLessThan(2);
    await expect(body.getByRole("button", { name: /New messages/ })).toHaveCount(0);
  },
  "scrolled up, the view does not move and a button leads to the new messages": async ({
    example,
    expect,
  }) => {
    const body = example("live");
    const log = body.getByRole("log", { name: "Live thread" });
    await expect.poll(async () => (await metrics(log)).end).toBeGreaterThan(100);
    await log.evaluate((el) => el.scrollTo(0, 40));
    await expect.poll(async () => (await metrics(log)).top).toBe(40);
    await body.getByRole("button", { name: "Receive a message" }).click();
    await expect(body.getByRole("article").last()).toContainText("as expected.");
    expect((await metrics(log)).top).toBe(40);
    const jump = body.getByRole("button", { name: /New messages/ });
    await expect(jump).toHaveText(/New messages\s*1/);
    await jump.click();
    await expect
      .poll(async () => {
        const m = await metrics(log);
        return m.end - m.top;
      })
      .toBeLessThan(2);
    await expect(jump).toHaveCount(0);
    await expect(log).toBeFocused();
  },
  "loading older messages at the top keeps the reading position": async ({ example, expect }) => {
    const body = example("older");
    const log = body.getByRole("log", { name: "Thread with older messages" });
    await expect.poll(async () => (await metrics(log)).end).toBeGreaterThan(0);
    const first = body.getByRole("article").first();
    await expect(first).toContainText("Is the web-1 deploy");
    const target = body.getByRole("article", { name: "alice, 4:02 PM" });
    const offset = () =>
      target.evaluate((el) => {
        const log = el.closest("[role=log]");
        return (
          el.getBoundingClientRect().top - (log?.getBoundingClientRect().top ?? 0) + (log?.scrollTop ?? 0)
        );
      });
    // Its distance from the top of the content: where it shows once the view is at the top.
    const before = await offset();
    await log.evaluate((el) => el.scrollTo(0, 0));
    await expect(body.getByRole("article").first()).toContainText("Who owns the deploy");
    const shown = () =>
      target.evaluate(
        (el) => el.getBoundingClientRect().top - (el.closest("[role=log]")?.getBoundingClientRect().top ?? 0),
      );
    await expect.poll(async () => Math.abs((await shown()) - before)).toBeLessThan(2);
    expect((await metrics(log)).top).toBeGreaterThan(0);
  },
  "messages of the same author group under one name and avatar, with day separators": async ({
    example,
    expect,
  }) => {
    const body = example("thread");
    await expect(body.getByRole("article", { name: "bob, 10:01 AM" })).toHaveCount(2);
    await expect(body.getByRole("img", { name: "bob" })).toHaveCount(2);
    await expect(body.locator("article[data-group-start]")).toHaveCount(10);
    await expect(body.getByText("Today", { exact: true })).toBeVisible();
    await expect(body.getByText("Nov 14, 2026", { exact: true })).toHaveCount(1);
    await expect(body.getByRole("article", { name: "You, 10:00 AM" })).toHaveAttribute("data-role", "self");
    await expect(body.getByRole("log", { name: "Deploy of web-1" })).toHaveAttribute("aria-live", "polite");
  },
  "message actions show on focus": async ({ page, example, expect }) => {
    const body = example("thread");
    const message = body.getByRole("article", { name: "alice, 10:13 AM" });
    const toolbar = message.getByRole("toolbar", { name: "Message actions" });
    await expect(toolbar).toHaveCSS("opacity", "0");
    await message.getByRole("button", { name: "Copy" }).focus();
    await expect(toolbar).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Thanks, nice work!");
  },
  "a failed message offers Try again": async ({ example, expect }) => {
    const body = example("failed");
    const message = body.getByRole("article", { name: "You, 11:02 AM" });
    await expect(message).toContainText("Not sent");
    await message.getByRole("button", { name: "Try again" }).click();
    await expect(message).toHaveAttribute("data-state", "sending");
    await expect(message).not.toHaveAttribute("data-state", /./);
    await expect(message.getByText("Not sent")).toHaveCount(0);
  },
  "sending from the composer shows the message, then a reply streams in": async ({ example, expect }) => {
    const body = example("conversation");
    const box = body.getByRole("textbox", { name: "Message" });
    await box.fill("Is the backup done?");
    await box.press("Enter");
    await expect(box).toHaveValue("");
    await expect(body.getByRole("article", { name: "You, 10:19 AM" }).last()).toContainText(
      "Is the backup done?",
    );
    await expect(body.getByRole("article").last()).toContainText("as expected.");
    await body.getByRole("button", { name: "Not now" }).click();
    await expect(body.getByRole("region", { name: "Waiting for you" })).toBeHidden();
  },
});
