import { donutModel, type Segment } from "@tailor/packs/charts/chart/logic";
import { ArcElement, Chart, DoughnutController } from "chart.js";
import { type ChartCommonProps, ChartView } from "../chart-base";

Chart.register(DoughnutController, ArcElement);

export interface DonutChartProps extends ChartCommonProps {
  /** The parts of the whole. */
  segments: readonly Segment[];
  /** The text under the total in the centre: "requests". */
  centerLabel?: string;
  /** Suffix of every value: "ms", "%", "GB". */
  unit?: string;
}

/** Parts of a whole as a ring, with the total in the centre. */
export function DonutChart({ label, size, segments, legend, tooltip, centerLabel, unit }: DonutChartProps) {
  const options = { centerLabel, unit, legend, tooltip };
  return (
    <ChartView model={donutModel(segments, options)} data={{ segments, options }} label={label} size={size} />
  );
}
