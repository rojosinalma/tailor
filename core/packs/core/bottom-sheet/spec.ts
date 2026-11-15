import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "bottom-sheet",
  name: "Bottom sheet",
  pack: "core",
  group: "phone",
  description:
    "The phone form for a menu of choices or a short form: a sheet that slides up from the bottom and closes by a downward swipe, Escape or the backdrop. It is the drawer with side bottom. On a wide screen prefer Popover, Menu or Dialog.",
  root: "t-drawer",
  parts: {
    "t-drawer-handle": "the grab bar, on touch screens",
    "t-drawer-header": "title row with the close button",
    "t-drawer-title": "the title",
    "t-drawer-close": "the close button",
    "t-drawer-body": "the content, which scrolls when it is long",
    "t-drawer-footer": "the actions, at the end",
  },
  props: {},
  html: "script",
});
