import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { Dialog } from "../../core/dialog/dialog";
import { Icon } from "../../core/icon/icon";
import { Input } from "../../core/input/input";
import { Select } from "../../core/select/select";
import { Switch } from "../../core/switch/switch";
import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { Setting, Settings, SettingsSection, useAutoSave } from "./settings";

/** Saves one setting with { name, value } as JSON. The HTML kit sends the same request by itself. */
const saver =
  (name: string) =>
  async (value: unknown): Promise<{ ok: boolean; message?: string }> => {
    const response = await fetch(`/api/settings/${name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, value }),
    });
    return response.json();
  };

const url = (name: string): string => `/api/settings/${name}`;

const themes = [
  { value: "system", label: "Same as the device" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
];

const sections = [
  { id: "look", label: "Look", icon: <Icon name="bi:palette" /> },
  { id: "account", label: "Account", icon: <Icon name="bi:person" /> },
  { id: "alerts", label: "Alerts", icon: <Icon name="bi:bell" /> },
];

function Rows() {
  const theme = useAutoSave({ value: "system", save: saver("theme") });
  const language = useAutoSave({ value: "en", save: saver("language") });
  const compact = useAutoSave({ value: false, save: saver("compact") });
  const name = useAutoSave({ value: "Alice", save: saver("display-name"), delay: 800 });
  const email = useAutoSave({ value: "alice@example.com", save: saver("email"), delay: 800 });
  const alerts = useAutoSave({ value: true, save: saver("alerts") });
  const digest = useAutoSave({ value: "daily", save: saver("digest") });
  return (
    <>
      <SettingsSection id="look" title="Look" description="How the app looks on this device.">
        <Setting label="Theme" description="Dark or light colours." state={theme} saveUrl={url("theme")}>
          <Select name="theme" options={themes} value={theme.value} onValueChange={theme.setValue} />
        </Setting>
        <Setting
          label="Language"
          help="Dates and numbers follow the language too."
          state={language}
          saveUrl={url("language")}
        >
          <Select
            name="language"
            options={languages}
            value={language.value}
            onValueChange={language.setValue}
          />
        </Setting>
        <Setting
          label="Compact lists"
          description="Shows more rows on the screen."
          state={compact}
          saveUrl={url("compact")}
        >
          <Switch
            name="compact"
            label="Compact lists"
            checked={compact.value}
            onCheckedChange={compact.setValue}
          />
        </Setting>
      </SettingsSection>
      <SettingsSection id="account" title="Account">
        <Setting
          label="Display name"
          description="Others see this name."
          state={name}
          saveUrl={url("display-name")}
        >
          <Input name="display-name" value={name.value} onValueChange={name.setValue} autoComplete="name" />
        </Setting>
        <Setting label="Email" state={email} saveUrl={url("email")}>
          <Input
            name="email"
            type="email"
            value={email.value}
            onValueChange={email.setValue}
            autoComplete="email"
          />
        </Setting>
      </SettingsSection>
      <SettingsSection id="alerts" title="Alerts" description="When the app tells you about your hosts.">
        <Setting
          label="Host alerts"
          description="A notice when a host stops answering."
          state={alerts}
          saveUrl={url("alerts")}
        >
          <Switch
            name="alerts"
            label="Host alerts"
            checked={alerts.value}
            onCheckedChange={alerts.setValue}
          />
        </Setting>
        <Setting
          label="Summary email"
          help="The summary lists the alerts of the period."
          state={digest}
          saveUrl={url("digest")}
        >
          <Select
            name="digest"
            options={[
              { value: "never", label: "Never" },
              { value: "daily", label: "Every day" },
              { value: "weekly", label: "Every week" },
            ]}
            value={digest.value}
            onValueChange={digest.setValue}
          />
        </Setting>
      </SettingsSection>
    </>
  );
}

const idle = { state: "idle", retry: () => undefined } as const;

export default defineExamples("settings", [
  {
    id: "page",
    title: "A settings page",
    display: "frame",
    note: "Each change saves by itself; there is no Save button. The list marks the section in view.",
    render: () => (
      <>
        <ToastRegion />
        <Settings sections={sections}>
          <Rows />
        </Settings>
      </>
    ),
  },
  {
    id: "dialog",
    title: "In a dialog",
    note: "The workspace shell opens the settings in a dialog; the page fills it and scrolls inside.",
    render: () => (
      <Dialog title="Settings" size="lg" trigger={<Button>Open settings</Button>}>
        <Settings sections={sections}>
          <Rows />
        </Settings>
      </Dialog>
    ),
  },
  {
    id: "states",
    title: "The save states of a row",
    note: "Saving shows a spinner and a failure a retry button. A saved row shows a check that fades.",
    render: () => (
      <Card>
        <Setting label="Saving" state={{ state: "saving", retry: idle.retry }}>
          <Select name="s1" options={themes} defaultValue="dark" />
        </Setting>
        <Setting
          label="Not saved"
          state={{ state: "failed", retry: idle.retry }}
          description="The old value is back; the button tries again."
        >
          <Select name="s2" options={themes} defaultValue="light" />
        </Setting>
        <Setting label="A long label that wraps onto a second line in a narrow box" state={idle}>
          <Switch name="s3" label="Long" defaultChecked />
        </Setting>
      </Card>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    display: "frame",
    width: "sm",
    render: () => (
      <Settings sections={sections}>
        <Rows />
      </Settings>
    ),
  },
]);
