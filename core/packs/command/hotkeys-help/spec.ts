import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "hotkeys-help",
  name: "Shortcuts help",
  pack: "command",
  group: "navigation",
  description:
    "A dialog that lists every registered keyboard shortcut by group, with a filter. Shift+? opens it.",
  root: "t-hotkeys-help",
  parts: {
    "t-hotkeys-help-groups": "the groups, in as many columns as fit",
    "t-hotkeys-help-group": "one group: its title and its shortcuts",
    "t-hotkeys-help-title": "the title of a group",
    "t-hotkeys-help-row": "one shortcut: its label and its keys",
  },
  html: "none",
});
