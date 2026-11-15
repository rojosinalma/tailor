/**
 * The browser for the checks: one pinned Chromium in a container, kept running between checks.
 * The checks connect to it, so every run uses the same browser build and the same fonts.
 */
import { type Browser, chromium } from "playwright";

const PLAYWRIGHT_VERSION = "1.65.1";
const IMAGE = `mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`;
const NAME = "tailor-checks-browser";
const PORT = Number(process.env.TAILOR_BROWSER_PORT ?? 39501);
const ENDPOINT = `ws://127.0.0.1:${PORT}/`;

async function tryConnect(): Promise<Browser | null> {
  try {
    return await chromium.connect(ENDPOINT, { timeout: 2000 });
  } catch {
    return null;
  }
}

async function docker(...args: string[]): Promise<number> {
  const child = Bun.spawn(["docker", ...args], { stdout: "ignore", stderr: "ignore" });
  return child.exited;
}

/** Connects to the browser server and starts its container first when it is not up. */
export async function connectBrowser(): Promise<Browser> {
  const running = await tryConnect();
  if (running) return running;
  await docker("rm", "-f", NAME);
  const started = await docker(
    "run",
    "-d",
    "--name",
    NAME,
    "--network",
    "host",
    "--ipc=host",
    IMAGE,
    "npx",
    "-y",
    `playwright@${PLAYWRIGHT_VERSION}`,
    "run-server",
    "--port",
    String(PORT),
    "--host",
    "127.0.0.1",
  );
  if (started !== 0) throw new Error(`Could not start the browser container (${IMAGE}). Is Docker running?`);
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const browser = await tryConnect();
    if (browser) return browser;
    await Bun.sleep(500);
  }
  throw new Error("The browser container did not answer within 60 seconds.");
}

/** Runs the jobs with at most `limit` at a time and returns their results in order. */
export async function pool<T, R>(
  items: readonly T[],
  limit: number,
  job: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      results[index] = await job(items[index] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export const WORKERS = Math.max(4, Math.min(24, navigator.hardwareConcurrency - 4));
