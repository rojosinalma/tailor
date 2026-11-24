import type { ReferenceLine, Series } from "@tailor/packs/charts/chart/logic";
import { BarController, BarElement, CategoryScale, Chart, LinearScale } from "chart.js";
import { type ChartCommonProps, ChartView } from "../chart-base";

Chart.register(BarController, BarElement, LinearScale, CategoryScale);

export interface BarChartProps extends ChartCommonProps {
  /** One label per group of bars. */
  categories: readonly string[];
  /** One bar per series in each group; `values[i]` belongs to `categories[i]`. */
  series: readonly Series[];
  /** Stacks the series in one bar per category. */
  stacked?: boolean;
  /** Bars run sideways, the categories down the side: for long category names. */
  horizontal?: boolean;
  yMin?: number;
  yMax?: number;
  /** Suffix of every value: "ms", "%", "GB". For money use currency. */
  unit?: string;
  /** Money: the ISO code ("USD", "EUR"); the locale places the sign: "$1,000" in en-US. */
  currency?: string;
  /** Lines across the chart at a value: a target, a limit, "required per day". */
  lines?: readonly ReferenceLine[];
}

/** Compares values across categories as grouped or stacked bars. */
export function BarChart({
  label,
  size,
  categories,
  series,
  legend,
  tooltip,
  stacked,
  horizontal,
  yMin,
  yMax,
  unit,
  currency,
  lines,
}: BarChartProps) {
  const options = { stacked, horizontal, yMin, yMax, unit, currency, lines, legend, tooltip };
  return (
    <ChartView
      model={{ kind: "bar", categories, series, options }}
      data={{ categories, series, options }}
      label={label}
      size={size}
    />
  );
}
