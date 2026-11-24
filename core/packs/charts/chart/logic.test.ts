import { describe, expect, test } from "bun:test";
import {
  type ChartModel,
  type ChartTheme,
  chartConfig,
  dataTable,
  donutModel,
  donutTotal,
  formatValue,
  isEmpty,
  legendShown,
  parseModel,
  seriesColours,
  shortLabel,
  withAlpha,
} from "./logic";

const theme: ChartTheme = {
  text: "rgb(235, 219, 178)",
  muted: "rgb(168, 153, 132)",
  grid: "rgb(80, 73, 69)",
  surface: "rgb(40, 40, 40)",
  // accent, blue, green, orange, purple (= accent), cyan (near blue), red, pink, yellow (= accent)
  hues: [
    "rgb(250, 189, 47)",
    "rgb(131, 165, 152)",
    "rgb(184, 187, 38)",
    "rgb(254, 128, 25)",
    "rgb(250, 189, 47)",
    "rgb(135, 170, 150)",
    "rgb(251, 73, 52)",
    "rgb(211, 134, 155)",
    "rgb(250, 189, 47)",
  ],
  tones: {
    neutral: "rgb(168, 153, 132)",
    accent: "rgb(250, 189, 47)",
    success: "rgb(184, 187, 38)",
    warning: "rgb(254, 128, 25)",
    danger: "rgb(251, 73, 52)",
    info: "rgb(131, 165, 152)",
  },
  fontFamily: "system-ui",
  fontSize: 13,
  lineWidth: 2,
  gridWidth: 1,
  radius: 4,
  tint: 0.2,
  motion: 0,
};

const line = (n: number, tones: (keyof ChartTheme["tones"] | undefined)[] = []): ChartModel => ({
  kind: "line",
  categories: ["a", "b"],
  series: Array.from({ length: n }, (_, i) => ({ label: `s${i}`, values: [1, 2], tone: tones[i] })),
  options: {},
});

describe("seriesColours", () => {
  test("takes the hues in order and skips the ones that look alike", () => {
    expect(seriesColours(line(6), theme)).toEqual([
      "rgb(250, 189, 47)",
      "rgb(131, 165, 152)",
      "rgb(184, 187, 38)",
      "rgb(254, 128, 25)",
      "rgb(251, 73, 52)",
      "rgb(211, 134, 155)",
    ]);
  });
  test("a toned series keeps its tone and the others avoid it", () => {
    const colours = seriesColours(line(2, ["danger"]), theme);
    expect(colours[0]).toBe(theme.tones.danger);
    expect(colours[1]).toBe("rgb(250, 189, 47)");
    expect(seriesColours(line(3, [undefined, "warning"]), theme)).toEqual([
      "rgb(250, 189, 47)",
      theme.tones.warning,
      "rgb(131, 165, 152)",
    ]);
  });
  test("more series than distinct hues use the close ones before repeating", () => {
    const colours = seriesColours(line(8), theme);
    expect(colours[6]).toBe("rgb(135, 170, 150)");
    expect(colours[7]).toBe("rgb(250, 189, 47)");
  });
  test("a donut colours its segments", () => {
    const model = donutModel(
      [
        { label: "Up", value: 3, tone: "success" },
        { label: "x", value: 1 },
      ],
      {},
    );
    expect(seriesColours(model, theme)).toEqual([theme.tones.success, "rgb(250, 189, 47)"]);
  });
});

describe("formatting and table", () => {
  test("formatValue adds the unit", () => {
    expect(formatValue(1234.567, "ms")).toBe("1,234.57 ms");
    expect(formatValue(12, "%")).toBe("12%");
    expect(formatValue(undefined)).toBe("–");
  });
  test("formatValue puts a currency where the locale puts it", () => {
    // The test runs in en-US, as the checks' browser does.
    expect(formatValue(1000, undefined, "USD")).toBe("$1,000");
    expect(formatValue(1240.5, undefined, "USD")).toBe("$1,240.50");
    expect(formatValue(1000, "$")).toBe("1,000 $");
  });
  test("a reference line is a row of the table and is read from the HTML kit's JSON", () => {
    const model = parseModel("bar", {
      categories: ["Mon", "Tue"],
      series: [{ label: "Spend", values: [800, 1200] }],
      options: { currency: "USD", lines: [{ value: 1000, label: "Required per day", tone: "warning" }] },
    });
    expect(model.options.lines).toEqual([{ value: 1000, label: "Required per day", tone: "warning" }]);
    expect(dataTable(model).rows).toEqual([
      ["Mon", "$800"],
      ["Tue", "$1,200"],
      ["Required per day", "$1,000"],
    ]);
    expect(() =>
      parseModel("bar", { categories: [], series: [], options: { lines: [{ value: "x" }] } }),
    ).toThrow("line 0 needs a value and a label");
  });
  test("shortLabel cuts long names", () => {
    expect(shortLabel("short")).toBe("short");
    expect(shortLabel("Fetch dependencies from the mirror")).toBe("Fetch dependenc…");
  });
  test("withAlpha", () => {
    expect(withAlpha("rgb(1, 2, 3)", 0.2)).toBe("rgba(1, 2, 3, 0.2)");
  });
  test("the table has one row per category and one column per series", () => {
    const table = dataTable({ ...line(2), options: { unit: "ms" } });
    expect(table.head).toEqual(["", "s0", "s1"]);
    expect(table.rows).toEqual([
      ["a", "1 ms", "1 ms"],
      ["b", "2 ms", "2 ms"],
    ]);
  });
  test("the donut total leaves out hidden segments", () => {
    const model = donutModel(
      [
        { label: "a", value: 3 },
        { label: "b", value: 4 },
      ],
      {},
    );
    expect(donutTotal(model, [])).toBe(7);
    expect(donutTotal(model, [false, true])).toBe(3);
  });
});

describe("model", () => {
  test("empty and legend defaults", () => {
    expect(isEmpty(line(0))).toBe(true);
    expect(isEmpty({ ...line(1), categories: [] })).toBe(true);
    expect(isEmpty(donutModel([{ label: "a", value: 0 }], {}))).toBe(true);
    expect(isEmpty(line(1))).toBe(false);
    expect(legendShown(line(1))).toBe(false);
    expect(legendShown(line(2))).toBe(true);
    expect(legendShown({ ...line(2), options: { legend: false } })).toBe(false);
  });
  test("parseModel reads valid data and refuses the rest", () => {
    const model = parseModel("bar", {
      categories: ["a"],
      series: [{ label: "x", values: [1], tone: "danger" }],
      options: { stacked: true, unit: "GB" },
    });
    expect(model.kind).toBe("bar");
    expect(model.series[0]?.tone).toBe("danger");
    expect(model.options).toEqual({ stacked: true, unit: "GB" });
    expect(parseModel("donut", { segments: [{ label: "a", value: 2 }] }).categories).toEqual(["a"]);
    expect(() => parseModel("pie", {})).toThrow();
    expect(() =>
      parseModel("line", { categories: ["a"], series: [{ label: "x", values: ["1"] }] }),
    ).toThrow();
    expect(() =>
      parseModel("line", { categories: [], series: [{ label: "x", values: [], tone: "red" }] }),
    ).toThrow();
    expect(() => parseModel("line", { categories: [], series: [], options: { area: "yes" } })).toThrow();
  });
});

describe("chartConfig", () => {
  const noop = (): void => undefined;
  test("Chart.js's own legend and tooltip stay off; reduced motion draws at once", () => {
    const config = chartConfig(line(2), theme, [], noop);
    expect(config.options?.plugins?.legend?.display).toBe(false);
    expect(config.options?.plugins?.tooltip?.enabled).toBe(false);
    expect(config.options?.animation).toBe(false);
    expect(chartConfig(line(1), { ...theme, motion: 180 }, [], noop).options?.animation).toEqual({
      duration: 180,
    });
  });
  test("a horizontal bar chart puts the categories on y; hidden series stay hidden", () => {
    const config = chartConfig(
      { ...line(2), kind: "bar", options: { horizontal: true } },
      theme,
      [true, false],
      noop,
    );
    expect(config.type).toBe("bar");
    expect(config.options?.indexAxis).toBe("y");
    expect(config.data.datasets.map((d) => d.hidden)).toEqual([true, false]);
  });
  test("an area fills under the line with the tint", () => {
    const config = chartConfig({ ...line(1), options: { area: true } }, theme, [], noop);
    const dataset = config.data.datasets[0];
    expect(dataset && "fill" in dataset ? dataset.fill : null).toBe("origin");
    expect(dataset?.backgroundColor).toBe("rgba(250, 189, 47, 0.2)");
  });
});
