import type { Size } from "@tailor/core/spec";
import { t } from "@tailor/core/text";
import { type ChartController, mountChart } from "@tailor/packs/charts/chart/dom";
import {
  type ChartModel,
  dataTable,
  donutTotal,
  formatValue,
  isEmpty,
  keys,
  legendShown,
} from "@tailor/packs/charts/chart/logic";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../core/empty-state/empty-state";
import { useIsStatic } from "../kit";

/** The props that every chart takes. */
export interface ChartCommonProps {
  /** The accessible name: what the chart shows, "Requests per hour, web-1". */
  label: string;
  size?: Size;
  /** Default: shown when there is more than one series. */
  legend?: boolean;
  /** Default: true. */
  tooltip?: boolean;
}

/** The same numbers as the chart, for screen readers. */
function DataTable({ model, label }: { model: ChartModel; label: string }) {
  const { head, rows } = dataTable(model);
  return (
    <table className="t-sr-only">
      <caption>{label}</caption>
      {model.kind === "donut" ? null : (
        <thead>
          <tr>
            {head.map((cell, i) =>
              i === 0 ? (
                <td key="corner" />
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: columns follow the series order
                <th key={i} scope="col">
                  {cell}
                </th>
              ),
            )}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map(([name, ...cells], r) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows follow the category order
          <tr key={r}>
            <th scope="row">{name}</th>
            {cells.map((cell, c) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: cells follow the series order
              <td key={c}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * One chart: the frame with the canvas, the legend and the hidden data table. `data` is what the HTML kit
 * reads from its JSON child, the same object that `model` was made from.
 */
export function ChartView({
  model,
  data,
  label,
  size = "md",
}: {
  model: ChartModel;
  data: object;
  label: string;
  size?: Size;
}) {
  const isStatic = useIsStatic();
  const json = JSON.stringify(data);
  // The model is rebuilt on every render; the chart redraws only when the data really changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: json carries the whole model
  const stable = useMemo(() => model, [json]);
  const [hidden, setHidden] = useState<boolean[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ChartController | null>(null);
  const latest = useRef({ model: stable, hidden });
  latest.current = { model: stable, hidden };
  const empty = isEmpty(stable);
  const dataSize = size === "md" ? undefined : size;

  useEffect(() => {
    if (empty || !root.current || !canvas.current) return;
    const mounted = mountChart(root.current, canvas.current, latest.current.model, latest.current.hidden);
    controller.current = mounted;
    return () => {
      mounted.destroy();
      controller.current = null;
    };
  }, [empty]);

  useEffect(() => {
    controller.current?.update(stable, hidden);
  }, [stable, hidden]);

  if (empty) {
    return (
      <div className="t-chart" data-kind={model.kind} data-size={dataSize}>
        <EmptyState title={t("chartEmpty")} text={label} size="sm" />
      </div>
    );
  }

  if (isStatic) {
    return (
      <div className="t-chart" data-t="chart" data-kind={model.kind} data-size={dataSize} data-label={label}>
        <script
          type="application/json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON with "<" escaped, read by the HTML kit
          dangerouslySetInnerHTML={{ __html: json.replaceAll("<", "\\u003c") }}
        />
        <DataTable model={stable} label={label} />
      </div>
    );
  }

  const unit = stable.options.unit;
  return (
    <div className="t-chart" data-kind={model.kind} data-size={dataSize} ref={root}>
      <div className="t-chart-frame">
        <canvas className="t-chart-canvas" role="img" aria-label={label} ref={canvas} />
        {stable.kind === "donut" ? (
          <div className="t-chart-center">
            <span className="t-chart-center-value">
              {formatValue(donutTotal(stable, hidden), unit, stable.options.currency)}
            </span>
            {stable.options.centerLabel ? (
              <span className="t-chart-center-label">{stable.options.centerLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      {legendShown(stable) ? (
        <ul className="t-chart-legend">
          {keys(stable).map((key, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the legend follows the series order
            <li key={i}>
              <button
                type="button"
                className="t-btn t-chart-legend-item"
                data-variant="ghost"
                data-size="sm"
                aria-pressed={!hidden[i]}
                onClick={() =>
                  setHidden((now) => {
                    const next = [...now];
                    next[i] = !now[i];
                    return next;
                  })
                }
              >
                <span className="t-chart-swatch" aria-hidden="true" />
                {key.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <DataTable model={stable} label={label} />
    </div>
  );
}
