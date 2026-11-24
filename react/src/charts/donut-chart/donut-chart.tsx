import { donutModel, type Segment } from "@tailor/packs/charts/chart/logic";
import { ArcElement, Chart, DoughnutController } from "chart.js";
import { type ChartCommonProps, ChartView } from "../chart-base";

Chart.register(DoughnutController, ArcElement);

export interface DonutChartProps extends ChartCommonProps {
  /** The parts of the whole. */
  segments: readonly Segment[];
  /** The text under the total in the centre: "requests". */
  centerLabel?: string;
  /** Suffix of every value: "ms", "%", "GB". For money use currency. */
  unit?: string;
  /** Money: the ISO code ("USD", "EUR"); the locale places the sign: "$1,000" in en-US. */
  currency?: string;
}

/** Parts of a whole as a ring, with the total in the centre. */
export function DonutChart({
  label,
  size,
  segments,
  legend,
  tooltip,
  centerLabel,
  unit,
  currency,
}: DonutChartProps) {
  const options = { centerLabel, unit, currency, legend, tooltip };
  return (
    <ChartView model={donutModel(segments, options)} data={{ segments, options }} label={label} size={size} />
  );
}
