import { compareValues } from "../../../core/packs/data/data-table/logic";
import { services } from "../../../react/src/data/data-table/sample";
import { behaviour } from "../../src/behaviour";

const all = services(300);
const maxMemory = String(Math.max(...all.map((s) => s.memory)));
const lastName = [...all].sort((a, b) => compareValues(b.name, a.name, "text"))[0]?.name ?? "";
const stopped = all.filter((s) => s.status === "stopped").length;

export default behaviour("data-table", {
  "initial filters and search open the table on a filtered state": async ({ example, expect }) => {
    const body = example("filtered");
    await expect(body.getByRole("searchbox", { name: "Search", exact: true })).toHaveValue("worker");
    await expect(body.getByRole("rowheader")).toHaveText(["worker-1"]);
    await expect(body.getByRole("combobox", { name: "Status" })).toContainText("Degraded");
  },
  "an initial search that matches nothing says so; Clear filters shows every row": async ({
    example,
    expect,
  }) => {
    const body = example("no-matches");
    await expect(body.getByText("Nothing matches")).toBeVisible();
    await body.getByRole("button", { name: "Clear filters" }).click();
    await expect(body.getByRole("rowheader")).toHaveCount(8);
    await expect(body.getByRole("searchbox", { name: "Search", exact: true })).toHaveValue("");
  },
  "a click on a header sorts up, then down, then not at all": async ({ example, expect }) => {
    const body = example("default");
    const header = body.getByRole("columnheader", { name: "Memory (MB)" });
    const memory = body.locator("tbody tr").first().locator('[data-label="Memory (MB)"]');
    await body.getByRole("button", { name: "Memory (MB)" }).click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect(memory).toHaveText("0");
    await body.getByRole("button", { name: "Memory (MB)" }).click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await expect(memory).toHaveText(maxMemory);
    await body.getByRole("button", { name: "Memory (MB)" }).click();
    await expect(header).not.toHaveAttribute("aria-sort", /./);
    await expect(body.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort", /./);
  },
  "the keyboard sorts from the header button": async ({ page, example, expect }) => {
    const body = example("default");
    await expect(body.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    await body.getByRole("button", { name: "Name" }).focus();
    await page.keyboard.press("Enter");
    await expect(body.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
    await expect(body.getByRole("rowheader").first()).toHaveText(lastName);
    await expect(body.getByRole("button", { name: "Name" })).toBeFocused();
  },
  "Shift+click adds a second sort key": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Host" }).click();
    await page.keyboard.down("Shift");
    await body.getByRole("button", { name: "Memory (MB)" }).click();
    await page.keyboard.up("Shift");
    await expect(body.getByRole("columnheader", { name: "Host" })).toHaveAttribute("aria-sort", "ascending");
    await expect(body.getByRole("columnheader", { name: "Memory (MB)" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    const first = body.locator("tbody tr").first();
    const lowest = Math.min(...all.filter((s) => s.host === "db-1").map((s) => s.memory));
    await expect(first.locator('[data-label="Host"]')).toHaveText("db-1");
    await expect(first.locator('[data-label="Memory (MB)"]')).toHaveText(String(lowest));
  },
  "the search keeps the matching rows": async ({ example, expect }) => {
    const body = example("default");
    await body.getByRole("searchbox", { name: "Search", exact: true }).fill("backup");
    await expect(body.locator(".t-data-table-count")).toHaveText("1–20 of 25");
    await expect(body.getByRole("rowheader").first()).toHaveText("backup-1");
  },
  "a select filter keeps the rows with its value": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Stopped" }).click();
    await expect(body.locator(".t-data-table-count")).toHaveText(`1–20 of ${stopped}`);
    await expect(body.locator('tbody [data-label="Status"]').first()).toHaveText("Stopped");
  },
  "pages and the page size": async ({ page, example, expect }) => {
    const body = example("default");
    const count = body.locator(".t-data-table-count");
    await expect(count).toHaveText("1–20 of 300");
    await body.getByRole("button", { name: "Next" }).click();
    await expect(count).toHaveText("21–40 of 300");
    await expect(body.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    await body.getByRole("button", { name: "Page 15" }).click();
    await expect(count).toHaveText("281–300 of 300");
    await expect(body.getByRole("button", { name: "Next" })).toBeDisabled();
    await body.getByRole("combobox", { name: "Rows per page" }).click();
    await page.getByRole("option", { name: "50" }).click();
    await expect(count).toHaveText("1–50 of 300");
    await expect(body.locator("tbody tr")).toHaveCount(50);
  },
  "rows, the page box and a Shift range select": async ({ page, example, expect }) => {
    const body = example("default");
    const status = body.locator(".t-data-table-selected");
    await body.getByRole("checkbox", { name: "Select api-1", exact: true }).click();
    await expect(status).toHaveText("1 selected");
    const pageBox = body.getByRole("checkbox", { name: "Select the rows on this page" });
    await expect(pageBox).toBeChecked({ indeterminate: true });
    await pageBox.click();
    await expect(status).toHaveText("20 selected");
    await expect(pageBox).toBeChecked();
    await body.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(status).toBeHidden();
    await body.getByRole("checkbox", { name: "Select api-3", exact: true }).click();
    await page.keyboard.down("Shift");
    await body.getByRole("checkbox", { name: "Select api-6", exact: true }).click();
    await page.keyboard.up("Shift");
    await expect(status).toHaveText("4 selected");
    await expect(body.getByRole("checkbox", { name: "Select api-5", exact: true })).toBeChecked();
    await expect(body.getByRole("checkbox", { name: "Select api-7", exact: true })).not.toBeChecked();
  },
  "a bulk action gets the selected rows": async ({ page, kit, example, expect }) => {
    const body = example("default");
    if (kit === "html")
      await page.evaluate(() => {
        document.addEventListener("t:bulk", (event) => {
          const detail = (event as CustomEvent<{ action: string; ids: string[] }>).detail;
          document.body.dataset.bulk = `${detail.action}:${detail.ids.join(",")}`;
        });
      });
    await body.getByRole("checkbox", { name: "Select api-1", exact: true }).click();
    await body.getByRole("checkbox", { name: "Select api-2", exact: true }).click();
    await body.getByRole("button", { name: "Restart" }).click();
    if (kit === "html")
      await expect(page.locator("body")).toHaveAttribute("data-bulk", "restart:api-1,api-2");
    else await expect(body.getByText("Restart 2: api-1, api-2")).toBeVisible();
  },
  "the columns menu hides a column": async ({ page, example, expect }) => {
    const body = example("default");
    await body.getByRole("button", { name: "Columns" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Host" }).click();
    await page.keyboard.press("Escape");
    await expect(body.getByRole("columnheader", { name: "Host" })).toBeHidden();
    await expect(body.getByRole("columnheader", { name: "Status" })).toBeVisible();
  },
  "in a narrow box the rows are cards and Sort by sorts": async ({ page, example, expect }) => {
    const body = example("narrow");
    await expect(body.getByRole("columnheader", { name: "Host" })).toBeHidden();
    await expect(body.getByRole("checkbox", { name: "Select api-1", exact: true })).toBeVisible();
    const sortBy = body.getByRole("combobox", { name: "Sort by" });
    await expect(sortBy).toBeVisible();
    await sortBy.click();
    await page.getByRole("option", { name: "Memory (MB)" }).click();
    const memory = body.locator("tbody tr").first().locator('[data-label="Memory (MB)"]');
    await expect(memory).toHaveText("0");
    await body.getByRole("button", { name: "Descending" }).click();
    await expect(memory).toHaveText(maxMemory);
    await expect(body.getByRole("button", { name: "Descending" })).toHaveAttribute("aria-pressed", "true");
  },
  "no match shows the empty state, and Clear filters brings the rows back": async ({ example, expect }) => {
    const body = example("default");
    const search = body.getByRole("searchbox", { name: "Search", exact: true });
    await search.fill("nothing-like-this");
    await expect(body.getByText("Nothing matches")).toBeVisible();
    await body.getByRole("button", { name: "Clear filters" }).click();
    await expect(body.locator(".t-data-table-count")).toHaveText("1–20 of 300");
    await expect(search).toHaveValue("");
  },
});
