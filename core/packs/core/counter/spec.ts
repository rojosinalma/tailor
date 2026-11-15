import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "counter",
  name: "Counter",
  pack: "core",
  group: "display",
  description: "A number in a small pill, for counts in navigation and tabs. Above max it shows max+.",
  root: "t-counter",
  props: { tone: TONES },
  html: "markup",
});
