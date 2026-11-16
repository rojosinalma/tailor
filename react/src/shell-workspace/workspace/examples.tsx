import { defineExamples } from "../../examples";
import {
  FilePage,
  WS_ACTIONS,
  WS_BOTTOM,
  WS_BRAND,
  WS_FOOTER,
  WS_NAV,
  WS_PANELS,
  WS_SETTINGS,
  WS_TREE,
} from "./sample";
import { WorkspaceShell } from "./workspace";

export default defineExamples("workspace", [
  {
    id: "default",
    title: "Area links, a file list, the centre, three right panels, an output panel and settings",
    note: "Drag or arrow the edges to resize; the layout survives a reload. F6 moves between the regions.",
    display: "frame",
    render: () => (
      <WorkspaceShell
        brand={WS_BRAND}
        nav={WS_NAV}
        sidebar={WS_TREE}
        sidebarLabel="Files"
        actions={WS_ACTIONS}
        footer={WS_FOOTER}
        panels={WS_PANELS}
        bottom={WS_BOTTOM}
        settings={WS_SETTINGS}
        storageKey="example.workspace.default"
        contained
      >
        <FilePage />
      </WorkspaceShell>
    ),
  },
  {
    id: "push",
    title: 'panelMode="push": the open panel makes the centre narrower',
    display: "frame",
    render: () => (
      <WorkspaceShell
        brand={WS_BRAND}
        nav={WS_NAV}
        sidebar={WS_TREE}
        sidebarLabel="Files"
        footer={WS_FOOTER}
        panels={WS_PANELS}
        panelMode="push"
        defaultPanel="details"
        storageKey="example.workspace.push"
        contained
      >
        <FilePage />
      </WorkspaceShell>
    ),
  },
  {
    id: "centre",
    title: "The centre only: the top bar and the content",
    display: "frame",
    render: () => (
      <WorkspaceShell brand={WS_BRAND} storageKey={false} contained>
        <FilePage />
      </WorkspaceShell>
    ),
  },
  {
    id: "narrow",
    title: "Narrow: the phone form; the top bar opens each region as a sheet",
    display: "frame",
    width: "sm",
    render: () => (
      <WorkspaceShell
        brand={WS_BRAND}
        nav={WS_NAV}
        sidebar={WS_TREE}
        sidebarLabel="Files"
        footer={WS_FOOTER}
        panels={WS_PANELS}
        bottom={WS_BOTTOM}
        settings={WS_SETTINGS}
        storageKey={false}
        contained
      >
        <FilePage />
      </WorkspaceShell>
    ),
  },
]);
