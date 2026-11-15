import { defineComponent, SIZES, TONES } from "@tailor/core/spec";
import { CHART_PARTS } from "../chart/parts";

export default defineComponent({
  id: "bar-chart",
  name: "Bar chart",
  pack: "charts",
  group: "display",
  description:
    "Compares values across categories as grouped or stacked bars, upright or sideways, in the colours of the palette. Categories are text: the caller formats dates and times.",
  root: "t-chart",
  parts: CHART_PARTS,
  props: { size: SIZES, tone: TONES },
  html: "script",
});
