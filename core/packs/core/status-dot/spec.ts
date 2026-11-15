import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "status-dot",
  name: "Status dot",
  pack: "core",
  group: "display",
  description:
    "A small dot for a live state next to a name. Its label is hidden text unless shown; a pulse marks work in progress.",
  root: "t-dot",
  parts: { "t-dot-label": "the visible label (a hidden label uses t-sr-only)" },
  props: { tone: TONES },
  html: "markup",
});
