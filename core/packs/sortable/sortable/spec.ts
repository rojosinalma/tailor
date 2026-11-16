import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "sortable",
  name: "Sortable",
  pack: "sortable",
  group: "actions",
  description:
    "Reorders the items of a list by dragging, by touch and by keyboard: rows of a list or a table, cards in a grid, chips in a row. By default only the grip of an item starts a drag, so its text stays selectable and its buttons clickable. On the grip, Space or Enter picks the item up, the arrow keys move it, Space or Enter drops it and Escape puts it back; a live region says each step. A group of lists lets items move between them.",
  root: "t-sortable",
  parts: {
    "t-sortable-item": "one item; while it moves it carries data-dragging",
    "t-sortable-row": "the row inside an item of a list (ul or ol)",
    "t-sortable-handle": "the grip button that starts a drag; its name is “Reorder <item>”",
    "t-sortable-empty": "the hint that an empty list shows; the list stays a drop target",
  },
  props: {
    orientation: ["vertical", "horizontal", "grid"],
    as: ["div", "ul", "ol", "tbody"],
    itemAs: ["div", "li", "tr"],
    handle: ["true", "false"],
    disabled: ["true"],
  },
  html: "none",
});
