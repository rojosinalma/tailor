import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "relative-time",
  name: "Relative time",
  pack: "core",
  group: "display",
  description:
    'A point in time as "2 hours ago" or "in 3 days", kept up to date while the page is open. The full date is its description (title): the browser shows it on hover and a screen reader reads it after the text. No aria-label: the role "time" takes no name.',
  root: "t-time",
  props: { date: [], locale: [] },
  html: "script",
});
