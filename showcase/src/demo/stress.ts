/**
 * Hostile sample content for the stress pages: what real apps send and polite demo data never does.
 * Neutral, made-up values only.
 */
import type { LogLine } from "@tailor/react/data/log-view/log-view";
import type { DetailService } from "@tailor/react/layouts/detail-page/detail-page";
import { SERVICE_ROWS, type ServiceRow } from "@tailor/react/layouts/list-page/list-page";
import type { RenderResult } from "@tailor/react/layouts/tool-page/tool-page";

/** A name with no place to break a line: underscores and digits, as generated names often are. */
export const UNBROKEN = "build_artifact_cache_replica_eu_west_3_2026_11_15_000042";

/** A picture of the given size, as the server would send it: a grid, a frame and its size in the middle. */
export function picture(width: number, height: number, label: string): string {
  const step = Math.round(Math.min(width, height) / 10);
  const lines: string[] = [];
  for (let x = step; x < width; x += step) lines.push(`M${x} 0V${height}`);
  for (let y = step; y < height; y += step) lines.push(`M0 ${y}H${width}`);
  const font = Math.round(Math.min(width, height) / 16);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="#eef1f5"/>` +
      `<path d="${lines.join("")}" stroke="#c9d1dc" stroke-width="${Math.max(1, step / 60)}"/>` +
      `<rect x="${step}" y="${step}" width="${width - 2 * step}" height="${height - 2 * step}" fill="#dfe6ee" stroke="#33465c" stroke-width="${step / 8}"/>` +
      `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="sans-serif" font-size="${font}" fill="#33465c">${label}</text>` +
      "</svg>",
  )}`;
}

const LONG_FILE = `north_wing_ground_floor_plan_revision_${UNBROKEN}.svg`;

export const LARGE_RESULT: RenderResult = {
  file: LONG_FILE,
  src: picture(6000, 4000, "6000 × 4000"),
  width: 6000,
  height: 4000,
  facts: `${LONG_FILE} · 6000 × 4000 · PNG · 18.4 MB`,
};

export const TALL_RESULT: RenderResult = {
  file: "stair-section.svg",
  src: picture(900, 6000, "900 × 6000"),
  width: 900,
  height: 6000,
  facts: "900 × 6000 · PNG · 2.1 MB",
};

export const RENDER_FAILURE = `The renderer stopped at line 4,112 of ${LONG_FILE}: the path element has 2,400,000 points, more than the limit of 1,000,000. Simplify the drawing or split it into parts, then render again.`;

const HOSTS = ["web-1", "web-2", "db-1", "nas", "edge"];
const STATES: ServiceRow["status"][] = ["running", "running", "running", "degraded", "stopped"];

/** 300 services; every seventh has a name and an image with no place to break. */
export const MANY_ROWS: readonly ServiceRow[] = [
  ...SERVICE_ROWS,
  ...Array.from({ length: 300 - SERVICE_ROWS.length }, (_, i): ServiceRow => {
    const long = i % 7 === 0;
    const name = long ? `${UNBROKEN}_${i}` : `worker-${String(i + 1).padStart(3, "0")}`;
    return {
      id: `svc-${i}`,
      name,
      host: HOSTS[i % HOSTS.length] ?? "web-1",
      status: STATES[i % STATES.length] ?? "running",
      image: long ? `registry.example.com/${UNBROKEN}/${UNBROKEN}:2026.11.15` : `example/worker:3.${i % 9}.0`,
      memory: (i * 37) % 4096,
      updated: new Date(Date.UTC(2026, 10, 15, 11, 0) - i * 3_600_000).toISOString(),
    };
  }),
];

export const SERVICES_ERROR = `The console could not reach the registry at registry.example.com:5000 (connection refused after 3 tries). Request id ${UNBROKEN}.`;

export const LONG_SERVICE: DetailService = {
  id: UNBROKEN,
  name: UNBROKEN,
  host: `edge_gateway_${UNBROKEN}`,
  image: `registry.example.com/${UNBROKEN}/${UNBROKEN}:2026.11.15`,
  address: `${UNBROKEN}.internal.example.com:8080`,
  owner: "alice",
  created: "2026-03-02T09:00:00Z",
  deployed: "2026-11-15T11:48:00Z",
};

/** The details of a failure: a trace with long lines and a path with no break. */
export const ERROR_DETAILS = [
  `Error: the request to /api/services/${UNBROKEN}/settings failed with 502 Bad Gateway`,
  ...Array.from(
    { length: 24 },
    (_, i) =>
      `    at handler_${i} (/srv/app/node_modules/${UNBROKEN}/dist/${UNBROKEN}_${i}.js:${120 + i}:${7 + i})`,
  ),
].join("\n");

/** A file of about 2,000 lines, some of them far wider than any screen. */
export const LONG_FILE_PATH = `deploy/environments/production/${UNBROKEN}/compose.yaml`;

export const LONG_CODE = Array.from({ length: 400 }, (_, i) =>
  [
    `  service-${i}:`,
    `    image: registry.example.com/${UNBROKEN}/service-${i}:2026.11.15`,
    `    command: ["/bin/run", "--config=/etc/${UNBROKEN}/service-${i}.yaml", "--log-level=debug", "--listen=0.0.0.0:${8000 + i}", "--upstream=http://${UNBROKEN}.internal.example.com:${9000 + i}/api/v2/endpoint"]`,
    `    restart: unless-stopped`,
    "",
  ].join("\n"),
).join("\n");

const OUTPUT = [
  "web  | starting nginx 1.27",
  `api  | connected to postgres://api@${UNBROKEN}.internal.example.com:5432/api?sslmode=require&application_name=${UNBROKEN}`,
  "db   | database system is ready to accept connections",
  `api  | slow answer from db in 640ms for query ${UNBROKEN}${UNBROKEN}`,
];

export const LONG_LOG: LogLine[] = Array.from({ length: 400 }, (_, i) => ({
  id: `out-${i}`,
  time: `11:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
  level: i % 9 === 8 ? "error" : i % 4 === 3 ? "warn" : "info",
  text: OUTPUT[i % OUTPUT.length] ?? "",
}));
