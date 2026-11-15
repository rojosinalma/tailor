import { useState } from "react";
import { Button } from "../../core/button/button";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { HotkeysProvider, useHotkey } from "../hotkeys/hotkeys";
import { HotkeysHelp } from "./hotkeys-help";

/** A few shortcuts of a sample app, so the help has something to list. */
function SampleShortcuts() {
  const [last, setLast] = useState("none yet");
  const go = (label: string) => () => setLast(label);
  useHotkey({
    id: "go-dashboard",
    keys: "G then D",
    label: "Go to the dashboard",
    group: "Go to",
    run: go("Dashboard"),
  });
  useHotkey({ id: "go-hosts", keys: "G then H", label: "Go to hosts", group: "Go to", run: go("Hosts") });
  useHotkey({
    id: "go-settings",
    keys: "G then S",
    label: "Go to settings",
    group: "Go to",
    run: go("Settings"),
  });
  useHotkey({ id: "new-host", keys: "N", label: "Add a host", group: "Hosts", run: go("Add a host") });
  useHotkey({ id: "restart", keys: "Shift+R", label: "Restart web-1", group: "Hosts", run: go("Restart") });
  useHotkey({ id: "find", keys: "/", label: "Search the hosts", group: "Hosts", run: go("Search") });
  useHotkey({ id: "save", keys: "Mod+S", label: "Save the changes", run: go("Save") });
  return <p aria-live="polite">Last shortcut: {last}</p>;
}

export default defineExamples("hotkeys-help", [
  {
    id: "default",
    title: "Shortcuts help",
    note: "Press Shift+? or the button.",
    render: () => (
      <HotkeysProvider>
        <Stack align="start">
          <SampleShortcuts />
          <HotkeysHelp trigger={<Button>Keyboard shortcuts</Button>} />
        </Stack>
      </HotkeysProvider>
    ),
  },
]);
