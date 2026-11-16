/**
 * The showcase site as an installable app, on the real network: no route answers for the browser, so the
 * worker fetches every file from the server as an installed copy would. Install, control, the site with no
 * network, the manifest and an update. Run after `bun bin/build`: `bun showcase/check-pwa.ts`.
 */
import { writeFileSync } from "node:fs";
import { expect } from "@playwright/test";
import type { Browser, BrowserContext, Page } from "playwright";
import { at } from "../bin/lib/paths";
import { serve } from "../bin/lib/serve";
import { connectBrowser } from "../checks/src/browser";

const WAIT = 15_000;
const SW_FILE = at("showcase/dist/sw.js");

interface WorkerConfig {
  version: string;
  shell: string[];
  offline: string;
}

function readConfig(source: string): WorkerConfig {
  const json = /tailorServiceWorker\((.*)\);/.exec(source)?.[1];
  if (!json) throw new Error("sw.js does not call tailorServiceWorker()");
  return JSON.parse(json) as WorkerConfig;
}

const original = await Bun.file(SW_FILE).text();
const config = readConfig(original);
const site = serve();
const browser: Browser = await connectBrowser();
const failures: string[] = [];
let passed = 0;

// Nothing may wait for ever: the whole run has a deadline too.
const deadline = setTimeout(() => {
  writeFileSync(SW_FILE, original);
  console.log("showcase pwa: the run did not end within 3 minutes");
  process.exit(1);
}, 180_000);

/** Runs the steps in order in one fresh context; a step that fails ends the ones after it. */
async function steps(
  list: [string, (page: Page, context: BrowserContext) => Promise<void>][],
): Promise<void> {
  const context = await browser.newContext({ reducedMotion: "reduce", colorScheme: "dark" });
  context.setDefaultTimeout(WAIT);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  try {
    for (const [index, [name, body]] of list.entries()) {
      try {
        await body(page, context);
        if (errors.length > 0) throw new Error(`page errors: ${errors.join("; ")}`);
        passed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${name}: ${message.split("\n").slice(0, 16).join("\n  ")}`);
        for (const [skipped] of list.slice(index + 1)) failures.push(`${skipped}: not run`);
        return;
      }
    }
  } finally {
    await context.close();
  }
}

/** The state of the page's worker registration, waited for in the page with a bound. */
const workerState = (page: Page): Promise<string> =>
  page.evaluate(
    (ms) =>
      Promise.race([
        navigator.serviceWorker.ready.then((reg) => reg.active?.state ?? "none"),
        new Promise<string>((resolve) => setTimeout(() => resolve("not ready"), ms)),
      ]),
    WAIT,
  );

/** The version of the worker that controls the page, as it answers itself. */
const controllerVersion = (page: Page): Promise<string> =>
  page.evaluate(
    (ms) =>
      new Promise<string>((resolve) => {
        const controller = navigator.serviceWorker.controller;
        if (!controller) return resolve("no controller");
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(String(event.data?.version));
        controller.postMessage({ type: "version" }, [channel.port2]);
        setTimeout(() => resolve("no answer"), ms);
      }),
    WAIT,
  );

const cachedFiles = (page: Page): Promise<Record<string, string[]>> =>
  page.evaluate(async () => {
    const result: Record<string, string[]> = {};
    // The cache ignores the fragment when it matches, but keeps the one of the request that last wrote it.
    for (const name of await caches.keys())
      result[name] = (await (await caches.open(name)).keys()).map(
        (request) => request.url.split("#")[0] ?? "",
      );
    return result;
  });

const title = (page: Page) => page.getByRole("heading", { level: 1 }).first();
const offlineNotice = (page: Page) => page.getByText("You are offline");

/** Polled: while the worker refreshes a file in the background, the cache lists it only once it is written. */
const expectCached = async (page: Page, version: string): Promise<void> => {
  const wanted = [...config.shell, config.offline].map((file) => new URL(file, site.url).href);
  await expect
    .poll(async () => {
      const files = (await cachedFiles(page))[`tailor-${version}`] ?? [];
      return wanted.filter((url) => !files.includes(url));
    })
    .toEqual([]);
};

await steps([
  [
    "a. the worker installs and keeps the shell",
    async (page) => {
      await page.goto(`${site.url}index.html`);
      await expect(title(page)).toBeVisible();
      expect(await workerState(page)).toBe("activated");
      expect(await page.evaluate(() => navigator.serviceWorker.ready.then((r) => r.active?.scriptURL))).toBe(
        `${site.url}sw.js`,
      );
      await expectCached(page, config.version);
    },
  ],
  [
    "b. after a reload the worker controls the page",
    async (page) => {
      await page.reload();
      await expect(title(page)).toBeVisible();
      expect(await controllerVersion(page)).toBe(config.version);
      // One online visit of a component page keeps its lazy examples (stale-while-revalidate).
      await page.goto(`${site.url}index.html#/components/button`);
      await expect(page.locator(".sc-example").first()).toBeAttached();
    },
  ],
  [
    "c. with no network the site opens",
    async (page, context) => {
      await context.setOffline(true);
      await page.goto(`${site.url}index.html`);
      await expect(title(page)).toBeVisible();
      await expect(offlineNotice(page)).toBeVisible();
      await page.goto(`${site.url}index.html#/components/button`);
      await expect(page.getByRole("heading", { level: 1, name: "Button", exact: true })).toBeVisible();
      await expect(page.locator(".sc-example").first()).toBeAttached();
      // An address that was never visited gets the cached app (spa: true).
      await page.goto(`${site.url}never-visited`);
      await expect(title(page)).toBeVisible();
      await expect(offlineNotice(page)).toBeVisible();
    },
  ],
  [
    "d. back online the offline notice goes",
    async (page, context) => {
      await context.setOffline(false);
      await expect(offlineNotice(page)).toHaveCount(0);
    },
  ],
  [
    "f. an update shows its notice and replaces the old version",
    async (page) => {
      await page.goto(`${site.url}index.html`);
      await expect(title(page)).toBeVisible();
      const next = `${config.version}-next`;
      try {
        await Bun.write(SW_FILE, original.replace(`"version":"${config.version}"`, `"version":"${next}"`));
        expect(readConfig(await Bun.file(SW_FILE).text()).version).toBe(next);
        await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
        const notice = page.getByRole("status").filter({ hasText: "A new version is ready" });
        await expect(notice).toBeVisible();
        await Promise.all([
          page.waitForEvent("load"),
          notice.getByRole("button", { name: "Reload" }).click(),
        ]);
        await expect(title(page)).toBeVisible();
        expect(await controllerVersion(page)).toBe(next);
        await expectCached(page, next);
        await expect.poll(async () => Object.keys(await cachedFiles(page))).toEqual([`tailor-${next}`]);
      } finally {
        await Bun.write(SW_FILE, original);
      }
    },
  ],
]);

await steps([
  [
    "e. the manifest names the app and its icons load",
    async (page) => {
      await page.goto(`${site.url}index.html`);
      const href = await page.locator('link[rel="manifest"]').getAttribute("href");
      const manifestUrl = new URL(href ?? "", site.url).href;
      const result = await page.evaluate(async (url) => {
        const manifest = (await (await fetch(url)).json()) as { name: string; icons: { src: string }[] };
        const icons = await Promise.all(
          manifest.icons.map(async ({ src }) => {
            const image = new Image();
            image.src = new URL(src, url).href;
            await image.decode();
            return image.naturalWidth > 0;
          }),
        );
        return { name: manifest.name, icons };
      }, manifestUrl);
      expect(result.name).toBe("tailor");
      expect(result.icons.length).toBeGreaterThan(0);
      expect(result.icons.every(Boolean)).toBe(true);
    },
  ],
]);

clearTimeout(deadline);
await browser.close();
site.stop();
console.log(`showcase pwa: ${passed} passed, ${failures.length} failed`);
for (const failure of failures) console.log(`  ✗ ${failure}`);
process.exit(failures.length > 0 ? 1 : 0);
