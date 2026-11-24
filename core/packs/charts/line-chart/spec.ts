import { defineComponent, SIZES, TONES } from "@tailor/core/spec";
import { CHART_PARTS } from "../chart/parts";

export default defineComponent({
  id: "line-chart",
  name: "Line chart",
  pack: "charts",
  group: "display",
  description:
    'One or more series of values over categories, as lines or filled areas, in the colours of the palette. Values a reader needs exactly also belong in text. Categories are text: the caller formats dates and times. lines draws reference lines across the chart at a value, such as a target or a limit: [{ value, label, tone? }] (HTML kit: "lines" in the options of the JSON). Money: currency="USD" (the ISO code), and the locale places the sign ("$1,000" in en-US); unit is a suffix for "ms", "%", "GB", never a currency sign.',
  root: "t-chart",
  parts: CHART_PARTS,
  props: { size: SIZES, tone: TONES },
  html: "script",
});
