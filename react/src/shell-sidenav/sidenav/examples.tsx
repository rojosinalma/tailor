import {
  ACTIONS,
  BRAND,
  FOOTER,
  GROUPS,
  MANY_GROUPS,
  NAV_IN_SECTION,
  SEARCH,
  ServicesPage,
} from "../../core/shell-base/sample";
import { defineExamples } from "../../examples";
import { SideNavShell } from "./sidenav";

export default defineExamples("sidenav", [
  {
    id: "default",
    title: "Groups, a section, actions, footer facts and theme controls in the column",
    note: "The toggle at the top collapses the column to icons; the state survives a reload.",
    display: "frame",
    render: () => (
      <SideNavShell
        brand={BRAND}
        nav={GROUPS}
        search={SEARCH}
        actions={ACTIONS}
        footer={FOOTER}
        theme={["palette", "mode"]}
        storageKey="example.sidenav.default"
        contained
      >
        <ServicesPage />
      </SideNavShell>
    ),
  },
  {
    id: "section",
    title: "A plain list with the current page in a section: the section starts open",
    display: "frame",
    render: () => (
      <SideNavShell
        brand={BRAND}
        nav={NAV_IN_SECTION}
        footer={FOOTER}
        storageKey="example.sidenav.section"
        contained
      >
        <ServicesPage title="Backups" />
      </SideNavShell>
    ),
  },
  {
    id: "many",
    title: "A long list scrolls inside the column; hints after two labels",
    note: "Many named links: with tabletCollapsed false the column starts open on a tablet too.",
    display: "frame",
    render: () => (
      <SideNavShell
        brand={BRAND}
        nav={MANY_GROUPS}
        footer={FOOTER}
        storageKey="example.sidenav.many"
        tabletCollapsed={false}
        contained
      >
        <ServicesPage />
      </SideNavShell>
    ),
  },
  {
    id: "empty",
    title: "No links: no toggle, no menu button, no drawer",
    display: "frame",
    render: () => (
      <SideNavShell brand={BRAND} nav={[]} footer={FOOTER} storageKey={false} contained>
        <ServicesPage />
      </SideNavShell>
    ),
  },
  {
    id: "narrow",
    title: "Narrow: the phone form with a top bar and the menu button",
    display: "frame",
    width: "sm",
    render: () => (
      <SideNavShell
        brand={BRAND}
        nav={GROUPS}
        search={SEARCH}
        actions={ACTIONS}
        footer={FOOTER}
        storageKey={false}
        contained
      >
        <ServicesPage />
      </SideNavShell>
    ),
  },
  {
    id: "phone-bar",
    title: "Narrow, with the bottom bar",
    note: "The first-level links of every group, in order.",
    display: "frame",
    width: "sm",
    render: () => (
      <SideNavShell
        brand={BRAND}
        nav={GROUPS}
        search={SEARCH}
        actions={ACTIONS}
        footer={FOOTER}
        phoneNav="bar"
        storageKey={false}
        contained
      >
        <ServicesPage />
      </SideNavShell>
    ),
  },
]);
