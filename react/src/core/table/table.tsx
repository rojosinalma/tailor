import type { Tone } from "@tailor/core/spec";
import type spec from "@tailor/packs/core/table/spec";
import { type ReactNode, useId } from "react";

type Kind = (typeof spec.props.kind)[number];

export interface TableColumn<R> {
  /** The column id; also the field of the row that the cell shows when there is no `render`. */
  key: string;
  /** The header text; also the label of the cell in the card form. */
  header: string;
  kind?: Kind;
  /** "low": the column hides first when the box gets narrow. */
  priority?: (typeof spec.props.priority)[number];
  width?: (typeof spec.props.width)[number];
  render?: (row: R) => ReactNode;
}

interface TableBase<R> {
  columns: readonly TableColumn<R>[];
  /** The title of the table, shown above it. */
  caption?: string;
  density?: (typeof spec.props.density)[number];
  /** Below 40rem: "cards" makes each row a card; "scroll" keeps the columns and scrolls sideways. */
  narrow?: (typeof spec.props.narrow)[number];
  /** A tone for the row: a thin toned edge at its start. */
  rowTone?: (row: R) => Tone | undefined;
}

export type TableProps<R> = TableBase<R> &
  (
    | { rows: readonly R[]; rowKey: (row: R) => string; body?: never }
    | {
        /**
         * The body, in place of the generated one: a `<tbody>` (or a component that renders one) whose cells
         * follow the columns, with `data-label` and `data-kind` as the generated cells have them.
         */
        body: ReactNode;
        rows?: never;
        rowKey?: never;
      }
  );

const cellValue = <R,>(column: TableColumn<R>, row: R): ReactNode => {
  if (column.render) return column.render(row);
  const value = row !== null && typeof row === "object" ? Reflect.get(row, column.key) : undefined;
  return typeof value === "string" || typeof value === "number" ? value : null;
};

/** A plain table for a small, fixed set of rows. An empty set of rows is the caller's empty state. */
export function Table<R>({
  columns,
  rows,
  rowKey,
  caption,
  density = "default",
  narrow = "cards",
  rowTone,
  body,
}: TableProps<R>) {
  const captionId = useId();
  const title = columns.find((c) => (c.kind ?? "text") === "text");
  const scroll = narrow === "scroll";
  return (
    <div
      className="t-table-wrap"
      // A box that scrolls sideways must take the focus, so the keyboard can scroll it.
      {...(scroll ? { tabIndex: 0, role: "group", "aria-labelledby": caption ? captionId : undefined } : {})}
    >
      <table
        className="t-table"
        data-density={density === "default" ? undefined : density}
        data-narrow={scroll ? narrow : undefined}
      >
        {caption ? <caption id={captionId}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                data-kind={column.kind === "text" ? undefined : column.kind}
                data-priority={column.priority === "low" ? "low" : undefined}
                data-width={column.width}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        {body ?? (
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={rowKey?.(row)} data-tone={rowTone?.(row)}>
                {columns.map((column) => {
                  const props = {
                    "data-label": column.header,
                    "data-kind": column.kind === "text" ? undefined : column.kind,
                    "data-priority": column.priority === "low" ? "low" : undefined,
                  };
                  return column === title ? (
                    <th key={column.key} {...props} scope="row">
                      {cellValue(column, row)}
                    </th>
                  ) : (
                    <td key={column.key} {...props}>
                      {cellValue(column, row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
