import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "bottom-bar",
  name: "Bottom bar",
  pack: "core",
  group: "phone",
  description:
    'Navigation at the bottom of a phone screen: up to five items, each an icon above a short label. With more items the fifth is "More", which opens the navigation drawer. It sits above the safe area.',
  root: "t-bottom-bar",
  parts: {
    "t-bottom-bar-list": "the list of items",
    "t-bottom-bar-item": 'one item, a link or the "More" button; the current page has aria-current="page"',
    "t-bottom-bar-icon": "the icon of an item",
    "t-bottom-bar-label": "the label of an item, one line that truncates",
  },
  props: { items: [], drawer: [] },
  html: "markup",
});
