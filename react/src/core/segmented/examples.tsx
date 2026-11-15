import { defineExamples } from "../../examples";
import { Icon } from "../icon/icon";
import { Stack } from "../stack/stack";
import { Segmented } from "./segmented";

const views = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "map", label: "Map" },
];

const ranges = [
  { value: "1h", label: "1 h" },
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 d" },
  { value: "30d", label: "30 d" },
];

export default defineExamples("segmented", [
  {
    id: "default",
    title: "A view switch",
    render: () => <Segmented label="View" name="view" options={views} />,
  },
  {
    id: "icons",
    title: "With icons",
    render: () => (
      <Segmented
        label="Status filter"
        name="status"
        defaultValue="running"
        options={[
          { value: "all", label: "All", icon: <Icon name="bi:circle" /> },
          { value: "running", label: "Running", icon: <Icon name="bi:play-circle" /> },
          { value: "stopped", label: "Stopped", icon: <Icon name="bi:stop-circle" /> },
        ]}
      />
    ),
  },
  {
    id: "sizes",
    title: "Sizes",
    render: () => (
      <Stack gap="2" align="start">
        <Segmented label="Small range" size="sm" defaultValue="7d" options={ranges} />
        <Segmented label="Medium range" defaultValue="7d" options={ranges} />
        <Segmented label="Large range" size="lg" defaultValue="7d" options={ranges} />
      </Stack>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <Segmented label="Locked view" options={views} defaultValue="grid" disabled />,
  },
  {
    id: "long",
    title: "Long labels truncate",
    render: () => (
      <Segmented
        label="Environment"
        options={[
          { value: "prod", label: "Production web-1.example.com" },
          { value: "stage", label: "Staging web-2.example.com" },
          { value: "dev", label: "Development nas.example.com" },
        ]}
      />
    ),
  },
]);
