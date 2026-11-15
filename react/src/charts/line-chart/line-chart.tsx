import type { Series } from "@tailor/packs/charts/chart/logic";
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
} from "chart.js";
import { type ChartCommonProps, ChartView } from "../chart-base";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler);

export interface LineChartProps extends ChartCommonProps {
  /** One label per point on the horizontal axis. */
  categories: readonly string[];
  /** One line per series; `values[i]` belongs to `categories[i]`. */
  series: readonly Series[];
  /** Fills the area under each line. */
  area?: boolean;
  /** Stacks the series on top of each other. */
  stacked?: boolean;
  /** A smooth curve through the points. */
  smooth?: boolean;
  /** The lowest value on the axis. Default: 0, or lower when a value is lower. */
  yMin?: number;
  yMax?: number;
  /** Suffix of every value: "ms", "%", "GB". */
  unit?: string;
}

/** One or more series over categories, as lines or filled areas, in the colours of the palette. */
export function LineChart({
  label,
  size,
  categories,
  series,
  legend,
  tooltip,
  area,
  stacked,
  smooth,
  yMin,
  yMax,
  unit,
}: LineChartProps) {
  const options = { area, stacked, smooth, yMin, yMax, unit, legend, tooltip };
  return (
    <ChartView
      model={{ kind: "line", categories, series, options }}
      data={{ categories, series, options }}
      label={label}
      size={size}
    />
  );
}
