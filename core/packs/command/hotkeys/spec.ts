import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "hotkeys",
  name: "Keyboard shortcuts",
  pack: "command",
  group: "navigation",
  description:
    "One registry of the app's keyboard shortcuts: a provider at the root, a hook per shortcut and the keys to show.",
  root: "t-hotkeys",
  parts: { "t-hotkeys-keys": "the keys of one shortcut; a sequence shows each step" },
  props: { keys: [] },
  html: "none",
});
