import type { Level } from "@tailor/packs/data/log-view/logic";
import { useState } from "react";
import { Button } from "../../core/button/button";
import { Page } from "../../core/page/page";
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

const LIVE_ID = "live-log";
/** The line that "Add a line" appends, the same in both kits. */
const ADDED = {
  time: "10:05:00",
  level: "info",
  text: `${E}[32mOK${E}[0m deploy of web-1 done in 42s`,
} as const;

/** A button appends a line: React state here; in the HTML kit, data-t-append on the same button. */
function Live() {
  const [shown, setShown] = useState(() => logLines(30));
  const add = (): void => setShown((current) => [...current, { ...ADDED, id: `added-${current.length}` }]);
  return (
    <Page
      title="Deploys"
      mode="fill"
      actions={
        <Button
          size="sm"
          onClick={add}
          data-t-append={`#${LIVE_ID}`}
          data-text={ADDED.text}
          data-time={ADDED.time}
          data-level={ADDED.level}
        >
          Add a line
        </Button>
      }
    >
      <LogView label="Live log" id={LIVE_ID} lines={shown} />
    </Page>
  );
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
    note: 'Each new line keeps the view at the end while follow is on. HTML kit: a button with data-t-append="#id" and data-text (data-time, data-level) appends to the log with that id.',
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
