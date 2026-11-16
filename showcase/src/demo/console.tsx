/**
 * The sample service console that every shell demo shows. One source for both kits: the React demo
 * (pages/demo.tsx) and the HTML kit's static pages (static-pages.tsx) render these same pages.
 */
import { Avatar } from "@tailor/react/core/avatar/avatar";
import { Breadcrumb } from "@tailor/react/core/breadcrumb/breadcrumb";
import { Button } from "@tailor/react/core/button/button";
import { Card } from "@tailor/react/core/card/card";
import { Cluster } from "@tailor/react/core/cluster/cluster";
import { EmptyState } from "@tailor/react/core/empty-state/empty-state";
import { Fact, Facts } from "@tailor/react/core/facts/facts";
import { Field } from "@tailor/react/core/field/field";
import { Grid } from "@tailor/react/core/grid/grid";
import { Icon } from "@tailor/react/core/icon/icon";
import { Input } from "@tailor/react/core/input/input";
import { Menu } from "@tailor/react/core/menu/menu";
import { NotFoundPage } from "@tailor/react/core/not-found/not-found";
import { Page } from "@tailor/react/core/page/page";
import { Search } from "@tailor/react/core/search/search";
import { Section } from "@tailor/react/core/section/section";
import { Select } from "@tailor/react/core/select/select";
import type { FooterFact, NavGroup, NavItem, ShellBrand } from "@tailor/react/core/shell-base/shell-base";
import { SignInPage } from "@tailor/react/core/sign-in/sign-in";
import { Stack } from "@tailor/react/core/stack/stack";
import { Stat } from "@tailor/react/core/stat/stat";
import { StateLabel } from "@tailor/react/core/state-label/state-label";
import { Switch } from "@tailor/react/core/switch/switch";
import { Table } from "@tailor/react/core/table/table";
import { Toolbar } from "@tailor/react/core/toolbar/toolbar";
import type { Example } from "@tailor/react/examples";
import { AppLink } from "@tailor/react/link";
import { BareShell } from "@tailor/react/shell-bare/bare/bare";
import { SideNavShell } from "@tailor/react/shell-sidenav/sidenav/sidenav";
import { TopNavShell } from "@tailor/react/shell-topnav/topnav/topnav";
import { type ReactNode, useState } from "react";

/** A page of the console. "reports" is linked but does not exist: it shows the not-found page. */
export type DemoRoute =
  | { page: "overview" | "services" | "hosts" | "settings" | "reports" }
  | { page: "service"; name: string };

/** The address of a page: a router path in the React demo, a file name in the HTML kit. */
export type Href = (route: DemoRoute) => string;

interface Service {
  name: string;
  host: string;
  status: "running" | "degraded" | "stopped";
  image: string;
  port: string;
}

export const SERVICES: readonly Service[] = [
  { name: "web-1", host: "nas", status: "running", image: "nginx:1.27", port: "443" },
  { name: "api", host: "nas", status: "degraded", image: "example/api:3.4.1", port: "8080" },
  { name: "db", host: "web-1", status: "running", image: "postgres:17", port: "5432" },
  { name: "backup", host: "nas", status: "stopped", image: "example/backup:2026.11", port: "—" },
];

const HOSTS = [
  { name: "nas", address: "10.0.0.2", services: 3, load: "34%" },
  { name: "web-1", address: "10.0.0.3", services: 1, load: "12%" },
  { name: "edge", address: "10.0.0.4", services: 0, load: "3%" },
];

const DEPLOYS = [
  { id: "d-104", service: "api", version: "3.4.1", when: "Nov 15, 2026 10:42", by: "alice" },
  { id: "d-103", service: "web-1", version: "1.27", when: "Nov 14, 2026 17:05", by: "bob" },
  { id: "d-102", service: "db", version: "17", when: "Nov 12, 2026 09:30", by: "alice" },
];

const STATUS = {
  running: ["success", "Running"],
  degraded: ["warning", "Degraded"],
  stopped: ["neutral", "Stopped"],
} as const;

function Status({ status }: { status: Service["status"] }) {
  return <StateLabel tone={STATUS[status][0]}>{STATUS[status][1]}</StateLabel>;
}

export const brand = (href: Href): ShellBrand => ({
  name: "Console",
  icon: "bi:box-seam",
  to: href({ page: "overview" }),
});

const FOOTER: FooterFact[] = [{ id: "version", label: "Version", value: "2.4.1" }];

/** The links of the console. `current` marks the page where no router can tell (the HTML kit). */
export function consoleNav(href: Href, current?: DemoRoute["page"]): NavGroup[] {
  type Linked = Exclude<DemoRoute["page"], "service">;
  const item = (id: Linked, label: string, icon: NavItem["icon"], extra: Partial<NavItem> = {}): NavItem => ({
    id,
    label,
    icon,
    to: href({ page: id }),
    current:
      current === undefined ? undefined : current === id || (id === "services" && current === "service"),
    ...extra,
  });
  return [
    {
      id: "run",
      label: "Run",
      items: [
        item("overview", "Overview", "bi:speedometer2", { exact: true }),
        item("services", "Services", "bi:hdd-stack", { counter: SERVICES.length }),
        item("hosts", "Hosts", "bi:pc-display"),
      ],
    },
    {
      id: "admin",
      label: "Admin",
      items: [item("reports", "Reports", "bi:graph-up"), item("settings", "Settings", "bi:gear")],
    },
  ];
}

function Actions({ href }: { href: Href }) {
  return (
    <Menu
      trigger={<Button variant="ghost" icon={<Avatar name="alice" size="sm" />} label="alice" />}
      label="alice"
      align="end"
      items={[
        { id: "settings", label: "Settings", to: href({ page: "settings" }) },
        { type: "separator" },
        { id: "sign-out", label: "Sign out" },
      ]}
    />
  );
}

/** The console inside a shell with navigation. */
export function ConsoleFrame({
  shell,
  href,
  current,
  children,
}: {
  shell: "topnav" | "sidenav";
  href: Href;
  current?: DemoRoute["page"];
  children: ReactNode;
}) {
  const nav = consoleNav(href, current);
  const common = {
    brand: brand(href),
    search: <Search label="Search the console" placeholder="Search" size="sm" shortcut={false} />,
    actions: <Actions href={href} />,
    footer: FOOTER,
    theme: ["skin", "palette", "mode"] as const,
  };
  if (shell === "topnav")
    return (
      <TopNavShell {...common} nav={nav.flatMap((g) => g.items)}>
        {children}
      </TopNavShell>
    );
  return (
    <SideNavShell {...common} nav={nav} storageKey="tailor-showcase.demo.sidenav">
      {children}
    </SideNavShell>
  );
}

export function OverviewPage({ href }: { href: Href }) {
  return (
    <Page title="Overview" description="The state of every host and service.">
      <Grid min="2xs">
        <Stat label="Running" value="12" tone="success" to={href({ page: "services" })} />
        <Stat label="Degraded" value="1" tone="warning" to={href({ page: "services" })} />
        <Stat label="Hosts" value={String(HOSTS.length)} to={href({ page: "hosts" })} />
      </Grid>
      <Section title="Recent deploys">
        <DeployTable rows={DEPLOYS} />
      </Section>
    </Page>
  );
}

function DeployTable({ rows }: { rows: typeof DEPLOYS }) {
  return (
    <Table
      caption="Recent deploys"
      rows={rows}
      rowKey={(row) => row.id}
      columns={[
        { key: "service", header: "Service" },
        { key: "version", header: "Version" },
        { key: "when", header: "When", priority: "low" },
        { key: "by", header: "By", priority: "low" },
      ]}
    />
  );
}

export function ServicesPage({ href }: { href: Href }) {
  const [filter, setFilter] = useState("");
  const rows = SERVICES.filter((s) => `${s.name} ${s.host} ${s.image}`.includes(filter.trim().toLowerCase()));
  return (
    <Page
      title="Services"
      description="What runs on every host."
      primaryAction={<Button variant="primary">Add service</Button>}
    >
      <Toolbar
        start={
          <Search
            label="Filter services"
            placeholder="Filter"
            size="sm"
            shortcut={false}
            value={filter}
            onValueChange={setFilter}
          />
        }
        end={<Button size="sm">Export</Button>}
      />
      <Table
        caption="Services"
        rows={rows}
        rowKey={(row) => row.name}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => <AppLink to={href({ page: "service", name: row.name })}>{row.name}</AppLink>,
          },
          { key: "host", header: "Host" },
          { key: "status", header: "Status", render: (row) => <Status status={row.status} /> },
          { key: "image", header: "Image", priority: "low" },
        ]}
      />
    </Page>
  );
}

export function ServicePage({ href, name }: { href: Href; name: string }) {
  const service = SERVICES.find((s) => s.name === name);
  if (!service) return <NotFoundPage homeTo={href({ page: "overview" })} />;
  return (
    <Page
      title={service.name}
      description={`Runs on ${service.host}.`}
      breadcrumb={
        <Breadcrumb
          items={[{ label: "Services", to: href({ page: "services" }) }, { label: service.name }]}
        />
      }
      moreActions={[
        { id: "restart", label: "Restart" },
        { id: "logs", label: "Logs" },
        { type: "separator" },
        { id: "remove", label: "Remove", tone: "danger" },
      ]}
    >
      <Card title="Details">
        <Facts>
          <Fact name="Status">
            <Status status={service.status} />
          </Fact>
          <Fact name="Host">{service.host}</Fact>
          <Fact name="Image" mono>
            {service.image}
          </Fact>
          <Fact name="Port" mono>
            {service.port}
          </Fact>
        </Facts>
      </Card>
      <Section title="Deploys">
        <DeployTable rows={DEPLOYS.filter((d) => d.service === service.name)} />
      </Section>
    </Page>
  );
}

export function HostsPage() {
  return (
    <Page title="Hosts" description="The machines that run the services.">
      <Grid min="xs">
        {HOSTS.map((host) => (
          <Card key={host.name} title={host.name}>
            <Facts>
              <Fact name="Address" mono>
                {host.address}
              </Fact>
              <Fact name="Services">{String(host.services)}</Fact>
              <Fact name="Load">{host.load}</Fact>
            </Facts>
          </Card>
        ))}
      </Grid>
    </Page>
  );
}

export function SettingsPage() {
  return (
    <Page title="Settings" width="readable">
      <Section title="General" description="How the console names and reports things.">
        <Stack gap="4">
          <Field label="Console name">
            <Input name="name" defaultValue="Console" />
          </Field>
          <Field label="Region">
            <Select
              name="region"
              defaultValue="eu"
              options={[
                { value: "eu", label: "Europe" },
                { value: "us", label: "United States" },
              ]}
            />
          </Field>
          <Switch name="alerts" label="Send alerts by mail" defaultChecked />
          <div>
            <Button variant="primary">Save</Button>
          </div>
        </Stack>
      </Section>
    </Page>
  );
}

export function MissingPage({ href }: { href: Href }) {
  return <NotFoundPage homeTo={href({ page: "overview" })} />;
}

/** The page of a route, inside the console frame. */
export function ConsolePage({ route, href }: { route: DemoRoute; href: Href }) {
  switch (route.page) {
    case "overview":
      return <OverviewPage href={href} />;
    case "services":
      return <ServicesPage href={href} />;
    case "service":
      return <ServicePage href={href} name={route.name} />;
    case "hosts":
      return <HostsPage />;
    case "settings":
      return <SettingsPage />;
    case "reports":
      return <MissingPage href={href} />;
  }
}

/** The bare shell demo: a sign-in page, and the message after it. */
export function SignInDemo({ action, onSignIn }: { action?: string; onSignIn?: () => void }) {
  return (
    <BareShell align="start" theme={["skin", "palette", "mode"]} footer={FOOTER}>
      <SignInPage
        action={action}
        onSubmit={onSignIn}
        remember
        brand={
          <Cluster gap="2" align="center">
            <Icon name="bi:box-seam" />
            Console
          </Cluster>
        }
      />
    </BareShell>
  );
}

export function SignedIn({ signOut }: { signOut: ReactNode }) {
  return (
    <BareShell align="center" theme={["skin", "palette", "mode"]}>
      <EmptyState
        icon={<Icon name="bi:check-circle" />}
        title="Signed in"
        text="Welcome back, alice."
        actions={signOut}
      />
    </BareShell>
  );
}

/** A shell that the console does not draw: its first frame example, on the whole screen. */
export function ShellExampleDemo({ example }: { example: Example }) {
  return <div className="sc-demo-fill">{example.render()}</div>;
}

/** A shell that the registry names but this build does not hold. */
export function NotBuilt({ id }: { id: string }) {
  return (
    <div className="sc-demo-fill">
      <EmptyState
        icon={<Icon name="bi:cone-striped" />}
        title="Not built yet"
        text={`The shell "${id}" is not in this build of tailor.`}
      />
    </div>
  );
}

/** The first page of a shell's demo in the HTML kit. */
export const staticStart = (shell: string): string => (shell === "bare" ? "sign-in.html" : "overview.html");

/** The addresses of the HTML kit's demo pages, next to each other in one folder. */
export const staticHref: Href = (route) =>
  route.page === "service" ? `service-${route.name}.html` : `${route.page}.html`;
