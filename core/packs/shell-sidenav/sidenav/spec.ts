import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "sidenav",
  name: "Side navigation shell",
  pack: "shell-sidenav",
  group: "shells",
  description:
    "A frame with a left column: the brand, the global actions, the grouped links (sections open in place) and, at the bottom, the footer facts and the theme controls. The column collapses to icons with tooltips; the state is remembered; on a tablet it starts collapsed unless tabletCollapsed is false. The search sits under the brand; on a phone an icon button in the top bar opens it as a row under the bar. The Page header is the top bar of the content. On a phone a top bar opens the navigation drawer, or a bottom bar shows. Content: one Page.",
  root: "t-shell",
  parts: {
    "t-shell-collapse": "the toggle at the top of the column that collapses it to icons",
  },
  props: {
    brand: [],
    nav: [],
    search: [],
    actions: [],
    footer: [],
    theme: ["skin", "palette", "mode"],
    phoneNav: ["drawer", "bar"],
    storageKey: [],
    tabletCollapsed: [],
    contained: [],
  },
  html: "script",
});
