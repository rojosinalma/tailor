import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "tooltip",
  name: "Tooltip",
  pack: "core",
  group: "feedback",
  description:
    'The name of an icon-only control, shown on hover and on keyboard focus, never on touch. It only repeats the control\'s label: the control keeps its aria-label. It opens above the control (side "top") or on another side when the control sits at an edge, such as "end" for a collapsed sidebar. HTML: data-t="tooltip" data-tip="Remove" on the control, data-tip-side="start" for another side.',
  root: "t-tooltip",
  parts: { "t-tooltip-positioner": "the layer that places the tooltip next to its control" },
  props: { side: ["top", "bottom", "start", "end"] },
  html: "script",
});
