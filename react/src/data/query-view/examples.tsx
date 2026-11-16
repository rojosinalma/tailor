import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../core/button/button";
import { Cluster } from "../../core/cluster/cluster";
import { Skeleton } from "../../core/skeleton/skeleton";
import { Stack } from "../../core/stack/stack";
import { Table } from "../../core/table/table";
import { defineExamples } from "../../examples";
import { type QueryLike, QueryView } from "./query-view";

interface Host {
  readonly name: string;
  readonly site: string;
  readonly load: number;
}

const hosts: Host[] = [
  { name: "nas", site: "Home", load: 12 },
  { name: "web-1", site: "Home", load: 34 },
  { name: "web-2", site: "Office", load: 8 },
  { name: "db-1", site: "Office", load: 51 },
];

const HostTable = ({ rows }: { rows: readonly Host[] }) => (
  <Table
    caption="Hosts"
    columns={[
      { key: "name", header: "Name" },
      { key: "site", header: "Site" },
      { key: "load", header: "Load (%)", kind: "num" },
    ]}
    rows={rows}
    rowKey={(h) => h.name}
  />
);

const skeleton = (
  <Stack gap="2">
    <Skeleton shape="box" size="sm" />
    <Skeleton lines={4} />
  </Stack>
);

const fixed = <T,>(state: Partial<QueryLike<T>> & Pick<QueryLike<T>, "status">): QueryLike<T> => ({
  data: undefined,
  error: null,
  isFetching: false,
  refetch: () => undefined,
  ...state,
});

/** An error that a retry turns into data, after a short wait. */
function Retry() {
  const [query, setQuery] = useState<QueryLike<Host[]>>(() =>
    fixed({ status: "error", error: new Error("The server did not answer in time.") }),
  );
  const refetch = (): void => {
    setQuery((q) => ({ ...q, isFetching: true }));
    setTimeout(() => setQuery(fixed({ status: "success", data: hosts })), 400);
  };
  return <QueryView query={{ ...query, refetch }}>{(rows) => <HostTable rows={rows} />}</QueryView>;
}

const loadHosts = (): Promise<Host[]> => new Promise((resolve) => setTimeout(() => resolve(hosts), 600));

function WithTanStack() {
  // The first data comes with the page, so a reload shows the refresh line over it.
  const query = useQuery({
    queryKey: ["hosts"],
    queryFn: loadHosts,
    initialData: hosts,
    staleTime: Number.POSITIVE_INFINITY,
  });
  return (
    <Stack>
      <Cluster>
        <Button size="sm" onClick={() => query.refetch()}>
          Reload
        </Button>
      </Cluster>
      <QueryView query={query} loading={skeleton}>
        {(rows) => <HostTable rows={rows} />}
      </QueryView>
    </Stack>
  );
}

function Provided() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <WithTanStack />
    </QueryClientProvider>
  );
}

export default defineExamples("query-view", [
  {
    id: "loading",
    title: "Loading",
    note: "The placeholders show only after 150 ms, so a fast load does not flash.",
    render: () => (
      <QueryView query={fixed<Host[]>({ status: "pending", isFetching: true })} loading={skeleton}>
        {(rows) => <HostTable rows={rows} />}
      </QueryView>
    ),
  },
  {
    id: "error",
    title: "Error, with Try again",
    render: () => <Retry />,
  },
  {
    id: "empty",
    title: "Empty",
    render: () => (
      <QueryView query={fixed<Host[]>({ status: "success", data: [] })}>
        {(rows) => <HostTable rows={rows} />}
      </QueryView>
    ),
  },
  {
    id: "ready",
    title: "Content",
    render: () => (
      <QueryView query={fixed({ status: "success", data: hosts })}>
        {(rows) => <HostTable rows={rows} />}
      </QueryView>
    ),
  },
  {
    id: "refreshing",
    title: "Refreshing",
    note: "The content stays while new data loads; a thin line moves along the top.",
    render: () => (
      <QueryView query={fixed({ status: "success", data: hosts, isFetching: true })}>
        {(rows) => <HostTable rows={rows} />}
      </QueryView>
    ),
  },
  {
    id: "tanstack",
    title: "With TanStack Query",
    note: "useQuery's result goes in as it is.",
    render: () => <Provided />,
  },
]);
