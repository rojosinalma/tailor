/** The sample file editor of the workspace shell: a file in the centre, its output in the bottom panel. */
import { Button } from "@tailor/react/core/button/button";
import { CodeBlock } from "@tailor/react/core/code-block/code-block";
import { Page } from "@tailor/react/core/page/page";
import { Pane } from "@tailor/react/core/pane/pane";
import { LogView } from "@tailor/react/data/log-view/log-view";
import {
  FilePage,
  WS_BOTTOM,
  WS_BRAND,
  WS_FOOTER,
  WS_NAV,
  WS_PANELS,
  WS_SEARCH,
  WS_SETTINGS,
  WS_TREE,
} from "@tailor/react/shell-workspace/workspace/sample";
import { WorkspaceShell } from "@tailor/react/shell-workspace/workspace/workspace";
import { LONG_CODE, LONG_FILE_PATH, LONG_LOG } from "./stress";

/** A long file with long lines, in the same frame as the sample file. */
function LongFilePage() {
  return (
    <Page
      title="compose.yaml"
      description={LONG_FILE_PATH}
      mode="fill"
      actions={
        <Button size="sm" variant="primary">
          Save
        </Button>
      }
    >
      <Pane label="compose.yaml" padding="none">
        <CodeBlock code={LONG_CODE} title={LONG_FILE_PATH} />
      </Pane>
    </Page>
  );
}

export function FilesApp({ id }: { id: string }) {
  const long = id === "editor-long";
  return (
    <WorkspaceShell
      brand={WS_BRAND}
      nav={WS_NAV}
      sidebar={WS_TREE}
      sidebarLabel="Files"
      search={WS_SEARCH}
      footer={WS_FOOTER}
      panels={WS_PANELS}
      bottom={
        long ? { ...WS_BOTTOM, content: <LogView label="Container log" lines={LONG_LOG} /> } : WS_BOTTOM
      }
      settings={WS_SETTINGS}
      storageKey={false}
    >
      {long ? <LongFilePage /> : <FilePage />}
    </WorkspaceShell>
  );
}
