import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { RelativeTime } from "./relative-time";

// Fixed dates near 2026-11-15, so the pages of both kits stay the same whenever they are built.

export default defineExamples("relative-time", [
  {
    id: "past-future",
    title: "Past and future",
    note: "The text updates while the page is open. The full date and time is the accessible name. The dates are near November 15, 2026.",
    render: () => (
      <Stack gap="1">
        <span>
          Deployed <RelativeTime date={"2026-11-15T10:00:00Z"} />
        </span>
        <span>
          Backup ran <RelativeTime date={"2026-11-12T12:00:00Z"} />
        </span>
        <span>
          Certificate renews <RelativeTime date={"2026-11-18T12:05:00Z"} />
        </span>
        <span>
          Updated <RelativeTime date={"2026-11-15T11:59:40Z"} />
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
        Zuletzt gesehen <RelativeTime date={"2026-11-15T11:15:00Z"} locale="de" />
      </span>
    ),
  },
]);
