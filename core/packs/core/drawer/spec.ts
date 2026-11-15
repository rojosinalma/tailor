import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "drawer",
  name: "Drawer",
  pack: "core",
  group: "feedback",
  description:
    "A panel that slides in from an edge over the page, for details or filters next to the current view. On a phone a side drawer takes at most 85% of the width and a bottom drawer is a sheet.",
  root: "t-drawer",
  parts: {
    "t-drawer-backdrop": "the dimmed layer behind the drawer",
    "t-drawer-header": "title row with the close button",
    "t-drawer-title": "the title",
    "t-drawer-close": "the close button",
    "t-drawer-body": "the content, which scrolls when it is long",
    "t-drawer-footer": "the actions, at the end",
  },
  props: { side: ["start", "end", "bottom"], size: ["sm", "md"] },
  html: "script",
});
