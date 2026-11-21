import type { Tone } from "@tailor/core/spec";
import { Breadcrumb } from "../../core/breadcrumb/breadcrumb";
import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { useConfirm } from "../../core/confirm/confirm";
import { Facts } from "../../core/facts/facts";
import { Grid } from "../../core/grid/grid";
import { HistoryBars, type HistoryItem } from "../../core/history-bars/history-bars";
import { Icon } from "../../core/icon/icon";
import { MiniBars } from "../../core/mini-bars/mini-bars";
import { NumberField } from "../../core/number/number";
import { Page, type PageAction } from "../../core/page/page";
import { RelativeTime } from "../../core/relative-time/relative-time";
import { Select } from "../../core/select/select";
import { Sparkline } from "../../core/sparkline/sparkline";
import { Stat } from "../../core/stat/stat";
import { StateLabel } from "../../core/state-label/state-label";
import { Switch } from "../../core/switch/switch";
import { Tabs } from "../../core/tabs/tabs";
import { Timeline, TimelineItem } from "../../core/timeline/timeline";
import { useToast } from "../../core/toast/toast";
import { Setting, useAutoSave } from "../../forms/settings/settings";

// Sample data: one service, as the list page shows it. Replace with the record of the app.

export interface DetailService {
  readonly id: string;
  readonly name: string;
  readonly host: string;
  readonly image: string;
  readonly address: string;
  readonly owner: string;
  readonly created: string;
  readonly deployed: string;
}

export const DETAIL_SERVICE: DetailService = {
  id: "api",
  name: "api",
  host: "web-1",
  image: "example/api:3.4.1",
  address: "api.example.com:8080",
  owner: "alice",
  created: "2026-03-02T09:00:00Z",
  deployed: "2026-11-15T11:48:00Z",
};

export const DETAIL_STATS = {
  requests: [310, 340, 330, 360, 420, 480, 510, 470, 520, 610, 580, 640],
  cpu: [22, 35, 41, 28, 64, 71, 58, 33],
} as const;

/** One bar per day, oldest first: up, slow or down. */
export const DETAIL_UPTIME: readonly HistoryItem[] = Array.from({ length: 30 }, (_, i) => {
  const tone: Tone = i === 17 ? "danger" : i === 18 || i === 29 ? "warning" : "success";
  const state = tone === "success" ? "up" : tone === "warning" ? "slow" : "down";
  const day = new Date(Date.UTC(2026, 10, 15 - 29 + i));
  const name = day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return { tone, label: `${name}: ${state}` };
});

export interface DetailEvent {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly tone: Tone;
  readonly text?: string;
}

export const DETAIL_EVENTS: readonly DetailEvent[] = [
  {
    id: "slow",
    title: "Health check slow",
    time: "2026-11-15T11:50:00Z",
    tone: "warning",
    text: "GET /health took 2.4 s, over the limit of 1 s.",
  },
  {
    id: "deploy",
    title: "Deployed example/api:3.4.1",
    time: "2026-11-15T11:48:00Z",
    tone: "success",
    text: "Started by alice. The health check passed after 8 seconds.",
  },
  { id: "restart", title: "Restarted", time: "2026-11-14T22:10:00Z", tone: "info", text: "Started by bob." },
  { id: "created", title: "Service created", time: "2026-03-02T09:00:00Z", tone: "neutral" },
];

const POLICIES = [
  { value: "always", label: "Always" },
  { value: "on-failure", label: "On failure" },
  { value: "never", label: "Never" },
];

/** A stand-in for the server: waits a moment, then saves. */
const save = (): Promise<void> => new Promise((done) => setTimeout(done, 400));

/** The settings tab: each row saves itself, so the tab needs no Save button. */
function ServiceSettings({ id }: { id: string }) {
  const replicas = useAutoSave<number | null>({ value: 2, save });
  const policy = useAutoSave({ value: "on-failure", save });
  const publicAccess = useAutoSave({ value: true, save });
  const url = (name: string): string => `/api/services/${id}/settings/${name}`;
  return (
    <Card>
      <Setting
        label="Replicas"
        description="Copies that run at the same time."
        state={replicas}
        saveUrl={url("replicas")}
      >
        <NumberField
          name="replicas"
          min={1}
          max={10}
          value={replicas.value}
          onValueChange={replicas.setValue}
        />
      </Setting>
      <Setting label="Restart policy" state={policy} saveUrl={url("policy")}>
        <Select name="policy" options={POLICIES} value={policy.value} onValueChange={policy.setValue} />
      </Setting>
      <Setting
        label="Public"
        description="Reachable from outside the network."
        state={publicAccess}
        saveUrl={url("public")}
      >
        <Switch
          name="public"
          label="Public"
          checked={publicAccess.value}
          onCheckedChange={publicAccess.setValue}
        />
      </Setting>
    </Card>
  );
}

/** One record: what it is, how it is doing, and what can be done with it. */
export function DetailPageLayout({ service: s = DETAIL_SERVICE }: { service?: DetailService }) {
  const toast = useToast();
  const confirm = useConfirm();

  // The HTML kit's script (html/src/layouts/detail-page.ts) answers these actions by their data-id.
  // A destructive action always asks first, and says what is lost.
  const remove = async (): Promise<void> => {
    const sure = await confirm({
      title: `Delete ${s.name}?`,
      text: "The service stops and its settings go away for good. Its logs stay for 30 days.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (sure) toast("success", `${s.name} is deleted.`);
  };

  // Buttons in a wide page, one menu on a phone. The danger action comes last, after a line.
  const moreActions: PageAction[] = [
    { id: "logs", label: "Logs", icon: <Icon name="bi:journal-text" />, to: `#services/${s.id}/logs` },
    {
      id: "stop-service",
      label: "Stop",
      icon: <Icon name="bi:stop-circle" />,
      onSelect: () => toast("info", `${s.name} stops.`),
    },
    { type: "separator" },
    {
      id: "delete-service",
      label: "Delete",
      icon: <Icon name="bi:trash" />,
      tone: "danger",
      onSelect: remove,
    },
  ];

  return (
    <Page
      title={s.name}
      // The state sits beside the name: it is the first thing people look for.
      status={<StateLabel tone="warning">Degraded</StateLabel>}
      description={`${s.image} on ${s.host}`}
      // The way back to the list, above the title.
      breadcrumb={<Breadcrumb items={[{ label: "Services", to: "#services" }, { label: s.name }]} />}
      primaryAction={
        <Button
          variant="primary"
          icon={<Icon name="bi:arrow-clockwise" />}
          data-id="restart-service"
          onClick={() => toast("info", `${s.name} restarts.`)}
        >
          Restart
        </Button>
      }
      moreActions={moreActions}
      // A record reads best at a width the eye can follow; a wide screen keeps the rest free.
      width="readable"
    >
      {/* The numbers that tell at a glance how the record is doing: one row at a readable width, two by two
          on a phone. A fixed set: fit lets them fill the row. */}
      <Grid min="2xs" fit>
        <Stat label="Uptime, 30 days" value="99.2%" sub="1 outage" />
        <Stat
          label="Requests per minute"
          value="640"
          sub="+12% this hour"
          chart={<Sparkline values={DETAIL_STATS.requests} label="Requests per minute, last hour" area />}
        />
        <Stat
          label="CPU"
          value="33%"
          sub="8 cores"
          chart={<MiniBars values={DETAIL_STATS.cpu} max={100} label="Load per core" />}
        />
        <Stat
          label="Version"
          value="3.4.1"
          sub={
            <>
              Deployed <RelativeTime date={s.deployed} />
            </>
          }
        />
      </Grid>

      {/* Tabs keep the page short: the overview first, the rest one click away. */}
      <Tabs
        label={`About ${s.name}`}
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              // Two cards side by side in a wide page, one under the other in a narrow one.
              <Grid min="sm" fit>
                <Card title="Details">
                  <Facts
                    items={[
                      { key: "Image", value: s.image, mono: true },
                      { key: "Host", value: s.host },
                      { key: "Address", value: s.address, mono: true },
                      { key: "Owner", value: s.owner },
                      { key: "Created", value: <RelativeTime date={s.created} /> },
                    ]}
                  />
                </Card>
                <Card title="Uptime" description="Last 30 days, one bar a day.">
                  <HistoryBars items={DETAIL_UPTIME} label={`Uptime of ${s.name}, last 30 days`} />
                </Card>
              </Grid>
            ),
          },
          {
            id: "activity",
            label: "Activity",
            counter: DETAIL_EVENTS.length,
            content: (
              <Card>
                <Timeline label={`Activity of ${s.name}`}>
                  {DETAIL_EVENTS.map((event) => (
                    <TimelineItem
                      key={event.id}
                      title={event.title}
                      tone={event.tone}
                      time={<RelativeTime date={event.time} />}
                    >
                      {event.text}
                    </TimelineItem>
                  ))}
                </Timeline>
              </Card>
            ),
          },
          { id: "settings", label: "Settings", content: <ServiceSettings id={s.id} /> },
        ]}
      />
    </Page>
  );
}
