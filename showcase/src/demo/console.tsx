/**
 * The sample service console of the side navigation shell. One source for both kits: the React demo
 * (pages/demo.tsx) and the HTML kit's static pages (static-pages.tsx) render these same pages. Its pages are
 * the layouts of the layouts pack, fed with the sample data or the stress data.
 */
import { Avatar } from "@tailor/react/core/avatar/avatar";
import { Button } from "@tailor/react/core/button/button";
import { Card } from "@tailor/react/core/card/card";
import { ErrorPage } from "@tailor/react/core/error-page/error-page";
import { Fact, Facts } from "@tailor/react/core/facts/facts";
import { Grid } from "@tailor/react/core/grid/grid";
import { LoadingPage } from "@tailor/react/core/loading-page/loading-page";
import { Menu } from "@tailor/react/core/menu/menu";
import { NotFoundPage } from "@tailor/react/core/not-found/not-found";
import { Page } from "@tailor/react/core/page/page";
import { Search } from "@tailor/react/core/search/search";
import type { FooterFact, NavGroup, NavItem } from "@tailor/react/core/shell-base/shell-base";
import { DashboardPageLayout } from "@tailor/react/layouts/dashboard-page/dashboard-page";
import { DetailPageLayout } from "@tailor/react/layouts/detail-page/detail-page";
import { FormDialogLayout } from "@tailor/react/layouts/form-dialog/form-dialog";
import { ListPageLayout, SERVICE_ROWS } from "@tailor/react/layouts/list-page/list-page";
import { SettingsPageLayout } from "@tailor/react/layouts/settings-page/settings-page";
import { SideNavShell } from "@tailor/react/shell-sidenav/sidenav/sidenav";
import type { ReactNode } from "react";
import type { AppContext } from "./app-context";
import { ERROR_DETAILS, LONG_SERVICE, MANY_ROWS, SERVICES_ERROR } from "./stress";

const HOSTS = [
  { name: "nas", address: "10.0.0.2", services: 3, load: "34%" },
  { name: "web-1", address: "10.0.0.3", services: 1, load: "12%" },
  { name: "edge", address: "10.0.0.4", services: 0, load: "3%" },
];

export const FOOTER: FooterFact[] = [{ id: "version", label: "Version", value: "2.4.1" }];

/** The pages that the Services link stands for. */
const SERVICE_PAGES = /^(services|service|add)(-|$)/;

/** The links of the console. `current` marks the page where no router can tell (the HTML kit). */
export function consoleNav({ href, current }: AppContext): NavGroup[] {
  const item = (id: string, label: string, icon: NavItem["icon"], extra: Partial<NavItem> = {}): NavItem => ({
    id,
    label,
    icon,
    to: href(id),
    current:
      current === undefined
        ? undefined
        : current === id || (id === "services" && SERVICE_PAGES.test(current)),
    ...extra,
  });
  return [
    {
      id: "run",
      label: "Run",
      items: [
        item("overview", "Overview", "bi:speedometer2", { exact: true }),
        item("services", "Services", "bi:hdd-stack", { counter: SERVICE_ROWS.length }),
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

function Actions({ href }: { href: AppContext["href"] }) {
  return (
    <Menu
      trigger={<Button variant="ghost" icon={<Avatar name="alice" size="sm" />} label="alice" />}
      label="alice"
      align="end"
      items={[
        { id: "settings", label: "Settings", to: href("settings") },
        { type: "separator" },
        { id: "sign-out", label: "Sign out" },
      ]}
    />
  );
}

/** The console inside the side navigation shell. */
export function ConsoleFrame({ context, children }: { context: AppContext; children: ReactNode }) {
  return (
    <SideNavShell
      brand={{ name: "Console", icon: "bi:box-seam", to: context.href("overview") }}
      nav={consoleNav(context)}
      search={<Search label="Search the console" placeholder="Search" size="sm" shortcut={false} />}
      actions={<Actions href={context.href} />}
      footer={FOOTER}
      theme={["skin", "palette", "mode"]}
      storageKey="tailor-showcase.demo.sidenav"
    >
      {children}
    </SideNavShell>
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

/** The page of the console with the given id. */
export function ConsolePage({ id, context }: { id: string; context: AppContext }) {
  switch (id) {
    case "overview":
      return <DashboardPageLayout />;
    case "services":
      return <ListPageLayout />;
    case "service":
      return <DetailPageLayout />;
    case "hosts":
      return <HostsPage />;
    case "add":
      return <FormDialogLayout />;
    case "settings":
      return <SettingsPageLayout />;
    case "services-many":
      return <ListPageLayout rows={MANY_ROWS} />;
    case "services-empty":
      return <ListPageLayout rows={[]} />;
    case "services-loading":
      return <ListPageLayout rows={[]} loading />;
    case "services-error":
      return <ListPageLayout rows={[]} error={SERVICES_ERROR} />;
    case "service-long":
      return <DetailPageLayout service={LONG_SERVICE} />;
    case "overview-loading":
      return <LoadingPage delay={0} variant="skeleton" />;
    case "overview-error":
      return (
        <ErrorPage
          text="The overview could not load the state of the hosts. Try again in a moment."
          details={ERROR_DETAILS}
          homeTo={context.href("overview")}
        />
      );
    default:
      return <NotFoundPage homeTo={context.href("overview")} />;
  }
}
