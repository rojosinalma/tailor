import { useCallback, useState } from "react";
import { Badge } from "../../core/badge/badge";
import { Cluster } from "../../core/cluster/cluster";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { LongList } from "./long-list";

interface Event {
  readonly id: string;
  readonly host: string;
  readonly text: string;
  readonly note?: string;
}

const HOSTS = ["nas", "web-1", "web-2", "db-1"];
const TEXTS = [
  "Backup finished",
  "Certificate renewed",
  "Disk check passed",
  "Service restarted",
  "User alice signed in",
];

/** `count` events with fixed texts; every third has a second line, so rows have different heights. */
const events = (count: number, from = 0): Event[] =>
  Array.from({ length: count }, (_, i) => {
    const n = from + i;
    return {
      id: `event-${n + 1}`,
      host: HOSTS[n % HOSTS.length] ?? "nas",
      text: `${TEXTS[n % TEXTS.length]} (#${n + 1})`,
      note:
        n % 3 === 0
          ? "The job ran on schedule and wrote its report to example.com/reports, where the last thirty runs are kept."
          : undefined,
    };
  });

const many = events(10_000);

const row = (event: Event) => (
  <Stack gap="1">
    <Cluster gap="2">
      <Badge>{event.host}</Badge>
      {event.text}
    </Cluster>
    {event.note}
  </Stack>
);

const PAGE = 50;
const LIMIT = 300;

function LoadMore() {
  const [items, setItems] = useState(() => events(PAGE));
  const more = useCallback(() => {
    // A stand-in for a request.
    setTimeout(() => setItems((current) => [...current, ...events(PAGE, current.length)]), 300);
  }, []);
  return (
    <LongList
      label="Events, loaded in steps"
      items={items}
      itemKey={(e) => e.id}
      renderItem={row}
      onEndReached={items.length < LIMIT ? more : undefined}
    />
  );
}

export default defineExamples("long-list", [
  {
    id: "default",
    title: "10,000 rows of different heights",
    note: "Only the rows in view are in the page; each row is measured as it comes into view.",
    display: "frame",
    render: () => <LongList label="Events" items={many} itemKey={(e) => e.id} renderItem={row} />,
  },
  {
    id: "fixed",
    title: "Rows of one height",
    display: "frame",
    render: () => (
      <LongList
        label="Hosts"
        items={many}
        itemKey={(e) => e.id}
        rowHeight={44}
        renderItem={(e) => `${e.host} · ${e.text}`}
      />
    ),
  },
  {
    id: "more",
    title: "Loads more at the end",
    note: "onEndReached loads the next rows; the spinner row shows until there are no more.",
    display: "frame",
    render: () => <LoadMore />,
  },
]);
