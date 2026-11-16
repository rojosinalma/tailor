import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "topnav",
  name: "Top navigation shell",
  pack: "shell-topnav",
  group: "shells",
  description:
    'A frame with the brand, the links and the global actions in one top bar, and the footer facts in a thin row at the bottom. Links that do not fit go into "More"; a link with sub-items opens a menu. On a phone the links move into the navigation drawer or a bottom bar. Content: one Page.',
  root: "t-shell",
  parts: {
    "t-topnav-more": 'the "More" menu at the end of the row, for the links that do not fit',
  },
  props: {
    brand: [],
    nav: [],
    actions: [],
    footer: [],
    theme: ["skin", "palette", "mode"],
    phoneNav: ["drawer", "bar"],
    contained: [],
  },
  html: "script",
});
