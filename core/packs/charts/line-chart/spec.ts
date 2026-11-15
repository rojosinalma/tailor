import { defineComponent, SIZES, TONES } from "@tailor/core/spec";
import { CHART_PARTS } from "../chart/parts";

export default defineComponent({
  id: "line-chart",
  name: "Line chart",
  pack: "charts",
  group: "display",
  description:
    "One or more series of values over categories, as lines or filled areas, in the colours of the palette. Values a reader needs exactly also belong in text.",
  root: "t-chart",
  parts: CHART_PARTS,
  props: { size: SIZES, tone: TONES },
  html: "script",
});
