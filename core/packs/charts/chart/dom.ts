/**
 * The theme bridge and the Chart.js controller that both kits use. Chart.js draws on a canvas and cannot
 * read CSS, so the tokens are resolved here from the chart's own element and the chart redraws whenever
 * the skin, the palette or the mode changes.
 */
import { THEME_EVENT } from "@tailor/core/theme";
import { Chart, Tooltip, type TooltipModel } from "chart.js";
import {
  type ChartModel,
  type ChartTheme,
  chartConfig,
  formatValue,
  SERIES_TOKENS,
  seriesColours,
  TONE_TOKENS,
} from "./logic";

Chart.register(Tooltip);

let probe: CanvasRenderingContext2D | null = null;

/** Any CSS colour (color-mix(), color(srgb …), oklch()) as "rgb(r, g, b)", which Chart.js can parse. */
function toRgb(css: string): string {
  if (!probe) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!probe) return css;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

const px = (value: string): number => Number.parseFloat(value) || 0;

/** Reads the tokens through a hidden element inside the chart, so a [data-palette] scope applies too. */
export function resolveTheme(root: HTMLElement): ChartTheme {
  const el = document.createElement("span");
  el.hidden = true;
  root.append(el);
  const style = getComputedStyle(el);
  const colour = (token: string): string => {
    el.style.color = `var(${token})`;
    return toRgb(style.color);
  };
  el.style.fontFamily = "var(--t-font-sans)";
  el.style.fontSize = "var(--t-text-sm)";
  el.style.borderTop = "var(--t-border-w-strong) solid";
  el.style.borderBottom = "var(--t-border-w) solid";
  el.style.borderTopLeftRadius = "var(--t-radius-check)";
  el.style.transitionDuration = "var(--t-motion-base)";
  const duration = style.transitionDuration;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const theme: ChartTheme = {
    text: colour("--t-text"),
    muted: colour("--t-muted"),
    grid: colour("--t-border"),
    surface: colour("--t-surface"),
    hues: SERIES_TOKENS.map(colour),
    tones: {
      neutral: colour(TONE_TOKENS.neutral),
      accent: colour(TONE_TOKENS.accent),
      success: colour(TONE_TOKENS.success),
      warning: colour(TONE_TOKENS.warning),
      danger: colour(TONE_TOKENS.danger),
      info: colour(TONE_TOKENS.info),
    },
    fontFamily: style.fontFamily,
    fontSize: px(style.fontSize),
    lineWidth: px(style.borderTopWidth),
    gridWidth: px(style.borderBottomWidth),
    radius: px(style.borderTopLeftRadius),
    tint: px(getComputedStyle(root).getPropertyValue("--t-tint")) / 100,
    motion: reduced ? 0 : px(duration) * (duration.endsWith("ms") ? 1 : 1000),
  };
  el.remove();
  return theme;
}

export interface ChartController {
  /** New data, options or shown series. `hidden[i]` hides series i (donut: segment i). */
  update(model: ChartModel, hidden: readonly boolean[]): void;
  destroy(): void;
}

/**
 * Draws a model on the canvas inside `root` and keeps it in step with the theme. The canvas's parent is the
 * frame that sets the chart's size; the tooltip box goes in there. Legend swatches are the elements
 * `.t-chart-legend .t-chart-swatch` inside `root`, one per series or segment, in order.
 */
export function mountChart(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  first: ChartModel,
  firstHidden: readonly boolean[],
): ChartController {
  const frame = canvas.parentElement ?? root;
  let model = first;
  let hidden = firstHidden;
  let theme = resolveTheme(root);
  let colours = seriesColours(model, theme);

  const tip = document.createElement("div");
  tip.className = "t-chart-tooltip";
  tip.setAttribute("aria-hidden", "true");
  tip.hidden = true;
  frame.append(tip);

  const external = ({ tooltip }: { tooltip: TooltipModel<"line" | "bar" | "doughnut"> }): void => {
    if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
      tip.hidden = true;
      return;
    }
    const donut = model.kind === "donut";
    const rows = tooltip.dataPoints.map((point) => {
      const swatch = document.createElement("span");
      swatch.className = "t-chart-swatch";
      swatch.style.setProperty(
        "--t-chart-color",
        colours[donut ? point.dataIndex : point.datasetIndex] ?? "",
      );
      const label = document.createElement("span");
      label.className = "t-chart-tooltip-label";
      label.textContent = donut ? (model.categories[point.dataIndex] ?? "") : (point.dataset.label ?? "");
      const value = document.createElement("span");
      value.className = "t-chart-tooltip-value";
      value.textContent = formatValue(
        typeof point.raw === "number" ? point.raw : undefined,
        model.options.unit,
      );
      const row = document.createElement("li");
      row.className = "t-chart-tooltip-row";
      row.append(swatch, label, value);
      return row;
    });
    const list = document.createElement("ul");
    list.className = "t-chart-tooltip-rows";
    list.append(...rows);
    const parts: HTMLElement[] = [];
    if (!donut) {
      const title = document.createElement("div");
      title.className = "t-chart-tooltip-title";
      title.textContent = model.categories[tooltip.dataPoints[0]?.dataIndex ?? 0] ?? "";
      parts.push(title);
    }
    tip.replaceChildren(...parts, list);
    tip.hidden = false;
    // Beside the point, on the side with room, so the points in that column stay in sight.
    const gap = theme.fontSize;
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const right = tooltip.caretX + gap;
    const left = right + width <= frame.clientWidth ? right : Math.max(0, tooltip.caretX - gap - width);
    const top = Math.min(Math.max(0, tooltip.caretY - height / 2), Math.max(0, frame.clientHeight - height));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  const chart = new Chart(canvas, chartConfig(model, theme, hidden, external));
  chart.resize();

  const paint = (): void => {
    colours = seriesColours(model, theme);
    root.querySelectorAll<HTMLElement>(".t-chart-legend .t-chart-swatch").forEach((swatch, i) => {
      swatch.style.setProperty("--t-chart-color", colours[i] ?? "");
    });
    if (model.kind !== "donut") return;
    hidden.forEach((off, i) => {
      if (chart.getDataVisibility(i) === off) chart.toggleDataVisibility(i);
    });
  };

  const redraw = (): void => {
    const next = chartConfig(model, theme, hidden, external);
    chart.data = next.data;
    chart.options = next.options ?? {};
    paint();
    chart.update("none");
  };

  // Several changes in one task (skin, palette and mode together) redraw once, before the next paint.
  let pending = false;
  const refresh = (): void => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      if (!root.isConnected) return destroy();
      theme = resolveTheme(root);
      redraw();
    });
  };

  // Chart.js waits a frame after a resize; this draws in the same frame, so a picture is never half done.
  const resizer = new ResizeObserver(() => chart.resize());
  resizer.observe(frame);

  // The theme switch fires the event; a page that sets the attributes itself is caught by the observer.
  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-skin", "data-palette", "data-mode"],
  });
  // A skin or palette in its own stylesheet applies only once the file has loaded; a web font likewise.
  const onLoad = (event: Event): void => {
    if (event.target instanceof HTMLLinkElement) refresh();
  };
  document.addEventListener(THEME_EVENT, refresh);
  document.addEventListener("load", onLoad, true);
  document.fonts.addEventListener("loadingdone", refresh);
  const font = `${theme.fontSize}px ${theme.fontFamily}`;
  if (!document.fonts.check(font)) document.fonts.load(font).then(refresh, () => undefined);

  paint();
  if (model.kind === "donut" && hidden.some(Boolean)) chart.update("none");

  function destroy(): void {
    observer.disconnect();
    resizer.disconnect();
    document.removeEventListener(THEME_EVENT, refresh);
    document.removeEventListener("load", onLoad, true);
    document.fonts.removeEventListener("loadingdone", refresh);
    chart.destroy();
    tip.remove();
  }

  return {
    update(nextModel, nextHidden) {
      model = nextModel;
      hidden = nextHidden;
      redraw();
    },
    destroy,
  };
}
