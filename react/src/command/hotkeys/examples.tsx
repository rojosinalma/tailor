import { useState } from "react";
import { Button } from "../../core/button/button";
import { Dialog } from "../../core/dialog/dialog";
import { Fact, Facts } from "../../core/facts/facts";
import { Field } from "../../core/field/field";
import { Input } from "../../core/input/input";
import { Stack } from "../../core/stack/stack";
import { Switch } from "../../core/switch/switch";
import { defineExamples } from "../../examples";
import { HotkeysProvider, Keys, useHotkey, useHotkeysList } from "./hotkeys";

/** Registers "N" while it is mounted. */
function NewHostShortcut({ onRun }: { onRun: () => void }) {
  useHotkey({ id: "new-host", keys: "N", label: "New host", group: "Hosts", run: onRun });
  return null;
}

function ShortcutList() {
  const list = useHotkeysList();
  return (
    <Facts>
      {list.map((hotkey) => (
        <Fact key={hotkey.id} name={hotkey.label}>
          <Keys keys={hotkey.keys} />
        </Fact>
      ))}
    </Facts>
  );
}

function Registered() {
  const [last, setLast] = useState("none yet");
  const [withNew, setWithNew] = useState(true);
  useHotkey({
    id: "go-hosts",
    keys: "G then H",
    label: "Go to hosts",
    group: "Go to",
    run: () => setLast("Go to hosts"),
  });
  useHotkey({
    id: "go-settings",
    keys: "G then S",
    label: "Go to settings",
    group: "Go to",
    run: () => setLast("Go to settings"),
  });
  useHotkey({ id: "save", keys: "Mod+S", label: "Save", run: () => setLast("Save") });
  useHotkey({
    id: "refresh",
    keys: "Shift+R",
    label: "Refresh the list",
    run: () => setLast("Refresh the list"),
  });
  return (
    <Stack>
      <p aria-live="polite">Last shortcut: {last}</p>
      <Switch label="The N shortcut" checked={withNew} onCheckedChange={setWithNew} />
      {withNew ? <NewHostShortcut onRun={() => setLast("New host")} /> : null}
      <Field label="Host name">
        <Input placeholder="web-1" />
      </Field>
      <ShortcutList />
    </Stack>
  );
}

/** "E" in the dialog fires while it is open; the page's "E" does not. */
function DialogShortcut({ onRun }: { onRun: () => void }) {
  useHotkey({ id: "edit-host", keys: "E", label: "Edit the host", run: onRun });
  return <p>Press E to edit web-1.</p>;
}

function InDialog() {
  const [last, setLast] = useState("none yet");
  useHotkey({ id: "page-e", keys: "E", label: "Export", run: () => setLast("Export") });
  return (
    <Stack>
      <p aria-live="polite">Last shortcut: {last}</p>
      <Dialog trigger={<Button>Host web-1</Button>} title="Host web-1">
        <DialogShortcut onRun={() => setLast("Edit the host")} />
      </Dialog>
    </Stack>
  );
}

export default defineExamples("hotkeys", [
  {
    id: "registered",
    title: "Registered shortcuts",
    note: "Press G then H, G then S, Shift+R, N or Mod+S. In the text field only Mod+S fires.",
    render: () => (
      <HotkeysProvider>
        <Registered />
      </HotkeysProvider>
    ),
  },
  {
    id: "dialog",
    title: "In a dialog",
    note: "A shortcut registered inside a Dialog or Drawer fires only while it is open; the page's own do not.",
    render: () => (
      <HotkeysProvider>
        <InDialog />
      </HotkeysProvider>
    ),
  },
  {
    id: "keys",
    title: "Keys",
    note: "Mod shows as ⌘ on Apple devices and as Ctrl elsewhere.",
    render: () => (
      <HotkeysProvider>
        <Facts>
          {["Mod+K", "Mod+Shift+P", "Shift+?", "G then S", "/", "Escape", "Alt+ArrowUp"].map((keys) => (
            <Fact key={keys} name={keys}>
              <Keys keys={keys} />
            </Fact>
          ))}
        </Facts>
      </HotkeysProvider>
    ),
  },
]);
