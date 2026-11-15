import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "kbd",
  name: "Keyboard key",
  pack: "core",
  group: "display",
  description: "A keyboard key, or a combination of keys with a plus between them.",
  root: "t-kbd",
  parts: { "t-kbd-keys": "a combination: the keys with a plus between them" },
  props: { keys: [] },
  html: "markup",
});
