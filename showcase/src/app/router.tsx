/** The site's routes: the overview, a component page and a shell page, in the side navigation shell. */

import type { ComponentSpec } from "@tailor/core/spec";
import { routeErrorComponent } from "@tailor/react/core/error-page/error-page";
import { routePendingComponent } from "@tailor/react/core/loading-page/loading-page";
import { routeNotFoundComponent } from "@tailor/react/core/not-found/not-found";
import { Search } from "@tailor/react/core/search/search";
import type { NavGroup, NavItem } from "@tailor/react/core/shell-base/shell-base";
import { OfflineBanner } from "@tailor/react/pwa/offline-banner/offline-banner";
import { PwaInstall } from "@tailor/react/pwa/pwa-install/pwa-install";
import { PwaUpdate } from "@tailor/react/pwa/pwa-update/pwa-update";
import { SideNavShell } from "@tailor/react/shell-sidenav/sidenav/sidenav";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { useState } from "react";
import { EXAMPLES } from "../examples.gen";
import {
  COMPONENT_GROUPS,
  COMPONENTS,
  componentById,
  GROUP_LABELS,
  isShell,
  REPOSITORY,
  SHELLS,
  VERSION,
} from "./data";
import { ComponentPage, OverviewPage, ShellPage } from "./pages";
import { SIDEBAR_KEY, useAddressSync, validateSearch } from "./state";

const matches = (spec: ComponentSpec, query: string): boolean =>
  [spec.name, spec.id, spec.pack, spec.description].some((text) => text.toLowerCase().includes(query));

const link = (spec: ComponentSpec): NavItem => ({
  id: spec.id,
  label: spec.name,
  // The pack shows when it is not core; a shell's pack is its own name.
  hint: spec.pack === "core" || isShell(spec) ? undefined : spec.pack,
  to: isShell(spec) ? `/shells/${spec.id}` : `/components/${spec.id}`,
});

/** The sidebar: the overview, the shells, the layouts and one group per component group, filtered by the query. */
export function siteNav(query: string): NavGroup[] {
  const q = query.trim().toLowerCase();
  const keep = (specs: readonly ComponentSpec[]): NavItem[] =>
    specs.filter((spec) => q === "" || matches(spec, q)).map(link);
  const groups: NavGroup[] = [
    { id: "home", items: [{ id: "overview", label: "Overview", icon: "bi:house", to: "/", exact: true }] },
    {
      id: "shells",
      label: GROUP_LABELS.shells,
      items: keep([...SHELLS, ...COMPONENTS.filter((c) => c.group === "shells" && !isShell(c))]),
    },
    {
      id: "layouts",
      label: GROUP_LABELS.layouts,
      items: keep(COMPONENTS.filter((c) => c.group === "layouts")),
    },
    ...COMPONENT_GROUPS.map(({ group, items }) => ({
      id: group,
      label: GROUP_LABELS[group],
      items: keep(items),
    })),
  ];
  return groups.filter((group) => group.items.length > 0);
}

function Frame() {
  const [query, setQuery] = useState("");
  useAddressSync();
  return (
    <SideNavShell
      brand={{ name: "tailor", icon: "bi:scissors", to: "/" }}
      nav={siteNav(query)}
      search={
        <Search
          label="Filter components"
          placeholder="Filter"
          size="sm"
          value={query}
          onValueChange={setQuery}
        />
      }
      footer={[
        { id: "version", label: "Version", value: VERSION },
        { id: "repository", value: "Source", to: REPOSITORY },
        { id: "install", value: <PwaInstall /> },
      ]}
      theme={["skin", "palette", "mode"]}
      storageKey={SIDEBAR_KEY}
      // The site's links are many and named: icons alone cannot tell them apart, so a tablet starts open too.
      tabletCollapsed={false}
    >
      <PwaUpdate />
      <OfflineBanner />
      <Outlet />
    </SideNavShell>
  );
}

const root = createRootRoute({
  validateSearch,
  search: { middlewares: [retainSearchParams(true)] },
  component: Frame,
});

const overview = createRoute({ getParentRoute: () => root, path: "/", component: OverviewPage });

/** The spec and the examples of the component in the address; an unknown id is a not-found page. */
async function load(id: string, shell: boolean) {
  const spec = componentById(id);
  const examples = EXAMPLES[id];
  if (!spec || !examples || isShell(spec) !== shell) throw notFound();
  return { spec, set: (await examples()).default };
}

const component = createRoute({
  getParentRoute: () => root,
  path: "/components/$id",
  loader: ({ params }) => load(params.id, false),
  component: function Component() {
    const { spec, set } = component.useLoaderData();
    return <ComponentPage key={spec.id} spec={spec} set={set} />;
  },
});

const shell = createRoute({
  getParentRoute: () => root,
  path: "/shells/$id",
  loader: ({ params }) => load(params.id, true),
  component: function Shell() {
    const { spec, set } = shell.useLoaderData();
    return <ShellPage key={spec.id} spec={spec} set={set} />;
  },
});

export const router = createRouter({
  routeTree: root.addChildren([overview, component, shell]),
  history: createHashHistory(),
  defaultPendingComponent: routePendingComponent,
  defaultErrorComponent: routeErrorComponent,
  defaultNotFoundComponent: routeNotFoundComponent,
  notFoundMode: "root",
  scrollRestoration: true,
});
