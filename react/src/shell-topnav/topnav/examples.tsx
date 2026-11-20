import {
  ACTIONS,
  BRAND,
  FOOTER,
  MANY,
  NAV,
  NAV_IN_SECTION,
  SEARCH,
  ServicesPage,
} from "../../core/shell-base/sample";
import { defineExamples } from "../../examples";
import { TopNavShell } from "./topnav";

export default defineExamples("topnav", [
  {
    id: "default",
    title: "Links, a section with sub-items, actions and the footer row",
    display: "frame",
    render: () => (
      <TopNavShell brand={BRAND} nav={NAV} search={SEARCH} actions={ACTIONS} footer={FOOTER} contained>
        <ServicesPage />
      </TopNavShell>
    ),
  },
  {
    id: "section",
    title: "The current page in a section, the theme controls in the footer",
    display: "frame",
    render: () => (
      <TopNavShell
        brand={BRAND}
        nav={NAV_IN_SECTION}
        footer={FOOTER}
        theme={["skin", "palette", "mode"]}
        contained
      >
        <ServicesPage title="Backups" />
      </TopNavShell>
    ),
  },
  {
    id: "many",
    title: 'Many links: those that do not fit go into "More"; the current link stays',
    display: "frame",
    render: () => (
      <TopNavShell brand={BRAND} nav={MANY} search={SEARCH} actions={ACTIONS} footer={FOOTER} contained>
        <ServicesPage />
      </TopNavShell>
    ),
  },
  {
    id: "empty",
    title: "No links: no menu button, no drawer",
    display: "frame",
    render: () => (
      <TopNavShell brand={BRAND} nav={[]} footer={FOOTER} contained>
        <ServicesPage />
      </TopNavShell>
    ),
  },
  {
    id: "empty-narrow",
    title: "No links, narrow: the footer stays, its theme controls take the compact form",
    note: "With no links there is no drawer, so the footer row stays on a phone. As narrow as a phone, it shows one theme button, so the facts keep their width.",
    display: "frame",
    width: "sm",
    render: () => (
      <TopNavShell brand={BRAND} nav={[]} footer={FOOTER} theme={["skin", "palette", "mode"]} contained>
        <ServicesPage />
      </TopNavShell>
    ),
  },
  {
    id: "narrow",
    title: "Narrow: the phone form with the menu button",
    note: "The menu button opens the navigation drawer; the footer facts and the theme controls are in it.",
    display: "frame",
    width: "sm",
    render: () => (
      <TopNavShell brand={BRAND} nav={NAV} search={SEARCH} actions={ACTIONS} footer={FOOTER} contained>
        <ServicesPage />
      </TopNavShell>
    ),
  },
  {
    id: "phone-bar",
    title: "Narrow, with the bottom bar",
    note: 'Four links and "More", which opens the drawer with the rest.',
    display: "frame",
    width: "sm",
    render: () => (
      <TopNavShell
        brand={BRAND}
        nav={NAV}
        search={SEARCH}
        actions={ACTIONS}
        footer={FOOTER}
        phoneNav="bar"
        contained
      >
        <ServicesPage />
      </TopNavShell>
    ),
  },
]);
