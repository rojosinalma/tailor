import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "history-bars",
  name: "History bars",
  pack: "core",
  group: "display",
  description:
    "A row of thin equal bars, one per period, each coloured by its tone, such as the uptime of the last 30 days. A list with an accessible name; each bar says its period in visually hidden text.",
  root: "t-history",
  parts: { "t-history-bar": "one period; its tone sets the colour" },
  props: { size: ["sm", "md"] },
  html: "markup",
});
