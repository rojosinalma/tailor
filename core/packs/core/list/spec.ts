import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "list",
  name: "List",
  pack: "core",
  group: "display",
  description:
    "Rows of items for navigation-like or record-like lists. A row with a link is a link over its whole area.",
  root: "t-list",
  parts: {
    "t-list-item": "one row; aria-current marks the selected one",
    "t-list-leading": "an icon, an avatar or a dot at the start",
    "t-list-content": "the title and the description",
    "t-list-title": "the title, cut to one line",
    "t-list-link": "the link of a row, on the title; its hit area is the whole row",
    "t-list-description": "the description, at most two lines",
    "t-list-trailing": "a badge, a value or actions at the end; its buttons stay clickable",
  },
  props: { dividers: ["true", "false"] },
  html: "markup",
});
