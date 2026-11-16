import { QueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "../../core/badge/badge";
import { List, ListItem } from "../../core/list/list";
import { Skeleton } from "../../core/skeleton/skeleton";
import { defineExamples } from "../../examples";
import { OfflineData, useIsRestoring } from "./offline-data";

const HOSTS = [
  { name: "web-1", role: "Web server", state: "up" },
  { name: "nas", role: "Storage", state: "up" },
  { name: "example.com", role: "Public site", state: "down" },
] as const;

function Hosts() {
  const restoring = useIsRestoring();
  const { data } = useQuery({ queryKey: ["hosts"], queryFn: async () => HOSTS });
  if (restoring || !data) return <Skeleton lines={3} />;
  return (
    <List label="Hosts">
      {data.map((host) => (
        <ListItem
          key={host.name}
          title={host.name}
          description={host.role}
          trailing={
            <Badge tone={host.state === "up" ? "success" : "danger"}>
              {host.state === "up" ? "Up" : "Down"}
            </Badge>
          }
        />
      ))}
    </List>
  );
}

const client = new QueryClient();

export default defineExamples("offline-data", [
  {
    id: "default",
    title: "Data kept for offline use",
    note: "The list is kept in the browser and shows at the next start, also with no network.",
    render: () => (
      <OfflineData client={client} storageKey="tailor-example-hosts" buster="2026-11-15-1">
        <Hosts />
      </OfflineData>
    ),
  },
]);
