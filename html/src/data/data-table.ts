import {
  check,
  chevronExpand,
  chevronLeft,
  chevronRight,
  columns as columnsGlyph,
  search as searchGlyph,
  sortDown,
  sortUp,
} from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { pageItems } from "@tailor/packs/core/pagination/logic";
import {
  type FilterType,
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
import { glyph, h, register, uid, upgrade } from "../runtime";

const ANY = "*";
const SORT_TYPES: readonly string[] = ["text", "num", "date"];

const fill = (text: string, values: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (all, key: string) => String(values[key] ?? all));

interface Column {
  readonly id: string;
  readonly index: number;
  readonly th: HTMLTableCellElement;
  readonly header: string;
  readonly sort?: SortType;
  readonly filter?: FilterType;
  readonly text: boolean;
}

interface Row {
  readonly tr: HTMLTableRowElement;
  readonly id: string;
  readonly cells: readonly HTMLTableCellElement[];
  readonly values: readonly string[];
  box?: HTMLInputElement;
}

const button = (attrs: Record<string, string | boolean | undefined>, ...children: (Node | string)[]) =>
  h("button", { type: "button", class: "t-btn", "data-size": "sm", ...attrs }, ...children);

const searchField = (label: string, shortcut: boolean): [HTMLElement, HTMLInputElement] => {
  const input = h("input", {
    type: "search",
    class: "t-input-native",
    placeholder: label,
    "aria-label": label,
    autocomplete: "off",
  });
  const field = h(
    "div",
    {
      class: "t-control t-input-group t-search",
      "data-t": "search",
      "data-size": "sm",
      "data-shortcut": shortcut ? undefined : "off",
    },
    h("span", { class: "t-input-addon t-search-icon" }, glyph(searchGlyph)),
    input,
  );
  return [field, input];
};

const select = (attrs: Record<string, string | undefined>, options: readonly [string, string][]) =>
  h(
    "select",
    { class: "t-control t-select", "data-t": "select", "data-size": "sm", ...attrs },
    ...options.map(([value, label]) => h("option", { value, hidden: value === "" }, label)),
  );

const box = (label: string): [HTMLLabelElement, HTMLInputElement] => {
  const input = h("input", { type: "checkbox", class: "t-check-input", "aria-label": label });
  return [h("label", { class: "t-check" }, input), input];
};

/** Sorts, filters, pages and selects the rows of a server-rendered table in the browser. */
register("data-table", (root) => {
  const found = root.querySelector<HTMLTableElement>("table.t-table");
  const head = found?.tHead?.rows[0];
  const tbody = found?.tBodies[0];
  const wrap = found?.closest<HTMLElement>(".t-table-wrap");
  if (!found || !head || !tbody || !wrap) return;
  const table: HTMLTableElement = found;
  const body: HTMLTableSectionElement = tbody;

  const columns: Column[] = [...head.cells].map((th, index) => {
    const sort = th.dataset.sort ?? "";
    const filter = th.dataset.filter;
    return {
      id: String(index),
      index,
      th,
      header: (th.textContent ?? "").trim(),
      sort: SORT_TYPES.includes(sort) ? (sort as SortType) : undefined,
      filter: filter === "select" || filter === "text" ? filter : undefined,
      text: (th.dataset.kind ?? "text") === "text",
    };
  });
  const rows: Row[] = [...body.rows].map((tr, i) => {
    const cells = [...tr.cells];
    return {
      tr,
      id: tr.dataset.rowId ?? String(i),
      cells,
      values: cells.map((cell) => cell.dataset.value ?? (cell.textContent ?? "").trim()),
    };
  });
  const byId = new Map(columns.map((c) => [c.id, c]));
  const sortable = columns.filter((c) => c.sort);
  const selectable = root.hasAttribute("data-selectable");
  const sizes = (root.dataset.pageSizes ?? "10 20 50 100")
    .split(/\s+/)
    .map(Number)
    .filter((n) => n > 0);

  const state = {
    sort: columns.flatMap((c): SortKey[] => {
      const dir = c.th.getAttribute("aria-sort");
      return dir === "ascending" || dir === "descending" ? [{ id: c.id, desc: dir === "descending" }] : [];
    }),
    // The server may open the table on a filtered state: data-initial-search, and data-filter-value on a th.
    search: root.dataset.search === "off" ? "" : (root.dataset.initialSearch ?? ""),
    filters: Object.fromEntries(
      columns.flatMap((c) =>
        c.filter && c.th.dataset.filterValue ? [[c.id, c.th.dataset.filterValue]] : [],
      ),
    ) as Record<string, string>,
    page: 1,
    pageSize: Number(root.dataset.pageSize) || 20,
  };
  let selected: Set<string> = new Set();
  let anchor: string | null = null;
  let order: string[] = [];
  let pageIds: string[] = [];

  const filtering = (): boolean => state.search !== "" || Object.values(state.filters).some(Boolean);
  const fire = (name: string, detail: Record<string, unknown>): void => {
    root.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  };
  const select_ = (next: Set<string>): void => {
    selected = next;
    fire("t:selection", { ids: [...selected] });
    render();
  };

  // The toolbar: the search and the filters at the start; the Sort by, the columns and the selection at the end.
  const start = h("div", { class: "t-toolbar-start" });
  const end = h("div", { class: "t-toolbar-end" });
  const resets: (() => void)[] = [];

  if (root.dataset.search !== "off") {
    const [field, input] = searchField(t("search"), true);
    input.value = state.search;
    input.addEventListener("input", () => {
      state.search = input.value;
      state.page = 1;
      render();
    });
    resets.push(() => {
      input.value = "";
    });
    start.append(field);
  }
  for (const column of columns) {
    if (column.filter === "select") {
      const seen = new Map<string, string>();
      for (const row of rows) {
        const value = row.values[column.index] ?? "";
        if (value && !seen.has(value)) seen.set(value, (row.cells[column.index]?.textContent ?? "").trim());
      }
      const choices = [...seen].sort((a, b) => a[1].localeCompare(b[1]));
      const control = select({ "aria-label": column.header }, [
        [ANY, fill(t("filterAll"), { column: column.header })],
        ...choices,
      ]);
      control.value = state.filters[column.id] || ANY;
      control.addEventListener("change", () => {
        const value = control.value === ANY ? "" : control.value;
        if ((state.filters[column.id] ?? "") === value) return;
        state.filters[column.id] = value;
        state.page = 1;
        render();
      });
      resets.push(() => {
        control.value = ANY;
        control.dispatchEvent(new Event("change"));
      });
      start.append(control);
    } else if (column.filter === "text") {
      const [field, input] = searchField(column.header, false);
      input.value = state.filters[column.id] ?? "";
      input.addEventListener("input", () => {
        state.filters[column.id] = input.value;
        state.page = 1;
        render();
      });
      resets.push(() => {
        input.value = "";
      });
      start.append(field);
    }
  }

  const sortBy = select({ "aria-label": t("sortBy"), "data-placeholder": t("sortBy") }, [
    ["", t("sortBy")],
    ...sortable.map((c): [string, string] => [c.id, c.header]),
  ]);
  const direction = button({
    "data-variant": "ghost",
    "data-icon-only": true,
    "aria-label": t("descending"),
    "aria-pressed": "false",
  });
  sortBy.addEventListener("change", () => {
    if (!sortBy.value || sortBy.value === state.sort[0]?.id) return;
    state.sort = [{ id: sortBy.value, desc: state.sort[0]?.desc ?? false }];
    state.page = 1;
    render();
  });
  direction.addEventListener("click", () => {
    const first = state.sort[0];
    if (!first) return;
    state.sort = [{ id: first.id, desc: !first.desc }];
    render();
  });
  const sortGroup = h("div", { class: "t-data-table-sortby" }, sortBy, direction);
  const noSortBy = sortable.length === 0 || root.dataset.narrow === "scroll";

  const hidden = new Set<string>();
  const hideable = columns.filter(
    (c) => c.th.getAttribute("scope") === "col" && c.header && c !== columns.find((x) => x.text),
  );
  const menuId = uid("t-columns");
  const menuButton = button(
    { "data-t": "menu", "data-t-menu": menuId, "aria-haspopup": "menu", "aria-expanded": "false" },
    glyph(columnsGlyph),
    h("span", { class: "t-btn-label" }, t("columns")),
  );
  const menu = h("div", {
    class: "t-popup t-menu",
    id: menuId,
    role: "menu",
    "aria-label": t("columns"),
    "data-align": "end",
    hidden: true,
  });
  for (const column of hideable) {
    const item = h(
      "button",
      {
        type: "button",
        class: "t-option t-menu-item",
        role: "menuitemcheckbox",
        tabindex: "-1",
        "aria-checked": "true",
      },
      h("span", { class: "t-menu-icon t-menu-check" }, glyph(check)),
      h("span", { class: "t-menu-label" }, column.header),
    );
    // Runs before the menu flips aria-checked.
    item.addEventListener("click", () => {
      const show = item.getAttribute("aria-checked") !== "true";
      if (show) hidden.delete(column.id);
      else hidden.add(column.id);
      column.th.hidden = !show;
      for (const row of rows) {
        const cell = row.cells[column.index];
        if (cell) cell.hidden = !show;
      }
    });
    menu.append(item);
  }

  const count = h("span", { class: "t-data-table-selected", role: "status" });
  const clearSelection = button({ "data-variant": "ghost" }, t("clear"));
  clearSelection.addEventListener("click", () => select_(new Set()));
  const bulk = root.querySelector<HTMLElement>("[data-t-bulk]");
  const selection = h("div", { class: "t-data-table-selection", hidden: true }, count);
  if (bulk) {
    bulk.hidden = false;
    selection.append(...bulk.children);
    bulk.remove();
    selection.addEventListener("click", (event) => {
      const action =
        event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;
      if (action) fire("t:bulk", { action: action.dataset.action, ids: [...selected] });
    });
  }
  selection.append(clearSelection);
  end.append(sortGroup, ...(hideable.length > 1 ? [menuButton, menu] : []), selection);
  root.prepend(h("div", { class: "t-toolbar" }, start, end));

  // The header: sort buttons and the box of the page.
  const sortButtons = new Map<string, HTMLButtonElement>();
  for (const column of sortable) {
    const sort = h("button", { type: "button", class: "t-data-table-sort" }, ...column.th.childNodes);
    sort.addEventListener("click", (event) => {
      state.sort = nextSort(state.sort, column.id, event.shiftKey);
      state.page = 1;
      render();
    });
    column.th.append(sort);
    sortButtons.set(column.id, sort);
  }
  let pageBox: HTMLInputElement | undefined;
  if (selectable) {
    const [label, input] = box(t("selectPage"));
    pageBox = input;
    input.addEventListener("click", () => {
      const next = new Set(selected);
      for (const id of pageIds) {
        if (input.checked) next.add(id);
        else next.delete(id);
      }
      select_(next);
    });
    head.prepend(h("th", { scope: "col", class: "t-data-table-check", "data-kind": "icon" }, label));
    for (const row of rows) {
      const name = (row.tr.querySelector("th[scope='row']")?.textContent ?? row.id).trim();
      const [cellLabel, input] = box(fill(t("selectRow"), { name }));
      row.box = input;
      input.addEventListener("click", (event) => {
        select_(selectRange(selected, order, anchor, row.id, input.checked, event.shiftKey));
        anchor = row.id;
      });
      row.tr.prepend(h("td", { class: "t-data-table-check", "data-kind": "icon" }, cellLabel));
    }
  }

  // Under the table: the count, the pages and the rows per page.
  const countText = h("span", { class: "t-data-table-count" });
  const nav = h("nav", { class: "t-pagination", "aria-label": t("pagination") });
  const sizeLabel = h("span", { id: uid("t-size") }, t("rowsPerPage"));
  const size = select(
    { "aria-labelledby": sizeLabel.id },
    sizes.map((n): [string, string] => [String(n), String(n)]),
  );
  size.value = String(state.pageSize);
  size.addEventListener("change", () => {
    state.pageSize = Number(size.value);
    state.page = 1;
    render();
  });
  root.append(
    h(
      "div",
      { class: "t-data-table-footer" },
      countText,
      nav,
      h("div", { class: "t-data-table-size" }, sizeLabel, size),
    ),
  );

  const clearFilters = button({}, t("clearFilters"));
  clearFilters.addEventListener("click", () => {
    state.search = "";
    state.filters = {};
    for (const reset of resets) reset();
    state.page = 1;
    render();
  });
  const emptyTitle = h("p", { class: "t-empty-title" });
  const emptyText = h("p", { class: "t-empty-text" }, t("noMatchesText"));
  const empty = h(
    "div",
    { class: "t-empty", "data-size": "sm", hidden: true },
    emptyTitle,
    emptyText,
    h("div", { class: "t-empty-actions" }, clearFilters),
  );
  wrap.append(empty);

  const pageButton = (
    target: number,
    pageCount: number,
    className: string,
    key: string,
    ...content: (Node | string)[]
  ) => {
    const item = h(
      "button",
      { type: "button", class: className, "data-key": key, disabled: target < 1 || target > pageCount },
      ...content,
    );
    item.addEventListener("click", () => {
      state.page = target;
      render();
    });
    return h("li", {}, item);
  };

  const paginate = (page: number, pageCount: number): void => {
    nav.hidden = pageCount <= 1;
    const focused = nav.contains(document.activeElement)
      ? document.activeElement?.getAttribute("data-key")
      : null;
    const list = h(
      "ul",
      { class: "t-pagination-list" },
      pageButton(page - 1, pageCount, "t-pagination-step", "prev", glyph(chevronLeft), t("previous")),
      ...pageItems(page, pageCount).map((entry) => {
        if (typeof entry !== "number")
          return h("li", { class: "t-pagination-gap", "aria-hidden": "true" }, "…");
        const li = pageButton(entry, pageCount, "t-pagination-page", String(entry), String(entry));
        const item = li.firstElementChild;
        item?.setAttribute("aria-label", fill(t("pageNumber"), { page: entry }));
        if (entry === page) item?.setAttribute("aria-current", "page");
        return li;
      }),
      h("li", { class: "t-pagination-status" }, fill(t("pageOf"), { page, count: pageCount })),
      pageButton(page + 1, pageCount, "t-pagination-step", "next", t("next"), glyph(chevronRight)),
    );
    nav.replaceChildren(list);
    if (focused) list.querySelector<HTMLElement>(`[data-key="${focused}"]`)?.focus();
  };

  function render(): void {
    const matching = rows.filter(
      (row) =>
        matchesText(
          columns
            .filter((c) => c.text)
            .map((c) => row.values[c.index])
            .join(" "),
          state.search,
        ) &&
        Object.entries(state.filters).every(([id, value]) => {
          const column = byId.get(id);
          return !column?.filter || matchesFilter(row.values[column.index] ?? "", value, column.filter);
        }),
    );
    const sorted = sortRows(
      matching,
      state.sort,
      (row, id) => row.values[Number(id)] ?? "",
      (id) => byId.get(id)?.sort ?? "text",
    );
    const window = pageWindow(state.page, state.pageSize, sorted.length);
    state.page = window.page;
    const page = sorted.slice(window.start, window.end);
    order = sorted.map((row) => row.id);
    pageIds = page.map((row) => row.id);
    body.replaceChildren(...page.map((row) => row.tr));

    for (const row of page) {
      const on = selected.has(row.id);
      row.tr.toggleAttribute("data-selected", on);
      if (row.box) row.box.checked = on;
    }
    if (pageBox) {
      const state_ = pageSelection(selected, pageIds);
      pageBox.checked = state_ === "all";
      pageBox.indeterminate = state_ === "some";
    }
    for (const column of sortable) {
      const index = state.sort.findIndex((k) => k.id === column.id);
      const key = state.sort[index];
      if (key) column.th.setAttribute("aria-sort", key.desc ? "descending" : "ascending");
      else column.th.removeAttribute("aria-sort");
      const sort = sortButtons.get(column.id);
      sort?.querySelector(":scope > .t-icon")?.remove();
      sort?.querySelector(":scope > .t-data-table-sort-index")?.remove();
      sort?.append(glyph(key ? (key.desc ? sortDown : sortUp) : chevronExpand));
      if (key && state.sort.length > 1)
        sort?.append(h("span", { class: "t-data-table-sort-index" }, String(index + 1)));
    }

    const first = state.sort[0];
    if (sortBy.value !== (first?.id ?? "")) {
      sortBy.value = first?.id ?? "";
      sortBy.dispatchEvent(new Event("change"));
    }
    direction.disabled = !first;
    direction.setAttribute("aria-pressed", String(first?.desc ?? false));
    direction.replaceChildren(glyph(first?.desc ? sortDown : sortUp));

    const none = sorted.length === 0;
    table.hidden = none;
    empty.hidden = !none;
    emptyTitle.textContent = filtering() ? t("noMatches") : t("noRows");
    emptyText.hidden = !filtering();
    clearFilters.parentElement?.toggleAttribute("hidden", !filtering());

    count.textContent = fill(t("selectedCount"), { count: selected.size });
    selection.hidden = selected.size === 0;
    sortGroup.hidden = noSortBy || selected.size > 0;
    menuButton.hidden = selected.size > 0;
    countText.textContent = rangeText(window, sorted.length, t("of"));
    paginate(window.page, window.pageCount);
  }

  render();
  // The page may still be in its first upgrade pass, which does not see the controls made here.
  upgrade(root);
});
