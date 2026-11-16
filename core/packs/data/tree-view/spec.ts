import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "tree-view",
  name: "Tree view",
  pack: "data",
  group: "display",
  description:
    'A tree of nested items, such as files or groups, with one tab stop and the arrow keys. HTML kit: nested <ul class="t-tree" data-t="tree" aria-label="…"> and <li class="t-tree-item" data-id="…"> lists with a link or a t-tree-label; data-open on an open item, data-selected on a selected one, aria-disabled="true" on a disabled one, aria-multiselectable on the tree. The script makes each line a tree item (state in aria-expanded and aria-selected), adds the keys and opening, and fires t:select with the selected ids. Without the script every item shows.',
  root: "t-tree",
  parts: {
    "t-tree-item": "one item (li): its line and its children",
    "t-tree-row":
      "the line of an item, the tree item itself: it carries aria-expanded, aria-selected and aria-disabled, and owns the group",
    "t-tree-toggle": "the chevron of a branch; an empty place on a leaf",
    "t-tree-icon": "the icon of the item",
    "t-tree-label": "the label: text, or a link",
    "t-tree-count": "the counter after the label, part of the name of the item",
    "t-tree-actions": "buttons for the item, shown on the selected item and under the pointer",
    "t-tree-group": "the children of an item, with the indent guide",
    "t-tree-loading": "the spinner row while the children of an item load",
  },
  html: "script",
});
