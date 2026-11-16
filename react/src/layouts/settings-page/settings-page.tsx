import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { type ConfirmOptions, useConfirm } from "../../core/confirm/confirm";
import { Icon } from "../../core/icon/icon";
import { Input } from "../../core/input/input";
import { NumberField } from "../../core/number/number";
import { Page } from "../../core/page/page";
import { Secret } from "../../core/secret/secret";
import { Select } from "../../core/select/select";
import { Stack } from "../../core/stack/stack";
import { Switch } from "../../core/switch/switch";
import { useToast } from "../../core/toast/toast";
import { Duration } from "../../forms/duration/duration";
import { Setting, Settings, SettingsSection, useAutoSave } from "../../forms/settings/settings";
import { useIsStatic } from "../../kit";

// Sample data: the saved settings of the console. Replace with what the server sends.

export const SETTINGS_VALUES = {
  name: "Example console",
  timezone: "Europe/Berlin",
  autoDeploy: true,
  healthTimeout: 30,
  keepReleases: 5,
  token: "tok_4f2a9c81e7d3b6a0",
  statusPage: false,
} as const;

export const SETTINGS_SECTIONS = [
  { id: "general", label: "General", icon: <Icon name="bi:sliders" /> },
  { id: "deploys", label: "Deploys", icon: <Icon name="bi:rocket-takeoff" /> },
  { id: "access", label: "Access", icon: <Icon name="bi:key" /> },
  { id: "danger", label: "Danger zone", icon: <Icon name="bi:exclamation-octagon" /> },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
];

/** A stand-in for the server: it takes a moment, and refuses the reserved name "admin". */
async function save(value: unknown): Promise<{ ok: boolean; message?: string }> {
  await new Promise((done) => setTimeout(done, 500));
  if (value === "admin") return { ok: false, message: "The name admin is reserved." };
  return { ok: true };
}

/** Where the HTML kit saves each row, with { name, value } as JSON. */
const url = (name: string): string => `/api/settings/${name}`;

const ERASE: ConfirmOptions = {
  title: "Erase all data?",
  text: "Every service, host and deploy record goes away for good. The hosts themselves keep running.",
  confirmLabel: "Erase",
  danger: true,
};

/** The settings of the app: each change saves by itself, so there is no Save button. */
export function SettingsPageLayout() {
  const isStatic = useIsStatic();
  const toast = useToast();
  const confirm = useConfirm();
  const v = SETTINGS_VALUES;
  // Text saves a moment after the last key; a choice or a switch saves at once.
  const name = useAutoSave({ value: v.name as string, save, delay: 800 });
  const timezone = useAutoSave({ value: v.timezone as string, save });
  const autoDeploy = useAutoSave({ value: v.autoDeploy as boolean, save });
  const healthTimeout = useAutoSave<number | null>({ value: v.healthTimeout, save });
  const keepReleases = useAutoSave<number | null>({ value: v.keepReleases, save });
  const statusPage = useAutoSave({ value: v.statusPage as boolean, save });

  // The HTML kit asks with the declarative hook of the confirm script.
  const erase = isStatic
    ? {
        "data-t": "confirm-trigger",
        "data-title": ERASE.title,
        "data-text": ERASE.text,
        "data-confirm-label": ERASE.confirmLabel,
        "data-danger": "",
      }
    : {
        onClick: async () => {
          if (await confirm(ERASE)) toast("success", "All data is erased.");
        },
      };

  return (
    // Fill: the section list stays while the settings scroll beside it. Readable: a row stays easy to scan.
    <Page
      title="Settings"
      description="Apply to everyone who uses this console."
      mode="fill"
      width="readable"
    >
      <Settings sections={SETTINGS_SECTIONS}>
        <SettingsSection id="general" title="General">
          <Setting
            label="Console name"
            description="Shown in the top bar and in alert emails."
            state={name}
            saveUrl={url("name")}
          >
            <Input name="name" value={name.value} onValueChange={name.setValue} autoComplete="off" />
          </Setting>
          <Setting
            label="Time zone"
            help="Dates and times on every page use it."
            state={timezone}
            saveUrl={url("timezone")}
          >
            <Select
              name="timezone"
              options={TIMEZONES}
              value={timezone.value}
              onValueChange={timezone.setValue}
            />
          </Setting>
        </SettingsSection>

        <SettingsSection id="deploys" title="Deploys" description="What happens when a new image is pushed.">
          <Setting
            label="Deploy on push"
            description="Rolls out each new image by itself."
            state={autoDeploy}
            saveUrl={url("auto-deploy")}
          >
            <Switch
              name="auto-deploy"
              label="Deploy on push"
              checked={autoDeploy.value}
              onCheckedChange={autoDeploy.setValue}
            />
          </Setting>
          <Setting
            label="Health check timeout"
            description="A deploy that is not healthy by then rolls back."
            state={healthTimeout}
            saveUrl={url("health-timeout")}
          >
            <Duration
              label="Health check timeout"
              name="health-timeout"
              units={["seconds", "minutes"]}
              min={5}
              value={healthTimeout.value}
              onValueChange={healthTimeout.setValue}
            />
          </Setting>
          <Setting
            label="Releases to keep"
            description="Older images are removed."
            state={keepReleases}
            saveUrl={url("keep-releases")}
          >
            <NumberField
              name="keep-releases"
              min={1}
              max={50}
              value={keepReleases.value}
              onValueChange={keepReleases.setValue}
            />
          </Setting>
        </SettingsSection>

        <SettingsSection id="access" title="Access">
          {/* A secret is hidden until asked for, and copied without being shown. */}
          <Setting label="API token" description="Scripts sign in with it. Keep it private.">
            <Secret name="token" defaultValue={v.token} readOnly copyable />
          </Setting>
          <Setting
            label="Public status page"
            description="Anyone with the address sees which services run."
            state={statusPage}
            saveUrl={url("status-page")}
          >
            <Switch
              name="status-page"
              label="Public status page"
              checked={statusPage.value}
              onCheckedChange={statusPage.setValue}
            />
          </Setting>
        </SettingsSection>

        {/* The danger zone comes last, set apart, and asks before it acts. */}
        <SettingsSection id="danger" title="Danger zone">
          <Card tone="danger">
            <Stack align="start">
              <p>Erase every service, host and deploy record of this console. This cannot be undone.</p>
              <Button variant="danger" icon={<Icon name="bi:trash" />} {...erase}>
                Erase all data
              </Button>
            </Stack>
          </Card>
        </SettingsSection>
      </Settings>
    </Page>
  );
}
