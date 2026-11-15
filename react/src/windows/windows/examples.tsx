import { useState } from "react";
import { Button } from "../../core/button/button";
import { Cluster } from "../../core/cluster/cluster";
import { Field } from "../../core/field/field";
import { Icon } from "../../core/icon/icon";
import { Stack } from "../../core/stack/stack";
import { Table } from "../../core/table/table";
import { Textarea } from "../../core/textarea/textarea";
import { defineExamples } from "../../examples";
import { useWindows, Window, WindowsProvider } from "./windows";

const hosts = [
  { name: "web-1", role: "web", address: "10.0.0.11" },
  { name: "web-2", role: "web", address: "10.0.0.12" },
  { name: "nas", role: "storage", address: "10.0.0.20" },
];

function HostWindow() {
  return (
    <Stack gap="2">
      <p>web-1 serves example.com and runs nginx 1.27.</p>
      <p>Last change by alice on Nov 14, 2026.</p>
    </Stack>
  );
}

function Notes() {
  const windows = useWindows();
  return (
    <Stack>
      <Field label="Notes">
        <Textarea rows={5} defaultValue="Move the backups of web-1 to nas." />
      </Field>
      <Cluster>
        <Button
          onClick={() =>
            windows.open({
              id: "host",
              title: "Host web-1",
              icon: <Icon name="bi:hdd-stack" />,
              content: <HostWindow />,
            })
          }
        >
          Open host web-1
        </Button>
      </Cluster>
    </Stack>
  );
}

function Preview() {
  return (
    <Table
      caption="Hosts"
      density="compact"
      rowKey={(row) => row.name}
      rows={hosts}
      columns={[
        { key: "name", header: "Name" },
        { key: "role", header: "Role" },
        { key: "address", header: "Address" },
      ]}
    />
  );
}

function Openers() {
  const windows = useWindows();
  const open = windows.windows.length;
  return (
    <Cluster>
      <Button
        onClick={() =>
          windows.open({
            id: "notes",
            title: "Notes",
            icon: <Icon name="bi:journal-text" />,
            content: <Notes />,
          })
        }
      >
        Open notes
      </Button>
      <Button
        onClick={() =>
          windows.open({
            id: "preview",
            title: "Preview",
            icon: <Icon name="bi:table" />,
            content: <Preview />,
            size: { width: 420, height: 280 },
          })
        }
      >
        Open preview
      </Button>
      <span>{open === 1 ? "1 window open" : `${open} windows open`}</span>
    </Cluster>
  );
}

function Declarative() {
  const [open, setOpen] = useState(false);
  return (
    <WindowsProvider>
      <Cluster>
        <Button onClick={() => setOpen(true)}>Show the log</Button>
      </Cluster>
      <Window id="log" title="Log of web-1" open={open} onOpenChange={setOpen}>
        <Stack gap="1">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={String(i)}>12:{String(i).padStart(2, "0")} web-1 GET /status 200</span>
          ))}
        </Stack>
      </Window>
    </WindowsProvider>
  );
}

export default defineExamples("windows", [
  {
    id: "default",
    title: "Notes and preview",
    note: "The page stays usable behind the windows. Drag a title bar to move a window, an edge to resize it. F6 moves the focus between the page and the windows.",
    render: () => (
      <WindowsProvider>
        <Openers />
      </WindowsProvider>
    ),
  },
  {
    id: "declarative",
    title: "A window in the React tree",
    note: "Window with open and onOpenChange: the content scrolls by itself.",
    render: () => <Declarative />,
  },
  {
    id: "remembered",
    title: "Remembered layout",
    note: "With storageKey, each window opens again where the user left it, also after a reload.",
    render: () => (
      <WindowsProvider storageKey="example-windows">
        <Openers />
      </WindowsProvider>
    ),
  },
]);
