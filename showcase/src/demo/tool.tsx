/** The sample tool of the top navigation shell: it renders a drawing to a picture, and has its settings. */
import { Search } from "@tailor/react/core/search/search";
import type { NavItem } from "@tailor/react/core/shell-base/shell-base";
import { SettingsPageLayout } from "@tailor/react/layouts/settings-page/settings-page";
import { ToolPageLayout } from "@tailor/react/layouts/tool-page/tool-page";
import { TopNavShell } from "@tailor/react/shell-topnav/topnav/topnav";
import type { ReactNode } from "react";
import type { AppContext } from "./app-context";
import { FOOTER } from "./console";
import { LARGE_RESULT, RENDER_FAILURE, TALL_RESULT } from "./stress";

function toolNav({ href, current }: AppContext): NavItem[] {
  const item = (id: string, label: string, icon: NavItem["icon"]): NavItem => ({
    id,
    label,
    icon,
    to: href(id),
    exact: id === "render",
    current: current === undefined ? undefined : current.split("-")[0] === id,
  });
  return [item("render", "Render", "bi:image"), item("settings", "Settings", "bi:gear")];
}

export function ToolFrame({ context, children }: { context: AppContext; children: ReactNode }) {
  return (
    <TopNavShell
      brand={{ name: "Thumbnails", icon: "bi:image", to: context.href("render") }}
      nav={toolNav(context)}
      search={<Search label="Search the drawings" placeholder="Search" size="sm" shortcut={false} />}
      footer={FOOTER}
      theme={["skin", "palette", "mode"]}
    >
      {children}
    </TopNavShell>
  );
}

export function ToolPage({ id }: { id: string }) {
  switch (id) {
    case "settings":
      return <SettingsPageLayout />;
    case "render-large":
      return <ToolPageLayout result={LARGE_RESULT} />;
    case "render-tall":
      return <ToolPageLayout result={TALL_RESULT} />;
    case "render-busy":
      return <ToolPageLayout result={null} rendering />;
    case "render-failed":
      return <ToolPageLayout result={null} error={RENDER_FAILURE} />;
    default:
      return <ToolPageLayout />;
  }
}
