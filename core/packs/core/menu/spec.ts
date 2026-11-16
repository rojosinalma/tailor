import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "menu",
  name: "Menu",
  pack: "core",
  group: "actions",
  description:
    "A list of actions that opens from a button: items, links, checkbox items, radio groups, groups and separators. Arrow keys, Home, End and typing move; Escape closes. On a phone it opens as a bottom sheet. Submenus are not supported: use a group or a dialog.",
  root: "t-menu",
  parts: {
    "t-menu-item": "one entry, also a t-option (role menuitem, menuitemcheckbox or menuitemradio)",
    "t-menu-icon": "the icon of an item",
    "t-menu-check": "the tick of a checkbox or radio item, also a t-menu-icon",
    "t-menu-label": "the text of an item",
    "t-menu-shortcut": "the keyboard shortcut that an item shows",
    "t-menu-separator": "a line between items",
    "t-menu-group": "items that belong together, under a label",
    "t-menu-group-label": "the label of a group",
  },
  props: { align: ["start", "center", "end"], side: ["bottom", "end"], tone: ["danger"] },
  html: "script",
});
