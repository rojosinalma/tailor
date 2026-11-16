/**
 * The showcase site's own checks: every component page, both kits, the address and storage, the search,
 * the shell demos, sideways scroll and accessibility. Run after `bun bin/build`: `bun showcase/check.ts`.
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Browser, Frame, Page } from "playwright";
import { serve } from "../bin/lib/serve";
import { connectBrowser, pool, WORKERS } from "../checks/src/browser";
import { packById } from "../core/src/packs";
import { SPECS } from "../core/src/registry.gen";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const isShell = (pack: string): boolean => packById(pack)?.shell === true;
const pathOf = (id: string, pack: string): string => `${isShell(pack) ? "shells" : "components"}/${id}`;

const site = serve();
const browser: Browser = await connectBrowser();
const failures: string[] = [];
let passed = 0;

/** Opens a fresh page (own storage) and collects its errors; the test fails on any of them. */
async function test(
  name: string,
  body: (page: Page) => Promise<void>,
  viewport = { width: 1440, height: 900 },
): Promise<void> {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  try {
    await body(page);
    if (errors.length > 0) throw new Error(`page errors: ${errors.join("; ")}`);
    passed++;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message.split("\n").slice(0, 6).join("\n  ")}`);
  } finally {
    await context.close();
  }
}

const open = async (page: Page, hash: string): Promise<void> => {
  await page.goto(`${site.url}index.html#/${hash}`);
  await page.locator(".t-page-title").first().waitFor();
};

/** The frame of the iframe with the given accessible name part, once its document has loaded. */
async function frameOf(page: Page, index = 0): Promise<Frame> {
  const element = page.locator("iframe.sc-frame").nth(index);
  await element.waitFor();
  const frame = await (await element.elementHandle())?.contentFrame();
  if (!frame) throw new Error("no frame");
  await frame.waitForLoadState("load");
  return frame;
}

// 1. Every component has a page in the React kit with at least one example and no error.
await pool(SPECS, WORKERS, (spec) =>
  test(`page ${spec.id}`, async (page) => {
    await open(page, `${pathOf(spec.id, spec.pack)}?kit=react`);
    await expect(page.locator(".sc-example").first()).toBeAttached({ timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1, name: spec.name, exact: true })).toBeVisible();
  }),
);

// 2. The HTML kit: one frame per example with content, and a note for a React-only component.
await test("html kit frames", async (page) => {
  await open(page, "components/button?kit=html");
  const frames = page.locator("iframe.sc-frame");
  await expect(frames.first()).toBeVisible();
  const frame = await frameOf(page);
  await expect(frame.locator(".sc-example .t-btn").first()).toBeVisible();
  await expect.poll(async () => (await frames.first().boundingBox())?.height ?? 0).toBeGreaterThan(20);
});

const reactOnly = SPECS.find((s) => s.html === "none");
if (reactOnly)
  await test("html kit note", async (page) => {
    await open(page, `${pathOf(reactOnly.id, reactOnly.pack)}?kit=html`);
    await expect(page.locator(".t-empty-title", { hasText: "React kit only" })).toBeVisible();
    await expect(page.locator("iframe.sc-frame")).toHaveCount(isShell(reactOnly.pack) ? 1 : 0);
  });

// 3. Kit, skin, palette, mode and size survive a reload, through the address and through storage.
await test("view in address and storage", async (page) => {
  await open(page, "components/button?kit=html&skin=primer&palette=nord&mode=light&size=phone");
  const expectView = async (): Promise<void> => {
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-skin", "primer");
    await expect(html).toHaveAttribute("data-palette", "nord");
    await expect(html).toHaveAttribute("data-mode", "light");
    await expect(page.getByRole("radio", { name: "HTML" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Phone 390" })).toBeChecked();
  };
  await expectView();
  await page.reload();
  await page.locator(".t-page-title").waitFor();
  await expectView();
  // Storage: an address without the parameters, in a new load, gets them back.
  await page.goto("about:blank");
  await open(page, "components/badge");
  await expectView();
  await expect(page).toHaveURL(/kit=html/);
  await expect(page).toHaveURL(/skin=primer/);
  // A change in the site goes into the address and into the frames.
  await page.getByRole("radio", { name: "Fit" }).click();
  await expect(page).toHaveURL(/size=fit/);
  await page.getByRole("button", { name: "Dark mode" }).first().click();
  await expect(page).toHaveURL(/mode=dark/);
  const frame = await frameOf(page);
  await expect(frame.locator("html")).toHaveAttribute("data-mode", "dark");
});

// 4. The search filters the navigation; / focuses it.
await test("search filters the navigation", async (page) => {
  await open(page, "");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Button", exact: true })).toBeVisible();
  await page.keyboard.press("/");
  const field = page.getByRole("searchbox", { name: "Filter components" });
  await expect(field).toBeFocused();
  await field.fill("date");
  await expect(nav.getByRole("link", { name: /^Date/ }).first()).toBeVisible();
  await expect(nav.getByRole("link", { name: "Button", exact: true })).toHaveCount(0);
});

// 5. Each shell page shows its demo at the three sizes, and the demo's navigation works inside it.
const DEVICES = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] } as const;
const shells = SPECS.filter((s) => isShell(s.pack));
await pool(
  shells.flatMap((s) =>
    (["react", "html"] as const).filter((k) => k === "react" || s.html !== "none").map((kit) => ({ s, kit })),
  ),
  WORKERS,
  ({ s, kit }) =>
    test(`shell ${s.id} (${kit})`, async (page) => {
      for (const [size, [width, height]] of Object.entries(DEVICES)) {
        await open(page, `shells/${s.id}?kit=${kit}&size=${size}`);
        const element = page.locator("iframe.sc-frame").first();
        await expect(element).toHaveAttribute("width", String(width));
        await expect(element).toHaveAttribute("height", String(height));
        const frame = await frameOf(page);
        await expect(frame.locator(".t-shell, .sc-demo-fill").first()).toBeVisible();
      }
      if (s.id !== "topnav" && s.id !== "sidenav" && s.id !== "bare") return;
      const frame = await frameOf(page);
      if (s.id === "bare") {
        await frame.getByLabel("Email").fill("alice@example.com");
        await frame.getByLabel("Password").fill("secret");
        await frame.getByRole("button", { name: "Sign in" }).click();
        await expect(frame.getByText("Signed in")).toBeVisible();
        return;
      }
      await expect(frame.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
      await frame
        .getByRole("link", { name: /^Services/ })
        .first()
        .click();
      await expect(frame.getByRole("heading", { level: 1, name: "Services" })).toBeVisible();
      await expect(frame.getByRole("link", { name: /^Services/ }).first()).toHaveAttribute(
        "aria-current",
        "page",
      );
      await frame.getByRole("link", { name: "api", exact: true }).click();
      await expect(frame.getByRole("heading", { level: 1, name: "api" })).toBeVisible();
      await frame
        .getByRole("link", { name: /^Reports/ })
        .first()
        .click();
      await expect(frame.getByText("404")).toBeAttached();
    }),
);

// A theme change inside a demo comes back to the site, and one in the site goes into the demo.
for (const kit of ["react", "html"] as const)
  await test(`theme in step with the demo (${kit})`, async (page) => {
    await open(page, `shells/sidenav?kit=${kit}&size=desktop&mode=dark`);
    const frame = await frameOf(page);
    await frame.getByRole("button", { name: "Light mode" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
    await expect(page).toHaveURL(/mode=light/);
    await page.locator(".t-shell-sidebar").first().getByRole("button", { name: "Dark mode" }).click();
    await expect(frame.locator("html")).toHaveAttribute("data-mode", "dark");
    await expect(frame.getByRole("button", { name: "Light mode" }).first()).toBeAttached();
  });

// 6. No sideways scroll at a phone, a tablet and a desktop width.
for (const width of [390, 820, 1440])
  for (const hash of ["", "components/table", "shells/sidenav?size=desktop"])
    await test(
      `no sideways scroll at ${width} (${hash || "overview"})`,
      async (page) => {
        await open(page, hash);
        await page.waitForTimeout(300);
        const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        expect(scroll).toBeLessThanOrEqual(inner);
      },
      { width, height: 900 },
    );

// 7. Accessibility: WCAG 2.2 A/AA on the overview, a component page and a shell page.
for (const hash of ["", "components/button", "shells/sidenav"])
  await test(`axe ${hash || "overview"}`, async (page) => {
    await open(page, hash);
    await page.waitForTimeout(500);
    const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    const found = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(found).toEqual([]);
  });

await browser.close();
site.stop();
console.log(`showcase: ${passed} passed, ${failures.length} failed`);
for (const failure of failures) console.log(`  ✗ ${failure}`);
process.exit(failures.length > 0 ? 1 : 0);
