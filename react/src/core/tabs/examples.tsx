import { defineExamples } from "../../examples";
import { Icon } from "../icon/icon";
import { Stack } from "../stack/stack";
import { NavTabs, Tabs } from "./tabs";

const sections = [
  {
    id: "overview",
    label: "Overview",
    content: <p>web-1 runs three services and has been up for 12 days.</p>,
  },
  { id: "services", label: "Services", counter: 3, content: <p>nginx, api and worker run on web-1.</p> },
  { id: "logs", label: "Logs", counter: 128, content: <p>128 new lines since the last restart.</p> },
  { id: "backups", label: "Backups", disabled: true, content: <p>No backups yet.</p> },
  { id: "settings", label: "Settings", content: <p>Name, address and owner of web-1.</p> },
];

const many = [
  "Overview",
  "Services",
  "Logs",
  "Metrics",
  "Alerts",
  "Backups",
  "Network",
  "Storage",
  "Users",
  "Access",
  "Audit log",
  "Settings",
].map((label) => ({
  id: label.toLowerCase().replace(" ", "-"),
  label,
  content: <p>The {label.toLowerCase()} of nas.</p>,
}));

export default defineExamples("tabs", [
  {
    id: "default",
    title: "Line",
    note: "The arrow keys move between the tabs, Enter or Space shows one. Backups is disabled.",
    render: () => <Tabs label="Host sections" tabs={sections} />,
  },
  {
    id: "pills",
    title: "Pills, with icons",
    render: () => (
      <Tabs
        label="Views"
        variant="pills"
        defaultValue="list"
        tabs={[
          { id: "list", label: "List", icon: <Icon name="bi:list-ul" />, content: <p>web-1, web-2, nas</p> },
          { id: "grid", label: "Grid", icon: <Icon name="bi:grid" />, content: <p>Three cards.</p> },
          {
            id: "map",
            label: "Map",
            icon: <Icon name="bi:diagram-3" />,
            counter: 2,
            content: <p>Two links.</p>,
          },
        ]}
      />
    ),
  },
  {
    id: "many",
    title: "More tabs than fit",
    note: "The list scrolls sideways inside itself; the selected tab is scrolled into view.",
    render: () => <Tabs label="Storage sections" tabs={many} defaultValue="settings" />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "The fade at an edge shows that more tabs sit on that side.",
    width: "sm",
    render: () => <Tabs label="Narrow host sections" tabs={sections} defaultValue="logs" />,
  },
  {
    id: "nav",
    title: "Links to sub-pages",
    note: "NavTabs: the same look, each tab is a link. The current page has aria-current.",
    render: () => (
      <Stack gap="5">
        <NavTabs
          label="Host pages"
          items={[
            { to: "#overview", label: "Overview", exact: true },
            { to: "#services", label: "Services", counter: 3, current: true },
            { to: "#logs", label: "Logs" },
            { to: "#settings", label: "Settings" },
          ]}
        />
        <NavTabs
          label="Account pages"
          variant="pills"
          items={[
            { to: "#profile", label: "Profile", icon: <Icon name="bi:person" />, current: true },
            { to: "#keys", label: "Keys", icon: <Icon name="bi:key" />, counter: 2 },
            { to: "#sessions", label: "Sessions", icon: <Icon name="bi:laptop" /> },
          ]}
        />
      </Stack>
    ),
  },
]);
