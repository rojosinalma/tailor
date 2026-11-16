/**
 * The service worker of an app, built to its own file (tailor-sw.js). The app serves a small file at the
 * root of its scope that loads this one and passes its config:
 *
 *   importScripts("/tailor/js/tailor-sw.js");
 *   tailorServiceWorker({ version: "2026-11-15-1", shell: ["/", "/tailor/css/tailor.css"], offline: "/offline.html" });
 *
 * The types of the worker scope are declared here, not taken from the WebWorker lib: that lib would change
 * the global types of every page file in the project.
 */
import {
  cacheName,
  isCacheable,
  navigationFallbacks,
  oldCaches,
  precacheList,
  strategyFor,
  type WorkerConfig,
  type WorkerSettings,
  workerSettings,
} from "./logic";

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEvent extends ExtendableEvent {
  readonly request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  readonly data: unknown;
  readonly ports: readonly MessagePort[];
  readonly source: { postMessage(message: unknown): void } | null;
}

interface WorkerScope {
  skipWaiting(): Promise<void>;
  readonly clients: { claim(): Promise<void> };
  addEventListener(type: "install" | "activate", listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: "fetch", listener: (event: FetchEvent) => void): void;
  addEventListener(type: "message", listener: (event: ExtendableMessageEvent) => void): void;
  tailorServiceWorker?: (config: WorkerConfig) => void;
}

const scope = globalThis as unknown as WorkerScope;

async function keep(cache: Cache, key: Request | string, response: Response): Promise<void> {
  if (isCacheable(response)) await cache.put(key, response.clone());
}

async function precache(settings: WorkerSettings): Promise<void> {
  // Every file first, then the cache: a failed install leaves no cache behind.
  const responses = await Promise.all(
    precacheList(settings).map(async (file) => {
      const response = await fetch(file, { cache: "reload" });
      // A sign-in redirect of an access proxy or an error page is never kept as the app.
      if (!isCacheable(response)) throw new Error(`tailor-sw: ${file} answered ${response.status}`);
      return [file, response] as const;
    }),
  );
  const cache = await caches.open(cacheName(settings.version));
  await Promise.all(responses.map(([file, response]) => cache.put(file, response)));
}

async function networkFirst(event: FetchEvent, settings: WorkerSettings): Promise<Response> {
  const cache = await caches.open(cacheName(settings.version));
  const network = fetch(event.request).then(async (response) => {
    await keep(cache, event.request, response);
    return response;
  });
  // The cache is kept up to date even when the answer comes after the timeout.
  event.waitUntil(network.catch(() => undefined));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), settings.timeout);
  });
  const answer = await Promise.race([network.catch(() => null), timeout]);
  clearTimeout(timer);
  if (answer) return answer;
  for (const key of navigationFallbacks(event.request.url, settings)) {
    const cached = await cache.match(key, { ignoreSearch: key !== event.request.url });
    if (cached) return cached;
  }
  return network;
}

async function staleWhileRevalidate(event: FetchEvent, settings: WorkerSettings): Promise<Response> {
  const cache = await caches.open(cacheName(settings.version));
  const cached = await cache.match(event.request);
  const network = fetch(event.request).then(async (response) => {
    await keep(cache, event.request, response);
    return response;
  });
  if (!cached) return network;
  event.waitUntil(network.catch(() => undefined));
  return cached;
}

function tailorServiceWorker(config: WorkerConfig): void {
  const settings = workerSettings(config);

  scope.addEventListener("install", (event) => {
    event.waitUntil(precache(settings));
  });

  scope.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(oldCaches(names, settings.version).map((name) => caches.delete(name))))
        .then(() => scope.clients.claim()),
    );
  });

  scope.addEventListener("fetch", (event) => {
    const { request } = event;
    const strategy = strategyFor(request, location.origin, settings);
    if (strategy === "network-first") event.respondWith(networkFirst(event, settings));
    else if (strategy === "stale-while-revalidate") event.respondWith(staleWhileRevalidate(event, settings));
  });

  scope.addEventListener("message", (event) => {
    const type =
      typeof event.data === "object" && event.data !== null ? Reflect.get(event.data, "type") : null;
    if (type === "skip-waiting") event.waitUntil(scope.skipWaiting());
    else if (type === "version") {
      const reply = { type: "version", version: settings.version };
      const port = event.ports[0];
      if (port) port.postMessage(reply);
      else event.source?.postMessage(reply);
    }
  });
}

scope.tailorServiceWorker = tailorServiceWorker;
