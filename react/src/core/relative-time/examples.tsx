import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { RelativeTime } from "./relative-time";

const MINUTE = 60_000;
const fromNow = (minutes: number): string => new Date(Date.now() + minutes * MINUTE).toISOString();

export default defineExamples("relative-time", [
  {
    id: "past-future",
    title: "Past and future",
    note: "The text updates while the page is open. The full date and time is the accessible name.",
    render: () => (
      <Stack gap="1">
        <span>
          Deployed <RelativeTime date={fromNow(-120)} />
        </span>
        <span>
          Backup ran <RelativeTime date={fromNow(-3 * 24 * 60)} />
        </span>
        <span>
          Certificate renews <RelativeTime date={fromNow(3 * 24 * 60 + 5)} />
        </span>
        <span>
          Updated <RelativeTime date={new Date()} />
        </span>
      </Stack>
    ),
  },
  {
    id: "fixed",
    title: "A fixed date",
    render: () => (
      <span>
        Host nas added <RelativeTime date="2026-11-15T10:00:00Z" />
      </span>
    ),
  },
  {
    id: "locale",
    title: "In another language",
    render: () => (
      <span>
        Zuletzt gesehen <RelativeTime date={fromNow(-45)} locale="de" />
      </span>
    ),
  },
]);
