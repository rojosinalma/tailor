import { mountChart } from "@tailor/packs/charts/chart/dom";
import { donutTotal, formatValue, keys, legendShown, parseModel } from "@tailor/packs/charts/chart/logic";
import { h, register } from "../runtime";

const kinds = new Set<string>();
let registered = false;

/**
 * Takes over each <div class="t-chart" data-t="chart" data-kind="…" data-label="…"> with its data in a
 * <script type="application/json"> child and the hidden data table after it. Each chart's file calls this
 * once its Chart.js parts are registered; the behaviour starts once every file of the pack has run.
 */
export function chartKind(kind: string): void {
  kinds.add(kind);
  if (registered) return;
  registered = true;
  queueMicrotask(() => register("chart", setup));
}

function setup(root: HTMLElement): void {
  const kind = root.dataset.kind ?? "";
  if (!kinds.has(kind)) return;
  const source = root.querySelector(":scope > script[type='application/json']");
  const model = parseModel(kind, JSON.parse(source?.textContent ?? "null"));
  const label = root.dataset.label ?? "";
  const hidden: boolean[] = [];

  const canvas = h("canvas", { class: "t-chart-canvas", role: "img", "aria-label": label });
  const frame = h("div", { class: "t-chart-frame" }, canvas);
  const total = h("span", { class: "t-chart-center-value" });
  const showTotal = (): void => {
    total.textContent = formatValue(donutTotal(model, hidden), model.options.unit, model.options.currency);
  };
  if (model.kind === "donut") {
    const centerLabel = model.options.centerLabel;
    frame.append(
      h(
        "div",
        { class: "t-chart-center" },
        total,
        centerLabel ? h("span", { class: "t-chart-center-label" }, centerLabel) : null,
      ),
    );
    showTotal();
  }

  const parts: HTMLElement[] = [frame];
  const buttons: HTMLButtonElement[] = [];
  if (legendShown(model)) {
    const legend = h(
      "ul",
      { class: "t-chart-legend" },
      ...keys(model).map((key) => {
        const button = h(
          "button",
          {
            type: "button",
            class: "t-btn t-chart-legend-item",
            "data-variant": "ghost",
            "data-size": "sm",
            "aria-pressed": "true",
          },
          h("span", { class: "t-chart-swatch", "aria-hidden": "true" }),
          key.label,
        );
        buttons.push(button);
        return h("li", {}, button);
      }),
    );
    parts.push(legend);
  }

  const table = root.querySelector(":scope > table");
  if (table) table.before(...parts);
  else root.append(...parts);
  const chart = mountChart(root, canvas, model, hidden);

  buttons.forEach((button, i) => {
    button.addEventListener("click", () => {
      hidden[i] = !hidden[i];
      button.setAttribute("aria-pressed", String(!hidden[i]));
      if (model.kind === "donut") showTotal();
      chart.update(model, hidden);
    });
  });
}
