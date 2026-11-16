import type { Level } from "@tailor/packs/data/log-view/logic";
import { useEffect, useState } from "react";
import { defineExamples } from "../../examples";
import { type LogLine, LogView } from "./log-view";

const E = "\x1b";
const START = Date.parse("2026-11-15T10:00:00Z");
const HOSTS = ["web-1", "web-2", "nas", "db-1"];

const time = (i: number): string => new Date(START + i * 7000).toISOString().slice(11, 19);

const levelAt = (i: number): Level =>
  i % 17 === 5 ? "error" : i % 7 === 3 ? "warn" : i % 5 === 1 ? "debug" : "info";

function textAt(i: number, level: Level): string {
  const host = HOSTS[i % HOSTS.length];
  const ms = 20 + ((i * 37) % 900);
  switch (level) {
    case "error":
      return `${E}[1;31mfailed${E}[0m GET https://example.com/api/items/${i} from ${host}: timeout after ${E}[36m${ms * 10}ms${E}[0m`;
    case "warn":
      return `slow answer from ${host} in ${E}[33m${ms}ms${E}[0m ${E}[2m(limit 500ms)${E}[0m`;
    case "debug":
      return `cache ${i % 2 ? "hit" : "miss"} for key session:alice:${i} ${E}[2m${host}${E}[0m`;
    default:
      return i % 11 === 0
        ? `${E}[32mOK${E}[0m backup of ${host} done: 1,204 files, ${ms} MB, written to /srv/backup/${host}/2026-11-15/${i}.tar with checksum ${E}[35m${(i * 2654435761).toString(16).slice(-12)}${E}[0m`
        : `${E}[32mOK${E}[0m GET /api/items/${i} ${E}[34m200${E}[0m in ${ms}ms from ${host}`;
  }
}

/** `count` log lines with fixed times from 2026-11-15 10:00:00, levels and ANSI colours. */
const logLines = (count: number, from = 0): LogLine[] =>
  Array.from({ length: count }, (_, k) => {
    const i = from + k;
    const level = levelAt(i);
    return { id: `line-${i}`, time: time(i), level, text: textAt(i, level) };
  });

const lines = logLines(500);
const raw: LogLine[] = logLines(60).map((line) => ({
  id: line.id,
  text: `${line.time} ${line.level?.toUpperCase()} ${line.text}`,
}));

const LIVE_START = 30;
const LIVE_MORE = 40;

function Live() {
  const [shown, setShown] = useState(() => logLines(LIVE_START));
  useEffect(() => {
    const id = setInterval(() => {
      setShown((current) => {
        if (current.length >= LIVE_START + LIVE_MORE) {
          clearInterval(id);
          return current;
        }
        return [...current, ...logLines(1, current.length)];
      });
    }, 700);
    return () => clearInterval(id);
  }, []);
  return <LogView label="Live log" lines={shown} />;
}

export default defineExamples("log-view", [
  {
    id: "default",
    title: "500 lines",
    note: "Follow keeps the end in view; scroll up and it stops, and Jump to end comes back to it. The filter hides the other lines and marks the matches.",
    display: "frame",
    render: () => <LogView label="Service log" lines={lines} />,
  },
  {
    id: "live",
    title: "Lines that arrive",
    note: "A new line every 0.7 s while follow is on keeps the view at the end.",
    display: "frame",
    render: () => <Live />,
  },
  {
    id: "wrap",
    title: "Wrapped, in a narrow box",
    display: "frame",
    width: "sm",
    render: () => <LogView label="Wrapped log" lines={lines.slice(0, 80)} wrap />,
  },
  {
    id: "raw",
    title: "Plain text lines, follow off",
    note: "Without a level, a level word in the text gives the line its tone.",
    display: "frame",
    render: () => <LogView label="Plain log" lines={raw} follow={false} />,
  },
]);
