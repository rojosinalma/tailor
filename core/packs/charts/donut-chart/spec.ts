import { defineComponent, SIZES, TONES } from "@tailor/core/spec";
import { CHART_PARTS } from "../chart/parts";

export default defineComponent({
  id: "donut-chart",
  name: "Donut chart",
  pack: "charts",
  group: "display",
  description:
    "Parts of a whole as a ring with the total in the centre and the legend beside it, or under it in a narrow box.",
  root: "t-chart",
  parts: {
    ...CHART_PARTS,
    "t-chart-center": "the total in the middle of the ring",
    "t-chart-center-value": "the total",
    "t-chart-center-label": "the text under the total",
  },
  props: { size: SIZES, tone: TONES },
  html: "script",
});
