/**
 * The service worker and the page store, end to end, on a small app that each test serves under a folder
 * of its own. The worker files are real files in that folder: the browser fetches a worker for an update
 * check outside the page, where no route reaches. Routes serve the rest (the shell, the pages, an API, a
 * sign-in redirect) and cut the network. The page loads the HTML kit's pack script, so these tests drive the
 * HTML kit; the worker and the store in client.ts are the same for the React kit.
 */
import { mkdir, rm } from "node:fs/promises";
import type { Page } from "playwright";
import { at } from "../../../bin/lib/paths";
import { type BehaviourContext, behaviour } from "../../src/behaviour";

let workerScript: Promise<string> | null = null;
function buildWorker(): Promise<string> {
  workerScript ??= Bun.build({
    entrypoints: [at("core/packs/pwa/pwa/worker.ts")],
    format: "iife",
    target: "browser",
    minify: true,
  }).then(async (result) => {
    const output = result.outputs[0];
    if (!result.success || !output) throw new AggregateError(result.logs, "the worker did not build");
    return output.text();
  });
  return workerScript;
}

interface App {
  /** The folder of the app, from the site root: "/sw-test-…/". */
  readonly path: string;
  readonly base: string;
  /** The network is gone, for the page and for the worker. */
  offline: boolean;
  /** Gives out a new version of the worker file. */
  publish(version: string): Promise<void>;
}

interface AppOptions {
  /** The shell, relative to the app folder. */
  readonly shell?: readonly string[];
}

const pageHtml = (path: string, version: string, page: string): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>app ${version} ${page}</title>
<link rel="stylesheet" href="${path}app.css"></head>
<body><div class="t-pwa-update" data-t="pwa-update" role="status"></div>
<script>window.TAILOR_PWA = { worker: "${path}sw.js" };</script>
<script src="/tailor/tailor.js"></script>
<script src="/tailor/tailor-pwa.js"></script></body></html>`;

/** Serves the app, opens it and waits until its worker controls the page. */
async function openApp(page: Page, folder: string, options: AppOptions = {}, wait = true): Promise<App> {
  const path = `/${folder}/`;
  const base = new URL(path, page.url()).href;
  const dir = at("showcase/dist", folder);
  await mkdir(dir, { recursive: true });
  await Bun.write(`${dir}/tailor-sw.js`, await buildWorker());
  let version = "";
  const app: App = {
    path,
    base,
    offline: false,
    async publish(next) {
      version = next;
      const config = {
        version,
        shell: (options.shell ?? ["", "app.css"]).map((file) => path + file),
        offline: `${path}offline.html`,
      };
      await Bun.write(
        `${dir}/sw.js`,
        `importScripts("${path}tailor-sw.js");\ntailorServiceWorker(${JSON.stringify(config)});`,
      );
    },
  };
  await app.publish("v1");
  await page.context().route(`**${path}**`, async (route) => {
    if (app.offline) return route.abort("internetdisconnected");
    const { pathname } = new URL(route.request().url());
    const file = pathname.slice(path.length);
    if (file === "sw.js" || file === "tailor-sw.js") return route.continue();
    if (file === "app.css")
      return route.fulfill({ contentType: "text/css", body: `body { --version: "${version}"; }` });
    if (file === "api/hosts") return route.fulfill({ contentType: "application/json", body: '["web-1"]' });
    if (file === "offline.html")
      return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>offline page</title>" });
    // An access proxy that sends the visitor to its sign-in page.
    if (file === "redirected") return route.fulfill({ status: 302, headers: { location: `${path}signin` } });
    if (file === "signin")
      return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>sign in</title>" });
    return route.fulfill({ contentType: "text/html", body: pageHtml(path, version, `/${file}`) });
  });
  await page.goto(base);
  if (wait) await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  return app;
}

async function goOffline(page: Page, app: App): Promise<void> {
  app.offline = true;
  await page.context().setOffline(true);
}

const cachedFiles = (page: Page, app: App, version: string): Promise<string[]> =>
  page.evaluate(
    async ([name, path]) => {
      const cache = await caches.open(name);
      return (await cache.keys()).map((request) => new URL(request.url).pathname.slice(path.length)).sort();
    },
    [`tailor-${version}`, app.path] as const,
  );

const workerVersion = (page: Page): Promise<string> =>
  page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(String(event.data.version));
        navigator.serviceWorker.controller?.postMessage({ type: "version" }, [channel.port2]);
      }),
  );

let counter = 0;

/**
 * Runs a test on the HTML kit's turn, in a folder of its own that is removed after it. On the React kit's
 * turn there is nothing more to prove.
 */
const appTest =
  (test: (context: BehaviourContext, folder: string) => Promise<void>) =>
  async (context: BehaviourContext): Promise<void> => {
    if (context.kit !== "html") return;
    const folder = `sw-test-${process.pid}-${++counter}`;
    try {
      await test(context, folder);
    } finally {
      await rm(at("showcase/dist", folder), { recursive: true, force: true });
    }
  };

export default behaviour("pwa-update", {
  "the worker keeps the shell and the offline page at install": appTest(async ({ page, expect }, folder) => {
    const app = await openApp(page, folder);
    expect(await cachedFiles(page, app, "v1")).toEqual(["", "app.css", "offline.html"]);
    expect(await workerVersion(page)).toBe("v1");
  }),
  "with no network a page comes from the cache, else the offline page": appTest(
    async ({ page, expect }, folder) => {
      const app = await openApp(page, folder);
      await page.goto(`${app.base}hosts`);
      await goOffline(page, app);
      await page.goto(app.base);
      await expect(page).toHaveTitle("app v1 /");
      await page.goto(`${app.base}hosts`);
      await expect(page).toHaveTitle("app v1 /hosts");
      await page.goto(`${app.base}never-seen`);
      await expect(page).toHaveTitle("offline page");
    },
  ),
  "static files come from the cache, API calls are left alone": appTest(async ({ page, expect }, folder) => {
    const app = await openApp(page, folder);
    const api = (): Promise<string> =>
      page.evaluate(
        (url) =>
          fetch(url).then(
            () => "answered",
            () => "failed",
          ),
        `${app.base}api/hosts`,
      );
    expect(await api()).toBe("answered");
    await goOffline(page, app);
    await page.reload();
    const version = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--version"));
    expect(version).toBe('"v1"');
    expect(await api()).toBe("failed");
    expect(await cachedFiles(page, app, "v1")).not.toContain("api/hosts");
  }),
  "a redirect, such as a sign-in page, is never kept as the app": appTest(
    async ({ page, expect }, folder) => {
      const app = await openApp(page, folder);
      await page.goto(`${app.base}redirected`);
      await expect(page).toHaveTitle("sign in");
      expect(await cachedFiles(page, app, "v1")).not.toContain("redirected");
      await goOffline(page, app);
      await page.goto(`${app.base}redirected`);
      await expect(page).toHaveTitle("offline page");
    },
  ),
  "a shell file that redirects stops the install": appTest(async ({ page, expect }, folder) => {
    await openApp(page, folder, { shell: ["", "redirected"] }, false);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
    expect(await page.evaluate(() => caches.has("tailor-v1"))).toBe(false);
  }),
  "a new version shows the notice; Reload starts it": appTest(async ({ page, expect }, folder) => {
    const app = await openApp(page, folder);
    const notice = page.getByRole("status").filter({ hasText: "A new version is ready" });
    await expect(notice).toHaveCount(0);
    await app.publish("v2");
    await page.evaluate(() => (window.Tailor.pwa as { checkForUpdate(): Promise<void> }).checkForUpdate());
    await expect(notice).toBeVisible();
    // The new version waits: the page still runs the old one until Reload.
    expect(await workerVersion(page)).toBe("v1");
    await Promise.all([page.waitForEvent("load"), notice.getByRole("button", { name: "Reload" }).click()]);
    await expect(page).toHaveTitle("app v2 /");
    expect(await workerVersion(page)).toBe("v2");
    expect(await page.evaluate(() => caches.keys())).toEqual(["tailor-v2"]);
  }),
});
