import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "stat",
  name: "Stat",
  pack: "core",
  group: "display",
  description:
    "One number with its meaning, for dashboards: a label, a large value, a line of context and an optional small chart. With an address, the whole stat is a link.",
  root: "t-stat",
  parts: {
    "t-stat-label": "what the number means",
    "t-stat-link": "the link in the label of a clickable stat; its hit area covers the stat",
    "t-stat-value": "the number",
    "t-stat-sub": "context: a change or a unit",
    "t-stat-chart": "a box of fixed height at the bottom for a small chart",
  },
  props: { tone: TONES },
  html: "markup",
});
