/**
 * The charts' shared logic: the data model, the series colours, the value format, the hidden data table and
 * the Chart.js configuration. Plain TypeScript: the theme comes in already resolved (see ./dom.ts).
 */
import { TONES, type Tone } from "@tailor/core/spec";
import type { ChartConfiguration, ChartDataset, TooltipModel } from "chart.js";

export const KINDS = ["line", "bar", "donut"] as const;
export type ChartKind = (typeof KINDS)[number];

export interface Series {
  readonly label: string;
  readonly values: readonly number[];
  /** A tone carries meaning ("failed" in danger); leave it out for the next colour of the palette. */
  readonly tone?: Tone;
}

export interface Segment {
  readonly label: string;
  readonly value: number;
  readonly tone?: Tone;
}

export interface ChartOptions {
  /** Line: fills the area under each line. */
  readonly area?: boolean;
  /** Line and bar: stacks the series. */
  readonly stacked?: boolean;
  /** Line: a smooth curve through the points. */
  readonly smooth?: boolean;
  /** Bar: bars run sideways, the categories down the side. */
  readonly horizontal?: boolean;
  readonly yMin?: number;
  readonly yMax?: number;
  /** Suffix of every value: "ms", "%", "GB". */
  readonly unit?: string;
  /** Donut: the text under the total in the centre. */
  readonly centerLabel?: string;
  /** Default: shown when there is more than one series (donut: more than one segment). */
  readonly legend?: boolean;
  /** Default: true. */
  readonly tooltip?: boolean;
}

/** One chart's data. A donut holds its segments as the categories with one series of values. */
export interface ChartModel {
  readonly kind: ChartKind;
  readonly categories: readonly string[];
  readonly series: readonly Series[];
  /** Donut only: the tone of each segment. */
  readonly tones?: readonly (Tone | undefined)[];
  readonly options: ChartOptions;
}

export function donutModel(segments: readonly Segment[], options: ChartOptions): ChartModel {
  return {
    kind: "donut",
    categories: segments.map((s) => s.label),
    series: [{ label: "", values: segments.map((s) => s.value) }],
    tones: segments.map((s) => s.tone),
    options,
  };
}

/** The entries that get a colour and a legend item: the series, or the segments of a donut. */
export function keys(model: ChartModel): { label: string; tone?: Tone }[] {
  if (model.kind === "donut") return model.categories.map((label, i) => ({ label, tone: model.tones?.[i] }));
  return model.series.map(({ label, tone }) => ({ label, tone }));
}

export function isEmpty(model: ChartModel): boolean {
  if (model.categories.length === 0 || model.series.length === 0) return true;
  const values = model.series.flatMap((s) => s.values).filter(Number.isFinite);
  return model.kind === "donut" ? values.reduce((a, b) => a + Math.max(0, b), 0) === 0 : values.length === 0;
}

export function legendShown(model: ChartModel): boolean {
  return model.options.legend ?? keys(model).length > 1;
}

export function formatValue(value: number | undefined, unit?: string): string {
  if (value === undefined || !Number.isFinite(value)) return "–";
  const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  if (!unit) return number;
  return unit === "%" ? `${number}%` : `${number} ${unit}`;
}

/** The sum of the shown segments of a donut. */
export function donutTotal(model: ChartModel, hidden: readonly boolean[]): number {
  return (model.series[0]?.values ?? []).reduce(
    (sum, v, i) => sum + (hidden[i] || !Number.isFinite(v) ? 0 : Math.max(0, v)),
    0,
  );
}

/** The hidden data table: the same numbers as the chart, for screen readers. */
export function dataTable(model: ChartModel): { head: string[]; rows: string[][] } {
  const unit = model.options.unit;
  if (model.kind === "donut") {
    const values = model.series[0]?.values ?? [];
    return { head: ["", ""], rows: model.categories.map((c, i) => [c, formatValue(values[i], unit)]) };
  }
  return {
    head: ["", ...model.series.map((s) => s.label)],
    rows: model.categories.map((c, i) => [c, ...model.series.map((s) => formatValue(s.values[i], unit))]),
  };
}

/** A category name short enough for an axis. The tooltip and the table show it whole. */
export function shortLabel(label: string, max = 16): string {
  return label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label;
}

// ---------------------------------------------------------------------------------------------------------
// The theme

/** The tokens that the series colours come from, in an order that keeps neighbours apart. */
export const SERIES_TOKENS = [
  "--t-accent",
  "--t-hue-blue",
  "--t-hue-green",
  "--t-hue-orange",
  "--t-hue-purple",
  "--t-hue-cyan",
  "--t-hue-red",
  "--t-hue-pink",
  "--t-hue-yellow",
] as const;

export const TONE_TOKENS: Readonly<Record<Tone, string>> = {
  neutral: "--t-muted",
  accent: "--t-accent",
  success: "--t-success",
  warning: "--t-warning",
  danger: "--t-danger",
  info: "--t-info",
};

/** The tokens, resolved for a canvas: colours as rgb() strings, lengths in px. */
export interface ChartTheme {
  readonly text: string;
  readonly muted: string;
  readonly grid: string;
  readonly surface: string;
  /** The colours of SERIES_TOKENS, in order. */
  readonly hues: readonly string[];
  readonly tones: Readonly<Record<Tone, string>>;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineWidth: number;
  readonly gridWidth: number;
  readonly radius: number;
  /** The tint behind a filled area, 0 to 1. */
  readonly tint: number;
  /** Animation length in ms; 0 when the device asks for reduced motion. */
  readonly motion: number;
}

const rgbOf = (colour: string): number[] => (colour.match(/\d+/g) ?? []).slice(0, 3).map(Number);

/** Two colours a reader can hardly tell apart side by side: closer than this in RGB space. */
const NEAR = 48;
const near = (a: string, b: string): boolean => {
  const [x, y] = [rgbOf(a), rgbOf(b)];
  return Math.hypot(...x.map((v, i) => v - (y[i] ?? 0))) < NEAR;
};

/**
 * One colour per key: a tone where one is named, else the next palette hue that looks unlike the hues before
 * it and unlike the tones in the chart.
 */
export function seriesColours(model: ChartModel, theme: ChartTheme): string[] {
  const list = keys(model);
  const taken = list.flatMap((k) => (k.tone ? [theme.tones[k.tone]] : []));
  const free: string[] = [];
  for (const hue of theme.hues) if (![...taken, ...free].some((c) => near(c, hue))) free.push(hue);
  // Hues that look alike come last: better a close colour than the same one twice.
  const pool = [...free, ...new Set(theme.hues.filter((h) => !free.includes(h) && !taken.includes(h)))];
  if (pool.length === 0) pool.push(...theme.hues);
  let next = 0;
  return list.map((k) => (k.tone ? theme.tones[k.tone] : (pool[next++ % pool.length] ?? theme.text)));
}

/** "rgb(1, 2, 3)" with an alpha. */
export function withAlpha(rgb: string, alpha: number): string {
  const match = /^rgba?\(([^)]+)\)$/.exec(rgb);
  const parts = match?.[1]?.split(",").slice(0, 3).join(",");
  return parts ? `rgba(${parts}, ${alpha})` : rgb;
}

// ---------------------------------------------------------------------------------------------------------
// Validation of the HTML kit's JSON

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isTone = (v: unknown): v is Tone => typeof v === "string" && (TONES as readonly string[]).includes(v);

function toneOf(v: unknown, where: string): Tone | undefined {
  if (v === undefined) return undefined;
  if (!isTone(v)) throw new Error(`${where}: unknown tone ${JSON.stringify(v)}`);
  return v;
}

function readOptions(raw: unknown): ChartOptions {
  if (raw === undefined) return {};
  if (!isRecord(raw)) throw new Error("chart: options must be an object");
  const out: Record<string, boolean | number | string> = {};
  for (const name of ["area", "stacked", "smooth", "horizontal", "legend", "tooltip"]) {
    const v = raw[name];
    if (v === undefined) continue;
    if (typeof v !== "boolean") throw new Error(`chart: option ${name} must be true or false`);
    out[name] = v;
  }
  for (const name of ["yMin", "yMax"]) {
    const v = raw[name];
    if (v === undefined) continue;
    if (typeof v !== "number") throw new Error(`chart: option ${name} must be a number`);
    out[name] = v;
  }
  for (const name of ["unit", "centerLabel"]) {
    const v = raw[name];
    if (v === undefined) continue;
    if (typeof v !== "string") throw new Error(`chart: option ${name} must be text`);
    out[name] = v;
  }
  return out;
}

const numbers = (v: unknown, where: string): number[] => {
  if (!Array.isArray(v) || !v.every((n) => typeof n === "number"))
    throw new Error(`${where}: values must be a list of numbers`);
  return v;
};

/** Reads the data that the HTML kit carries as JSON. Throws on data that the chart cannot draw. */
export function parseModel(kind: string, raw: unknown): ChartModel {
  if (!(KINDS as readonly string[]).includes(kind)) throw new Error(`chart: unknown kind "${kind}"`);
  if (!isRecord(raw)) throw new Error("chart: the data must be an object");
  const options = readOptions(raw.options);
  if (kind === "donut") {
    if (!Array.isArray(raw.segments)) throw new Error("chart: a donut needs segments");
    return donutModel(
      raw.segments.map((s, i): Segment => {
        if (!isRecord(s) || typeof s.label !== "string" || typeof s.value !== "number")
          throw new Error(`chart: segment ${i} needs a label and a value`);
        return { label: s.label, value: s.value, tone: toneOf(s.tone, `chart: segment ${i}`) };
      }),
      options,
    );
  }
  if (!Array.isArray(raw.categories) || !raw.categories.every((c) => typeof c === "string"))
    throw new Error("chart: categories must be a list of text");
  if (!Array.isArray(raw.series)) throw new Error("chart: series must be a list");
  return {
    kind: kind === "bar" ? "bar" : "line",
    categories: raw.categories,
    series: raw.series.map((s, i): Series => {
      if (!isRecord(s) || typeof s.label !== "string") throw new Error(`chart: series ${i} needs a label`);
      return {
        label: s.label,
        values: numbers(s.values, `chart: series ${i}`),
        tone: toneOf(s.tone, `chart: series ${i}`),
      };
    }),
    options,
  };
}

// ---------------------------------------------------------------------------------------------------------
// The Chart.js configuration

type Kind = "line" | "bar" | "doughnut";
export type TooltipHandler = (args: { chart: unknown; tooltip: TooltipModel<Kind> }) => void;

/** The Chart.js configuration of a model in a theme. Chart.js's own legend and tooltip stay off. */
export function chartConfig(
  model: ChartModel,
  theme: ChartTheme,
  hidden: readonly boolean[],
  external: TooltipHandler,
): ChartConfiguration<Kind> {
  const colours = seriesColours(model, theme);
  const { options } = model;
  const font = { family: theme.fontFamily, size: theme.fontSize };
  const plugins = {
    legend: { display: false },
    tooltip: { enabled: false, external: options.tooltip === false ? undefined : external },
  };
  const animation = theme.motion > 0 ? { duration: theme.motion } : (false as const);
  const base = {
    // The size follows the frame through ./dom.ts, which redraws in the same frame as the resize.
    responsive: false,
    maintainAspectRatio: false,
    animation,
    color: theme.muted,
    font,
    plugins,
  };

  if (model.kind === "donut") {
    return {
      type: "doughnut",
      data: {
        labels: [...model.categories],
        datasets: [
          {
            data: [...(model.series[0]?.values ?? [])],
            backgroundColor: colours,
            hoverBackgroundColor: colours,
            borderWidth: 0,
            spacing: theme.gridWidth * 2,
            hoverOffset: 0,
          },
        ],
      },
      options: { ...base, cutout: "72%", interaction: { mode: "nearest", intersect: true } },
    };
  }

  const stacked = options.stacked ?? false;
  const horizontal = model.kind === "bar" && (options.horizontal ?? false);
  const category = {
    type: "category" as const,
    stacked,
    grid: { display: false },
    border: { color: theme.grid, width: theme.gridWidth },
    ticks: {
      color: theme.muted,
      font,
      maxRotation: 0,
      autoSkipPadding: theme.fontSize,
      callback: (_: unknown, index: number) => shortLabel(model.categories[index] ?? ""),
    },
  };
  const value = {
    type: "linear" as const,
    stacked,
    beginAtZero: true,
    min: options.yMin,
    max: options.yMax,
    grid: { color: theme.grid, lineWidth: theme.gridWidth },
    border: { display: false },
    ticks: {
      color: theme.muted,
      font,
      maxTicksLimit: 6,
      callback: (v: number | string) => formatValue(Number(v), options.unit),
    },
  };
  const scales = horizontal ? { x: value, y: category } : { x: category, y: value };

  if (model.kind === "bar") {
    const datasets: ChartDataset<"bar">[] = model.series.map((s, i) => ({
      label: s.label,
      data: [...s.values],
      hidden: hidden[i] ?? false,
      backgroundColor: colours[i],
      hoverBackgroundColor: colours[i],
      borderRadius: stacked ? 0 : theme.radius,
      borderSkipped: "start",
      maxBarThickness: theme.fontSize * 3,
      categoryPercentage: 0.7,
      barPercentage: 0.9,
    }));
    return {
      type: "bar",
      data: { labels: [...model.categories], datasets },
      options: {
        ...base,
        indexAxis: horizontal ? "y" : "x",
        interaction: { mode: "index", intersect: false, axis: horizontal ? "y" : "x" },
        scales,
      },
    };
  }

  const points = model.categories.length <= 24;
  const datasets: ChartDataset<"line">[] = model.series.map((s, i) => {
    const colour = colours[i] ?? theme.text;
    return {
      label: s.label,
      data: [...s.values],
      hidden: hidden[i] ?? false,
      borderColor: colour,
      backgroundColor: options.area ? withAlpha(colour, theme.tint) : colour,
      fill: options.area ? (stacked && i > 0 ? "-1" : "origin") : false,
      borderWidth: theme.lineWidth,
      pointRadius: points ? theme.lineWidth : 0,
      pointHoverRadius: theme.lineWidth * 2,
      pointBackgroundColor: colour,
      pointHoverBackgroundColor: colour,
      pointBorderWidth: 0,
      pointHoverBorderWidth: 0,
      cubicInterpolationMode: options.smooth ? "monotone" : "default",
    };
  });
  return {
    type: "line",
    data: { labels: [...model.categories], datasets },
    options: { ...base, interaction: { mode: "index", intersect: false }, scales },
  };
}
