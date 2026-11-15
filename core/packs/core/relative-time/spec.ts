import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "relative-time",
  name: "Relative time",
  pack: "core",
  group: "display",
  description:
    'A point in time as "2 hours ago" or "in 3 days", kept up to date while the page is open. The full date is its accessible name.',
  root: "t-time",
  props: { date: [], locale: [] },
  html: "script",
});
