import type { Tone } from "@tailor/core/spec";

/** Neutral sample services for the data table examples, made the same way on every build. */
export interface Service {
  readonly id: string;
  readonly name: string;
  readonly host: string;
  readonly status: "running" | "degraded" | "stopped";
  readonly image: string;
  readonly memory: number;
  readonly updated: string;
}

const NAMES = [
  "api",
  "web",
  "worker",
  "cache",
  "db",
  "queue",
  "auth",
  "search",
  "mail",
  "backup",
  "metrics",
  "proxy",
];
const HOSTS = ["nas", "web-1", "web-2", "db-1", "edge"];
const IMAGES: Record<string, string> = {
  api: "example/api",
  web: "nginx",
  worker: "example/worker",
  cache: "redis",
  db: "postgres",
  queue: "rabbitmq",
  auth: "example/auth",
  search: "opensearch",
  mail: "example/mail",
  backup: "example/backup",
  metrics: "prometheus",
  proxy: "haproxy",
};
const STATUSES: readonly Service["status"][] = [
  "running",
  "running",
  "running",
  "degraded",
  "running",
  "stopped",
];
const BASE = Date.parse("2026-11-15T11:00:00Z");

/** `count` services with fixed names, hosts, states and dates near 2026-11-15. */
export function services(count: number): Service[] {
  return Array.from({ length: count }, (_, i) => {
    const kind = NAMES[i % NAMES.length] ?? "api";
    const n = Math.floor(i / NAMES.length) + 1;
    const status = STATUSES[(i * 7 + n) % STATUSES.length] ?? "running";
    return {
      id: `${kind}-${n}`,
      name: `${kind}-${n}`,
      host: HOSTS[(i * 3 + n) % HOSTS.length] ?? "nas",
      status,
      image: `${IMAGES[kind]}:${1 + (n % 4)}.${(n * 3) % 10}`,
      memory: status === "stopped" ? 0 : 32 + ((i * 97) % 1900),
      updated: new Date(BASE - i * 47 * 60_000).toISOString(),
    };
  });
}

export const STATUS_TONE: Record<Service["status"], Tone> = {
  running: "success",
  degraded: "warning",
  stopped: "neutral",
};

export const STATUS_LABEL: Record<Service["status"], string> = {
  running: "Running",
  degraded: "Degraded",
  stopped: "Stopped",
};
