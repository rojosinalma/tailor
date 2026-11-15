import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "tabs",
  name: "Tabs",
  pack: "core",
  group: "navigation",
  description:
    'Switches between panels in one view (Tabs), or between the sub-pages of a page with the same look (NavTabs: a <nav> with data-kind="nav" and links). Tabs that do not fit scroll sideways inside the list, with a fade at the edge that has more. Without a script, the current tab starts in view only where the browser supports scroll-initial-target (Chromium).',
  root: "t-tabs",
  parts: {
    "t-tabs-list": 'the row of tabs: role="tablist", or a <ul> in the nav form',
    "t-tab": 'one tab: a button with role="tab" and aria-selected, or a link with aria-current="page"',
    "t-tab-label": "the text of a tab",
    "t-tabs-panel": 'the content of one tab, role="tabpanel"',
  },
  props: { variant: ["line", "pills"], kind: ["panels", "nav"] },
  html: "script",
});
