/**
 * The page side of the PWA pack, with no framework: registers the service worker and keeps the state of
 * install, update and network in one store that both kits read.
 */
import {
  INITIAL_STATE,
  installSteps,
  isSecureHost,
  nextState,
  type PwaState,
  shouldCheckForUpdate,
} from "./logic";

export type { InstallSteps, PwaState } from "./logic";

export interface PwaOptions {
  /** The address of the app's worker file, for example "/sw.js". Leave out for install and network only. */
  readonly worker?: string;
  /** The scope of the worker. Defaults to the folder of the worker file. */
  readonly scope?: string;
}

export interface PwaStore {
  get(): PwaState;
  subscribe(listener: () => void): () => void;
  /** Opens the browser's install prompt. Resolves true when the user installs. */
  install(): Promise<boolean>;
  /** Starts the waiting version and reloads the page once it controls the page. */
  applyUpdate(): void;
  /** Asks the server for a new version of the worker. */
  checkForUpdate(): Promise<void>;
}

/** The event that Chromium fires when the app can be installed. Not in the DOM types. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isPromptEvent = (event: Event): event is InstallPromptEvent =>
  typeof Reflect.get(event, "prompt") === "function";

/** A store that holds the given state and does nothing: for examples and an app's tests. */
export function fixedPwa(state: Partial<PwaState> = {}): PwaStore {
  const fixed: PwaState = { ...INITIAL_STATE, supported: true, ...state };
  return {
    get: () => fixed,
    subscribe: () => () => undefined,
    install: () => Promise.resolve(false),
    applyUpdate: () => undefined,
    checkForUpdate: () => Promise.resolve(),
  };
}

export function createPwa(options: PwaOptions = {}): PwaStore {
  const listeners = new Set<() => void>();
  const standalone = window.matchMedia("(display-mode: standalone)");
  const supported = "serviceWorker" in navigator && isSecureHost(location.protocol, location.hostname);
  let state: PwaState = {
    ...INITIAL_STATE,
    supported,
    offline: !navigator.onLine,
    installed: standalone.matches,
    steps: installSteps({
      promptEvent: "onbeforeinstallprompt" in window,
      iosStandalone: "standalone" in navigator,
      safariObject: "safari" in window,
      userAgent: navigator.userAgent,
    }),
  };
  let prompt: InstallPromptEvent | null = null;
  let registration: ServiceWorkerRegistration | null = null;
  let lastCheck = Date.now();
  let reloading = false;

  const set = (change: Partial<PwaState>): void => {
    const next = nextState(state, change);
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener();
  };

  window.addEventListener("online", () => set({ offline: false }));
  window.addEventListener("offline", () => set({ offline: true }));
  standalone.addEventListener("change", () => set({ installed: standalone.matches }));
  window.addEventListener("beforeinstallprompt", (event) => {
    if (!isPromptEvent(event)) return;
    // The app offers the install in its own menu, never as the browser's banner.
    event.preventDefault();
    prompt = event;
    set({ installable: true });
  });
  window.addEventListener("appinstalled", () => {
    prompt = null;
    set({ installable: false, installed: true });
  });

  const checkForUpdate = async (): Promise<void> => {
    lastCheck = Date.now();
    await registration?.update().catch(() => undefined);
  };

  if (supported && options.worker) {
    const { serviceWorker } = navigator;
    // A waiting worker is an update only when an older one controls the page; the first install is not.
    const watchWaiting = (reg: ServiceWorkerRegistration): void => {
      if (reg.waiting && serviceWorker.controller) set({ updateReady: true });
    };
    serviceWorker
      .register(options.worker, options.scope ? { scope: options.scope } : undefined)
      .then((reg) => {
        registration = reg;
        watchWaiting(reg);
        reg.addEventListener("updatefound", () => {
          const incoming = reg.installing;
          incoming?.addEventListener("statechange", () => {
            if (incoming.state === "installed") watchWaiting(reg);
          });
        });
      })
      .catch((error: unknown) => console.warn("tailor: the service worker did not register", error));
    serviceWorker.addEventListener("controllerchange", () => {
      if (!reloading) return;
      reloading = false;
      location.reload();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && shouldCheckForUpdate(lastCheck, Date.now()))
        void checkForUpdate();
    });
  }

  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async install() {
      const event = prompt;
      if (!event) return false;
      prompt = null;
      set({ installable: false });
      await event.prompt();
      const { outcome } = await event.userChoice;
      return outcome === "accepted";
    },
    applyUpdate() {
      const waiting = registration?.waiting;
      if (!waiting) return;
      reloading = true;
      waiting.postMessage({ type: "skip-waiting" });
    },
    checkForUpdate,
  };
}
