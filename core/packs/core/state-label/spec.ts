import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "state-label",
  name: "State label",
  pack: "core",
  group: "display",
  description:
    "A status in words with an icon, such as Running or Failed. The icon and the words carry the meaning, never the colour alone.",
  root: "t-state",
  parts: { "t-state-icon": "the icon; each tone but neutral and accent has a default one" },
  props: { tone: TONES },
  html: "markup",
});
