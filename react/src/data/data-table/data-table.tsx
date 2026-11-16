import { Checkbox } from "@base-ui/react/checkbox";
import { chevronExpand, columns as columnsGlyph, sortDown, sortUp } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type tableSpec from "@tailor/packs/core/table/spec";
import {
  compareValues,
  matchesFilter,
  matchesText,
  nextSort,
  pageSelection,
  pageWindow,
  rangeText,
  type SortKey,
  type SortType,
  selectRange,
  sortRows,
} from "@tailor/packs/data/data-table/logic";
import type spec from "@tailor/packs/data/data-table/spec";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  type RowData,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "../../core/alert/alert";
import { Button } from "../../core/button/button";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Menu } from "../../core/menu/menu";
import { Pagination } from "../../core/pagination/pagination";
import { Search } from "../../core/search/search";
import { Select, type SelectOption } from "../../core/select/select";
import { Skeleton } from "../../core/skeleton/skeleton";
import { Toolbar } from "../../core/toolbar/toolbar";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export type { SortKey } from "@tailor/packs/data/data-table/logic";

export interface DataColumn<R> {
  /** The column id; also the field of the row that the cell shows when there is no `render`. */
  key: string;
  /** The header text; also the label of the cell in the card form. */
  header: string;
  kind?: (typeof tableSpec.props.kind)[number];
  /** "low": the column hides first when the box gets narrow. */
  priority?: (typeof tableSpec.props.priority)[number];
  /** Text and number columns sort unless this is false. */
  sortable?: boolean;
  /** A filter in the toolbar: one value from a list, or a text. */
  filter?: { readonly type: "select"; readonly options: readonly SelectOption[] } | { readonly type: "text" };
  render?: (row: R) => ReactNode;
  /** The value that sorts, filters and searches; by default the field `key` of the row. */
  value?: (row: R) => string | number;
}

export interface DataBulkAction<R> {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly tone?: "danger";
  /** Gets the selected rows, also those on other pages. */
  readonly onSelect: (rows: R[]) => void;
}

/** What the rows show: for server-side data, the server sorts, filters and pages by it. */
export interface DataTableState {
  readonly sort: readonly SortKey[];
  readonly search: string;
  /** Column key to filter value; an empty value is no filter. */
  readonly filters: Readonly<Record<string, string>>;
  /** From 1. */
  readonly page: number;
  readonly pageSize: number;
}

export interface DataTableProps<R extends RowData> {
  /** The accessible name of the table. */
  label: string;
  columns: readonly DataColumn<R>[];
  /** All rows; with `manual`, the rows of the current page. */
  rows: readonly R[];
  rowKey: (row: R) => string;
  pageSize?: number;
  pageSizes?: readonly number[];
  /** A box on every row and bulk actions for the selected rows. */
  selectable?: boolean;
  bulkActions?: readonly DataBulkAction<R>[];
  /** A search over the text columns. */
  search?: boolean;
  initialSort?: readonly SortKey[];
  /** The search text at the start, to open the table on a filtered state. */
  initialSearch?: string;
  /** The column filters at the start: column key to value (a select filter takes an option value). */
  initialFilters?: Readonly<Record<string, string>>;
  density?: (typeof spec.props.density)[number];
  /** Below 40rem: "cards" makes each row a card; "scroll" keeps the columns and scrolls sideways. */
  narrow?: (typeof spec.props.narrow)[number];
  /** Shown when no row is there or none matches. */
  empty?: ReactNode;
  /** Skeleton rows while the rows load. */
  loading?: boolean;
  /** An error in place of the rows. */
  error?: ReactNode;
  onRetry?: () => void;
  /** Server-side data: the table shows `rows` as they come and reports what to show next. */
  manual?: {
    readonly rowCount: number;
    readonly state: DataTableState;
    readonly onStateChange: (state: DataTableState) => void;
  };
}

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const SEARCH = "t-search";
/** The value of the "all" choice of a select filter. */
const ANY = "*";
const PAGE_SIZES: readonly number[] = [10, 20, 50, 100];
const SKELETON_ROWS = 5;

const fill = (text: string, values: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (all, key: string) => String(values[key] ?? all));

function rawValue<R>(column: DataColumn<R>, row: R): string | number | undefined {
  if (column.value) return column.value(row);
  const value = row !== null && typeof row === "object" ? Reflect.get(row, column.key) : undefined;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

const textOf = <R,>(column: DataColumn<R>, row: R): string => String(rawValue(column, row) ?? "");

const isText = <R,>(column: DataColumn<R>): boolean => (column.kind ?? "text") === "text";

const canSort = <R,>(column: DataColumn<R>): boolean =>
  column.sortable ?? (column.kind === undefined || column.kind === "text" || column.kind === "num");

function sortTypeOf<R>(column: DataColumn<R>, rows: readonly R[]): SortType {
  if (column.kind === "num") return "num";
  const first = rows[0];
  return first !== undefined && typeof rawValue(column, first) === "number" ? "num" : "text";
}

const ariaSort = (key: SortKey | undefined): "ascending" | "descending" | undefined =>
  key ? (key.desc ? "descending" : "ascending") : undefined;

const kindAttr = (kind: DataColumn<unknown>["kind"]) => (kind === "text" ? undefined : kind);
const priorityAttr = (priority: DataColumn<unknown>["priority"]) => (priority === "low" ? "low" : undefined);

/** A row or page box. The Shift key of the click or the key press makes it a range. */
function Box({
  label,
  checked,
  indeterminate,
  onChange,
}: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean, range: boolean) => void;
}) {
  const isStatic = useIsStatic();
  const shift = useRef(false);
  if (isStatic)
    return (
      <label className="t-check">
        <input type="checkbox" className="t-check-input" aria-label={label} defaultChecked={checked} />
      </label>
    );
  const note = (event: MouseEvent | KeyboardEvent): void => {
    shift.current = event.shiftKey;
  };
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the checkbox from Base UI is inside the label.
    <label className="t-check" onClickCapture={note} onKeyDownCapture={note}>
      <Checkbox.Root
        className="t-check-input"
        aria-label={label}
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={(next: boolean) => onChange(next, shift.current)}
      />
    </label>
  );
}

/** The markup that the HTML kit script starts from: the full table, sorted as the server would. */
function StaticTable<R extends RowData>(props: DataTableProps<R> & { sort: readonly SortKey[] }) {
  const {
    label,
    columns,
    rows,
    rowKey,
    pageSize = 20,
    pageSizes,
    selectable,
    bulkActions,
    density,
    narrow,
  } = props;
  const title = columns.find(isText);
  const sorted = sortRows(
    rows,
    props.sort,
    (row, id) => {
      const column = columns.find((c) => c.key === id);
      return column ? textOf(column, row) : "";
    },
    (id) => {
      const column = columns.find((c) => c.key === id);
      return column ? sortTypeOf(column, rows) : "text";
    },
  );
  return (
    <div
      className="t-data-table"
      data-t="data-table"
      data-page-size={pageSize}
      data-page-sizes={pageSizes ? pageSizes.join(" ") : undefined}
      data-selectable={selectable ? "" : undefined}
      data-search={props.search === false ? "off" : undefined}
      data-initial-search={props.search !== false && props.initialSearch ? props.initialSearch : undefined}
      data-narrow={narrow === "scroll" ? "scroll" : undefined}
    >
      {bulkActions?.length ? (
        <div className="t-data-table-bulk" data-t-bulk="" hidden>
          {bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="t-btn"
              data-size="sm"
              data-variant={action.tone}
              data-action={action.id}
            >
              {action.icon}
              {action.icon ? <span className="t-btn-label">{action.label}</span> : action.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="t-table-wrap">
        <table
          className="t-table"
          aria-label={label}
          data-density={density === "compact" ? density : undefined}
          data-narrow={narrow === "scroll" ? narrow : undefined}
        >
          <thead>
            <tr>
              {columns.map((column) => {
                const key = props.sort.find((k) => k.id === column.key);
                return (
                  <th
                    key={column.key}
                    scope="col"
                    data-kind={kindAttr(column.kind)}
                    data-priority={priorityAttr(column.priority)}
                    data-sort={canSort(column) ? sortTypeOf(column, rows) : undefined}
                    data-filter={column.filter?.type}
                    data-filter-value={
                      column.filter ? props.initialFilters?.[column.key] || undefined : undefined
                    }
                    aria-sort={ariaSort(key)}
                  >
                    {column.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={rowKey(row)} data-row-id={rowKey(row)}>
                {columns.map((column) => {
                  const cell = {
                    "data-label": column.header,
                    "data-kind": kindAttr(column.kind),
                    "data-priority": priorityAttr(column.priority),
                    "data-value": column.render || column.value ? textOf(column, row) : undefined,
                  };
                  const content = column.render ? column.render(row) : rawValue(column, row);
                  return column === title ? (
                    <th key={column.key} scope="row" {...cell}>
                      {content}
                    </th>
                  ) : (
                    <td key={column.key} {...cell}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A table for many rows: sorting, search, filters, pages, selection and column visibility. */
export function DataTable<R extends RowData>(props: DataTableProps<R>) {
  const isStatic = useIsStatic();
  const initial: DataTableState = {
    sort: props.initialSort ?? [],
    search: props.initialSearch ?? "",
    filters: props.initialFilters ?? {},
    page: 1,
    pageSize: props.pageSize ?? 20,
  };
  // Loading and error have no rows for the HTML kit script: those states render as they look.
  if (isStatic && !props.loading && !props.error)
    return <StaticTable {...props} sort={props.manual?.state.sort ?? initial.sort} />;
  return <LiveTable {...props} initial={initial} />;
}

function LiveTable<R extends RowData>({
  label,
  columns,
  rows,
  rowKey,
  pageSizes = PAGE_SIZES,
  selectable = false,
  bulkActions,
  search = true,
  density = "default",
  narrow = "cards",
  empty,
  loading = false,
  error,
  onRetry,
  manual,
  initial,
}: DataTableProps<R> & { initial: DataTableState }) {
  const ids = useId();
  const [inner, setInner] = useState<DataTableState>(initial);
  const state = manual?.state ?? inner;
  const update = (change: Partial<DataTableState>): void => {
    const next = { ...state, ...change };
    if (manual) manual.onStateChange(next);
    else setInner(next);
  };

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  // Rows seen on any page, so a bulk action gets the selected rows of other server pages too.
  const seen = useRef(new Map<string, R>());
  for (const row of rows) seen.current.set(rowKey(row), row);

  const title = columns.find(isText);
  const scroll = narrow === "scroll";

  const defs = useMemo(() => {
    const textColumns = columns.filter(isText);
    return [
      ...columns.map((column) => {
        const type = sortTypeOf(column, rows);
        const filterType = column.filter?.type ?? "text";
        return {
          id: column.key,
          accessorFn: (row: R) => textOf(column, row),
          enableSorting: canSort(column),
          enableGlobalFilter: false,
          sortFn: (
            a: { getValue: (id: string) => unknown },
            b: { getValue: (id: string) => unknown },
            id: string,
          ) => compareValues(String(a.getValue(id)), String(b.getValue(id)), type),
          filterFn: (row: { getValue: (id: string) => unknown }, id: string, value: unknown) =>
            matchesFilter(String(row.getValue(id)), String(value), filterType),
        };
      }),
      {
        id: SEARCH,
        accessorFn: (row: R) => textColumns.map((c) => textOf(c, row)).join(" "),
        enableSorting: false,
      },
    ];
  }, [columns, rows]);

  const table = useTable({
    features,
    columns: defs,
    data: rows as R[],
    getRowId: (row: R) => rowKey(row),
    state: {
      sorting: [...state.sort],
      globalFilter: state.search,
      columnFilters: Object.entries(state.filters)
        .filter(([, value]) => value !== "")
        .map(([id, value]) => ({ id, value })),
      pagination: { pageIndex: state.page - 1, pageSize: state.pageSize },
    },
    getColumnCanGlobalFilter: (column) => column.id === SEARCH,
    globalFilterFn: (row, id, query) => matchesText(String(row.getValue(id)), String(query)),
    autoResetPageIndex: false,
    manualSorting: Boolean(manual),
    manualFiltering: Boolean(manual),
    manualPagination: Boolean(manual),
    rowCount: manual?.rowCount,
  });

  const total = manual ? manual.rowCount : table.getPrePaginatedRowModel().rows.length;
  const window = pageWindow(state.page, state.pageSize, total);
  const pageRows = table.getRowModel().rows;
  const order = (manual ? pageRows : table.getPrePaginatedRowModel().rows).map((row) => row.id);
  const pageIds = pageRows.map((row) => row.id);
  const filtering = state.search !== "" || Object.values(state.filters).some((v) => v !== "");

  // A page past the end, after a filter or fewer rows: show the last page there is.
  useEffect(() => {
    if (!loading && window.page !== state.page) update({ page: window.page });
  });

  const toggleSort = (id: string, multi: boolean): void =>
    update({ sort: nextSort(state.sort, id, multi), page: 1 });

  const setFilter = (key: string, value: string): void =>
    update({ filters: { ...state.filters, [key]: value === ANY ? "" : value }, page: 1 });

  const clearFilters = (): void => update({ search: "", filters: {}, page: 1 });

  const choose = (next: ReadonlySet<string>): void => setSelected(next);

  const visible = columns.filter((column) => !hidden.has(column.key));
  const hideable = columns.filter((column) => column !== title && column.header !== "");
  const sortable = columns.filter(canSort);
  const primary = state.sort[0];

  const selectionBar =
    selected.size > 0 ? (
      <div className="t-data-table-selection">
        <span className="t-data-table-selected" role="status">
          {fill(t("selectedCount"), { count: selected.size })}
        </span>
        {bulkActions?.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={action.tone}
            icon={action.icon}
            onClick={() =>
              action.onSelect(
                [...selected].flatMap((id) => {
                  const row = seen.current.get(id);
                  return row === undefined ? [] : [row];
                }),
              )
            }
          >
            {action.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => choose(new Set())}>
          {t("clear")}
        </Button>
      </div>
    ) : null;

  const sortBy =
    !scroll && sortable.length > 0 ? (
      <div className="t-data-table-sortby">
        <Select
          size="sm"
          aria-label={t("sortBy")}
          placeholder={t("sortBy")}
          options={sortable.map((c) => ({ value: c.key, label: c.header }))}
          value={primary?.id ?? null}
          onValueChange={(id) => update({ sort: [{ id, desc: primary?.desc ?? false }], page: 1 })}
        />
        <Button
          size="sm"
          variant="ghost"
          label={t("descending")}
          aria-pressed={primary?.desc ?? false}
          disabled={!primary}
          icon={<Glyph body={primary?.desc ? sortDown : sortUp} />}
          onClick={() => primary && update({ sort: [{ id: primary.id, desc: !primary.desc }] })}
        />
      </div>
    ) : null;

  const columnMenu =
    hideable.length > 1 ? (
      <Menu
        label={t("columns")}
        align="end"
        trigger={
          <Button size="sm" icon={<Glyph body={columnsGlyph} />}>
            {t("columns")}
          </Button>
        }
        items={hideable.map((column) => ({
          type: "checkbox" as const,
          id: column.key,
          label: column.header,
          checked: !hidden.has(column.key),
          onCheckedChange: (checked: boolean) => {
            const next = new Set(hidden);
            if (checked) next.delete(column.key);
            else next.add(column.key);
            setHidden(next);
          },
        }))}
      />
    ) : null;

  const start = (
    <>
      {search ? (
        <Search
          label={t("search")}
          size="sm"
          value={state.search}
          onValueChange={(v) => update({ search: v, page: 1 })}
        />
      ) : null}
      {columns.map((column) =>
        column.filter?.type === "select" ? (
          <Select
            key={column.key}
            size="sm"
            aria-label={column.header}
            options={[
              { value: ANY, label: fill(t("filterAll"), { column: column.header }) },
              ...column.filter.options,
            ]}
            value={state.filters[column.key] || ANY}
            onValueChange={(value) => setFilter(column.key, value)}
          />
        ) : column.filter?.type === "text" ? (
          <Search
            key={column.key}
            size="sm"
            shortcut={false}
            label={column.header}
            placeholder={column.header}
            value={state.filters[column.key] ?? ""}
            onValueChange={(value) => setFilter(column.key, value)}
          />
        ) : null,
      )}
    </>
  );

  const end = selectionBar ?? (
    <>
      {sortBy}
      {columnMenu}
    </>
  );

  const page = pageSelection(selected, pageIds);
  const headerCells = (
    <tr>
      {selectable ? (
        <th scope="col" className="t-data-table-check" data-kind="icon">
          <Box
            label={t("selectPage")}
            checked={page === "all"}
            indeterminate={page === "some"}
            onChange={(checked) => {
              const next = new Set(selected);
              for (const id of pageIds) {
                if (checked) next.add(id);
                else next.delete(id);
              }
              choose(next);
            }}
          />
        </th>
      ) : null}
      {visible.map((column) => {
        const index = state.sort.findIndex((k) => k.id === column.key);
        const key = state.sort[index];
        return (
          <th
            key={column.key}
            scope="col"
            data-kind={kindAttr(column.kind)}
            data-priority={priorityAttr(column.priority)}
            aria-sort={ariaSort(key)}
          >
            {canSort(column) ? (
              <button
                type="button"
                className="t-data-table-sort"
                onClick={(event) => toggleSort(column.key, event.shiftKey)}
              >
                {column.header}
                <Glyph body={key ? (key.desc ? sortDown : sortUp) : chevronExpand} />
                {key && state.sort.length > 1 ? (
                  <span className="t-data-table-sort-index">{index + 1}</span>
                ) : null}
              </button>
            ) : (
              column.header
            )}
          </th>
        );
      })}
    </tr>
  );

  const cellProps = (column: DataColumn<R>) => ({
    "data-label": column.header,
    "data-kind": kindAttr(column.kind),
    "data-priority": priorityAttr(column.priority),
  });

  const bodyRows = loading
    ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the placeholder rows are identical and never move.
        <tr key={i}>
          {selectable ? <td className="t-data-table-check" data-kind="icon" /> : null}
          {visible.map((column) => (
            <td key={column.key} {...cellProps(column)}>
              <Skeleton />
            </td>
          ))}
        </tr>
      ))
    : pageRows.map((tableRow) => {
        const row = tableRow.original;
        const id = tableRow.id;
        const isSelected = selected.has(id);
        const name = title ? textOf(title, row) : id;
        return (
          <tr key={id} data-selected={isSelected ? "" : undefined}>
            {selectable ? (
              <td className="t-data-table-check" data-kind="icon">
                <Box
                  label={fill(t("selectRow"), { name })}
                  checked={isSelected}
                  onChange={(checked, range) => {
                    choose(selectRange(selected, order, anchor.current, id, checked, range));
                    anchor.current = id;
                  }}
                />
              </td>
            ) : null}
            {visible.map((column) => {
              const content = column.render ? column.render(row) : rawValue(column, row);
              return column === title ? (
                <th key={column.key} scope="row" {...cellProps(column)}>
                  {content}
                </th>
              ) : (
                <td key={column.key} {...cellProps(column)}>
                  {content}
                </td>
              );
            })}
          </tr>
        );
      });

  const nothing = !loading && pageRows.length === 0;
  const emptyState = empty ?? (
    <EmptyState
      size="sm"
      title={filtering ? t("noMatches") : t("noRows")}
      text={filtering ? t("noMatchesText") : undefined}
      actions={
        filtering ? (
          <Button size="sm" onClick={clearFilters}>
            {t("clearFilters")}
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="t-data-table" data-narrow={scroll ? "scroll" : undefined}>
      <Toolbar start={start} end={end} />
      {error ? (
        <Alert
          tone="danger"
          title={t("errorTitle")}
          actions={
            onRetry ? (
              <Button size="sm" onClick={onRetry}>
                {t("retry")}
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      ) : (
        <div
          className="t-table-wrap"
          aria-busy={loading ? true : undefined}
          {...(scroll && !nothing ? { tabIndex: 0, role: "group", "aria-label": label } : {})}
        >
          {nothing ? (
            emptyState
          ) : (
            <table
              className="t-table"
              aria-label={label}
              data-density={density === "default" ? undefined : density}
              data-narrow={scroll ? narrow : undefined}
            >
              <thead>{headerCells}</thead>
              <tbody>{bodyRows}</tbody>
            </table>
          )}
        </div>
      )}
      <div className="t-data-table-footer">
        <span className="t-data-table-count">{rangeText(window, total, t("of"))}</span>
        {window.pageCount > 1 ? (
          <Pagination
            page={window.page}
            pageCount={window.pageCount}
            onPageChange={(p) => update({ page: p })}
          />
        ) : null}
        <div className="t-data-table-size">
          <span id={`${ids}-size`}>{t("rowsPerPage")}</span>
          <Select
            size="sm"
            aria-labelledby={`${ids}-size`}
            options={pageSizes.map((size) => ({ value: String(size), label: String(size) }))}
            value={String(state.pageSize)}
            onValueChange={(value) => update({ pageSize: Number(value), page: 1 })}
          />
        </div>
      </div>
    </div>
  );
}
