import { useEffect, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { HotkeysProvider, Keys, useHotkey } from "../hotkeys/hotkeys";
import { type CommandGroup, type CommandItem, CommandPalette } from "./command-palette";

const HOSTS = ["web-1", "web-2", "web-3", "db-1", "nas", "backup", "gateway"];

function Groups() {
  const [last, setLast] = useState("none yet");
  const run = (label: string) => () => setLast(label);
  useHotkey({
    id: "refresh",
    keys: "Shift+R",
    label: "Refresh the list",
    group: "Hosts",
    run: run("Refresh the list"),
  });
  useHotkey({
    id: "go-settings",
    keys: "G then S",
    label: "Go to settings",
    group: "Go to",
    run: run("Go to settings"),
  });
  const groups: CommandGroup[] = [
    {
      id: "places",
      label: "Places",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "bi:speedometer2", to: "#dashboard" },
        {
          id: "hosts",
          label: "Hosts",
          icon: "bi:hdd-stack",
          keywords: ["servers", "machines"],
          to: "#hosts",
        },
        {
          id: "settings",
          label: "Settings",
          icon: "bi:gear",
          keywords: ["preferences"],
          keys: "G then S",
          onSelect: run("Go to settings"),
        },
      ],
    },
    {
      id: "actions",
      label: "Actions",
      items: [
        { id: "add", label: "Add a host", icon: "bi:plus-lg", keys: "N", onSelect: run("Add a host") },
        { id: "restart", label: "Restart web-1", icon: "bi:arrow-clockwise", onSelect: run("Restart web-1") },
        {
          id: "theme",
          label: "Switch to the light theme",
          icon: "bi:sun",
          keys: "Mod+Shift+L",
          onSelect: run("Light theme"),
        },
        { id: "delete", label: "Delete nas", icon: "bi:trash", disabled: true },
      ],
    },
  ];
  const recent: CommandItem[] = [
    { id: "web-1", label: "web-1", icon: "bi:clock-history", onSelect: run("Open web-1") },
  ];
  return (
    <Stack align="start">
      <p aria-live="polite">Last command: {last}</p>
      <CommandPalette
        groups={groups}
        recent={recent}
        includeHotkeys
        trigger={
          <Button>
            Search commands <Keys keys="Mod+K" />
          </Button>
        }
      />
    </Stack>
  );
}

/** A search that the caller runs: the results come back a moment later. */
function Remote() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onSearch = (next: string): void => {
    setText(next);
    clearTimeout(timer.current);
    if (!next.trim()) {
      setLoading(false);
      setFound([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      setFound(HOSTS.filter((host) => host.includes(next.trim().toLowerCase())));
      setLoading(false);
    }, 600);
  };
  const groups: CommandGroup[] =
    text.trim() && !loading
      ? [
          {
            id: "hosts",
            label: "Hosts",
            items: found.map((host) => ({ id: host, label: host, icon: "bi:hdd", to: `#${host}` })),
          },
        ]
      : [];
  return (
    <CommandPalette
      groups={groups}
      onSearch={onSearch}
      loading={loading}
      placeholder="Search the hosts"
      empty={text.trim() ? "No host matches" : "Type a host name"}
      shortcut={false}
      trigger={<Button>Search hosts</Button>}
    />
  );
}

export default defineExamples("command-palette", [
  {
    id: "groups",
    title: "Groups, icons and shortcuts",
    note: "Press Mod+K or the button. The shortcuts of the page are a group too.",
    render: () => (
      <HotkeysProvider>
        <Groups />
      </HotkeysProvider>
    ),
  },
  {
    id: "remote",
    title: "A search that the caller runs",
    note: "It shows a spinner while the results load. Try web or nas.",
    render: () => (
      <HotkeysProvider>
        <Remote />
      </HotkeysProvider>
    ),
  },
  {
    id: "empty",
    title: "No result",
    render: () => (
      <HotkeysProvider>
        <CommandPalette
          groups={[]}
          empty="No commands yet"
          shortcut={false}
          trigger={<Button>Open an empty palette</Button>}
        />
      </HotkeysProvider>
    ),
  },
]);
