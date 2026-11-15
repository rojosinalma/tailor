import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "command-palette",
  name: "Command palette",
  pack: "command",
  group: "navigation",
  description:
    "A searchable list of commands and places that Mod+K opens near the top of the screen; full screen on a phone.",
  root: "t-command",
  parts: {
    "t-command-search": "the row with the search field",
    "t-command-list": "the list of results, which scrolls",
    "t-command-group": "one group of results with its title",
    "t-command-group-label": "the title of a group",
    "t-command-icon": "the icon of a result",
    "t-command-match": "the letters of a label that match the search text",
    "t-command-status": "the row that shows loading or no result",
    "t-command-footer": "the key hints at the end",
  },
  html: "none",
});
