import { defineComponent, SIZES, TONES } from "@tailor/core/spec";
import { CHART_PARTS } from "../chart/parts";

export default defineComponent({
  id: "bar-chart",
  name: "Bar chart",
  pack: "charts",
  group: "display",
  description:
    'Compares values across categories as grouped or stacked bars, upright or sideways, in the colours of the palette. Categories are text: the caller formats dates and times. lines draws reference lines across the chart at a value, such as a target or a limit: [{ value, label, tone? }] (HTML kit: "lines" in the options of the JSON). Money: currency="USD" (the ISO code), and the locale places the sign ("$1,000" in en-US); unit is a suffix for "ms", "%", "GB", never a currency sign.',
  root: "t-chart",
  parts: CHART_PARTS,
  props: { size: SIZES, tone: TONES },
  html: "script",
});
