/** The sample of the shell examples: a small service console with neutral data. Not a component. */
import type { ReactNode } from "react";
import { Avatar } from "../avatar/avatar";
import { Button } from "../button/button";
import { Grid } from "../grid/grid";
import { Menu } from "../menu/menu";
import { Page } from "../page/page";
import { Search } from "../search/search";
import { Stat } from "../stat/stat";
import { StateLabel } from "../state-label/state-label";
import { Table } from "../table/table";
import { Toolbar } from "../toolbar/toolbar";
import type { FooterFact, NavGroup, NavItem, ShellBrand } from "./shell-base";

export const BRAND: ShellBrand = { name: "Console", icon: "bi:box-seam", to: "#overview" };

export const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: "bi:speedometer2", to: "#overview" },
  { id: "services", label: "Services", icon: "bi:hdd-stack", to: "#services", counter: 3, current: true },
  { id: "hosts", label: "Hosts", icon: "bi:pc-display", to: "#hosts" },
  { id: "deploys", label: "Deploys", icon: "bi:rocket-takeoff", to: "#deploys" },
  {
    id: "system",
    label: "System",
    icon: "bi:sliders",
    items: [
      { id: "jobs", label: "Jobs", icon: "bi:clock-history", to: "#jobs" },
      { id: "backups", label: "Backups", icon: "bi:archive", to: "#backups" },
      { id: "logs", label: "Logs", icon: "bi:journal-text", to: "#logs" },
    ],
  },
  { id: "settings", label: "Settings", icon: "bi:gear", to: "#settings" },
];

/** The same links with the current page inside the System section. */
export const NAV_IN_SECTION: NavItem[] = NAV.map((item) =>
  item.id === "services"
    ? { ...item, current: false }
    : item.id === "system"
      ? {
          ...item,
          items: (item.items ?? []).map((sub) => (sub.id === "backups" ? { ...sub, current: true } : sub)),
        }
      : item,
);

const MORE_LABELS = [
  "Volumes",
  "Networks",
  "Certificates",
  "Domains",
  "Secrets",
  "Alerts",
  "Audit log",
  "Users",
];

/** Many links, for the overflow of a top bar and a long sidebar. Some have no icon. */
export const MANY: NavItem[] = [
  ...NAV,
  ...MORE_LABELS.map((label, i) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    to: `#${label.toLowerCase().replace(/\s+/g, "-")}`,
    ...(i % 3 === 0 ? {} : { icon: "bi:box-seam" as const }),
  })),
];

export const GROUPS: NavGroup[] = [
  { id: "run", label: "Run", items: NAV.slice(0, 4) },
  { id: "admin", label: "Admin", items: NAV.slice(4) },
];

export const MANY_GROUPS: NavGroup[] = [
  ...GROUPS,
  { id: "network", label: "Network", items: MANY.slice(NAV.length, NAV.length + 4) },
  { id: "access", label: "Access", items: MANY.slice(NAV.length + 4) },
];

export const FOOTER: FooterFact[] = [
  { id: "version", label: "Version", value: "2.4.1" },
  { id: "docs", value: "Docs", to: "https://example.com/docs" },
];

const USER_MENU = (
  <Menu
    trigger={<Button variant="ghost" icon={<Avatar name="alice" size="sm" />} label="alice" />}
    label="alice"
    align="end"
    items={[
      { id: "profile", label: "Profile", to: "#profile" },
      { id: "keys", label: "Access keys", to: "#keys" },
      { type: "separator" },
      { id: "sign-out", label: "Sign out" },
    ]}
  />
);

export const ACTIONS: ReactNode = (
  <>
    <Search label="Search" placeholder="Search" size="sm" shortcut={false} />
    {USER_MENU}
  </>
);

/** Actions for a phone: the user menu only. */
export const COMPACT_ACTIONS: ReactNode = USER_MENU;

interface Service {
  name: string;
  host: string;
  status: "running" | "degraded" | "stopped";
  image: string;
}

const SERVICES: Service[] = [
  { name: "web-1", host: "nas", status: "running", image: "nginx:1.27" },
  { name: "api", host: "nas", status: "degraded", image: "example/api:3.4.1" },
  { name: "db", host: "web-1", status: "running", image: "postgres:17" },
  { name: "backup", host: "nas", status: "stopped", image: "example/backup:2026.11" },
];

const STATUS = {
  running: ["success", "Running"],
  degraded: ["warning", "Degraded"],
  stopped: ["neutral", "Stopped"],
} as const;

/** The content region of the examples: a Page with a toolbar, stats and a table of services. */
export function ServicesPage({ title = "Services" }: { title?: string }) {
  return (
    <Page
      title={title}
      description="What runs on every host."
      actions={<Button variant="primary">Add service</Button>}
    >
      <Grid min="2xs">
        <Stat label="Running" value="12" tone="success" />
        <Stat label="Degraded" value="1" tone="warning" />
        <Stat label="Hosts" value="3" />
      </Grid>
      <Toolbar
        start={<Search label="Filter services" placeholder="Filter" size="sm" shortcut={false} />}
        end={<Button size="sm">Export</Button>}
      />
      <Table
        caption="Services"
        rows={SERVICES}
        rowKey={(row) => row.name}
        columns={[
          { key: "name", header: "Name" },
          { key: "host", header: "Host" },
          {
            key: "status",
            header: "Status",
            render: (row) => <StateLabel tone={STATUS[row.status][0]}>{STATUS[row.status][1]}</StateLabel>,
          },
          { key: "image", header: "Image", priority: "low" },
        ]}
      />
    </Page>
  );
}
