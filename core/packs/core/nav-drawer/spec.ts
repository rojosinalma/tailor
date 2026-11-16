import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "nav-drawer",
  name: "Navigation drawer",
  pack: "core",
  group: "phone",
  description:
    "The navigation of a shell on a phone: a drawer from the start edge with the brand, every link (sub-items indented), the global actions, the footer facts and the theme controls. A menu button opens it; a link, Escape, the backdrop or a swipe toward the start edge closes it. Without the script the menu button is a link to the drawer.",
  root: "t-nav-drawer",
  parts: {
    "t-nav-drawer-body": "the links and the actions; it scrolls when it is long",
    "t-nav-drawer-footer": "the footer facts and the theme controls, at the bottom",
  },
  props: { theme: ["skin", "palette", "mode"], button: [] },
  html: "script",
});
