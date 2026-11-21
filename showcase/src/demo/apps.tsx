/** The sample app of each shell, for both kits: its frame (the shell) and its pages. */
import { EmptyState } from "@tailor/react/core/empty-state/empty-state";
import { Icon } from "@tailor/react/core/icon/icon";
import type { ReactNode } from "react";
import { BarePage } from "./account";
import type { AppContext } from "./app-context";
import { ConsoleFrame, ConsolePage } from "./console";
import { FilesApp } from "./files";
import type { AppShell } from "./routes";
import { ToolFrame, ToolPage } from "./tool";

export const hasApp = (shell: string): shell is AppShell =>
  shell === "topnav" || shell === "sidenav" || shell === "workspace" || shell === "bare";

/**
 * The part of the app that stays while its pages change: the shell with its navigation. The workspace and
 * the bare pages draw their own shell, so their frame is empty.
 */
export function AppFrame({
  shell,
  context,
  children,
}: {
  shell: AppShell;
  context: AppContext;
  children: ReactNode;
}) {
  if (shell === "sidenav") return <ConsoleFrame context={context}>{children}</ConsoleFrame>;
  if (shell === "topnav") return <ToolFrame context={context}>{children}</ToolFrame>;
  return <>{children}</>;
}

/** One page of an app, inside its frame. */
export function AppPage({ shell, id, context }: { shell: AppShell; id: string; context: AppContext }) {
  switch (shell) {
    case "sidenav":
      return <ConsolePage id={id} context={context} />;
    case "topnav":
      return <ToolPage id={id} />;
    case "workspace":
      return <FilesApp id={id} />;
    case "bare":
      return <BarePage id={id} context={context} />;
  }
}

/** A shell that the registry names but this build does not hold. */
export function NotBuilt({ id }: { id: string }) {
  return (
    <div className="sc-demo-fill">
      <EmptyState
        icon={<Icon name="bi:cone-striped" />}
        title="Not built yet"
        text={`The shell "${id}" has no sample app in this build of tailor.`}
      />
    </div>
  );
}
