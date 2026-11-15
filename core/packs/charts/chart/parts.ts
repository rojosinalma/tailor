/** The parts that every chart of the pack shares. */
export const CHART_PARTS = {
  "t-chart-frame": "the box with the chart's height; holds the canvas and the tooltip",
  "t-chart-canvas": "the drawing: an image named by the label",
  "t-chart-legend": "the list of series under the chart",
  "t-chart-legend-item": "a button that shows or hides one series; aria-pressed says whether it is shown",
  "t-chart-swatch": "the colour of one series",
  "t-chart-tooltip": "the box with the values at the pointer",
  "t-chart-tooltip-title": "the category in the tooltip",
  "t-chart-tooltip-rows": "the list of values in the tooltip",
  "t-chart-tooltip-row": "one series and its value",
  "t-chart-tooltip-label": "the series name in a row",
  "t-chart-tooltip-value": "the value in a row",
} as const;
