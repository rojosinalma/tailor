import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "topnav",
  name: "Top navigation shell",
  pack: "shell-topnav",
  group: "shells",
  description:
    'A frame with the brand, the links and the global actions in one top bar, and the footer facts in a thin row at the bottom. Links that do not fit go into "More"; a link with sub-items opens a menu. On a phone the links move into the navigation drawer or a bottom bar, and the search (its own prop, not an action) folds into an icon button that opens it as a row under the bar, so the brand keeps its name. Content: one Page. HTML kit: the markup holds each link once, in the bar\'s list (a section is its menu button and menu); the script builds the "More" menu and the phone\'s navigation drawer (the brand, the links, the footer facts and theme controls) from it. Markup that already holds a drawer or "More" keeps them. contained is only for a preview of the shell in a box; an app leaves it out.',
  root: "t-shell",
  parts: {
    "t-topnav-more": 'the "More" menu at the end of the row, for the links that do not fit',
  },
  props: {
    brand: [],
    nav: [],
    search: [],
    actions: [],
    footer: [],
    theme: ["skin", "palette", "mode"],
    phoneNav: ["drawer", "bar"],
    contained: [],
  },
  html: "script",
});
