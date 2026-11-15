import { useState } from "react";
import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Pagination } from "./pagination";

function Pages({ start, pageCount, label }: { start: number; pageCount: number; label: string }) {
  const [page, setPage] = useState(start);
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} label={label} />;
}

export default defineExamples("pagination", [
  {
    id: "default",
    title: "Buttons",
    note: "The first and last page, the current page and its neighbours. Narrow: previous, Page N of M, next.",
    render: () => <Pages start={5} pageCount={12} label="Hosts pages" />,
  },
  {
    id: "links",
    title: "Links",
    note: "With hrefFor every item is a link, so it works without a script.",
    render: () => <Pagination page={2} pageCount={40} hrefFor={(n) => `?page=${n}`} label="Log pages" />,
  },
  {
    id: "edges",
    title: "First page, last page, few pages",
    render: () => (
      <Stack>
        <Pages start={1} pageCount={20} label="Users pages" />
        <Pages start={20} pageCount={20} label="Events pages" />
        <Pages start={2} pageCount={3} label="Volumes pages" />
      </Stack>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "Previous, Page N of M, next.",
    width: "sm",
    render: () => <Pages start={5} pageCount={12} label="Narrow hosts pages" />,
  },
]);
