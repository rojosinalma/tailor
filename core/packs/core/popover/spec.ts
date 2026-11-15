import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "popover",
  name: "Popover",
  pack: "core",
  group: "feedback",
  description:
    'A small panel anchored to its trigger, for content and controls. On a phone it is a bottom sheet. HTML: <button data-t="popover" data-t-popover="ID"> and <div class="t-popup t-popover" id="ID" hidden>.',
  root: "t-popover",
  parts: {
    "t-popover-title": "the title, optional",
    "t-popover-body": "the content",
    "t-popover-close": "the close button, shown in the sheet form",
  },
  props: { side: ["top", "bottom", "left", "right"], align: ["start", "center", "end"] },
  html: "script",
});
