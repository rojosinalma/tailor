import type { Tone } from "@tailor/core/spec";
import { LineChart } from "../../charts/line-chart/line-chart";
import { Alert } from "../../core/alert/alert";
import { Button, ButtonLink } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { Grid } from "../../core/grid/grid";
import { List, ListItem } from "../../core/list/list";
import { MiniBars } from "../../core/mini-bars/mini-bars";
import { Page } from "../../core/page/page";
import { RelativeTime } from "../../core/relative-time/relative-time";
import { Sparkline } from "../../core/sparkline/sparkline";
import { Stat } from "../../core/stat/stat";
import { StateLabel } from "../../core/state-label/state-label";
import { StatusDot } from "../../core/status-dot/status-dot";
import { Table } from "../../core/table/table";

// Sample data: the state of the console on Nov 15, 2026. Replace with what the server sends.

export const DASHBOARD_HOURS = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00"];

export const DASHBOARD_REQUESTS = [
  { label: "web-1", values: [120, 96, 80, 110, 340, 520, 610] },
  { label: "web-2", values: [90, 70, 64, 95, 280, 430, 470] },
];

export interface DashboardHost {
  readonly name: string;
  readonly tone: Tone;
  readonly state: string;
  readonly detail: string;
}

export const DASHBOARD_HOSTS: readonly DashboardHost[] = [
  { name: "web-1", tone: "success", state: "Up", detail: "4 services, CPU 31%" },
  { name: "web-2", tone: "success", state: "Up", detail: "3 services, CPU 24%" },
  { name: "db-1", tone: "success", state: "Up", detail: "2 services, CPU 48%" },
  { name: "nas", tone: "warning", state: "Disk 91% full", detail: "3 services, 3.6 of 4 TB used" },
  { name: "edge", tone: "success", state: "Up", detail: "3 services, CPU 9%" },
];

export interface DashboardDeploy {
  readonly id: string;
  readonly service: string;
  readonly version: string;
  readonly tone: Tone;
  readonly result: string;
  readonly at: string;
}

export const DASHBOARD_DEPLOYS: readonly DashboardDeploy[] = [
  {
    id: "d6",
    service: "api",
    version: "3.4.1",
    tone: "warning",
    result: "Slow start",
    at: "2026-11-15T11:48:00Z",
  },
  { id: "d5", service: "web", version: "1.27", tone: "success", result: "Done", at: "2026-11-15T10:12:00Z" },
  {
    id: "d4",
    service: "worker",
    version: "3.4.1",
    tone: "success",
    result: "Done",
    at: "2026-11-15T09:30:00Z",
  },
  {
    id: "d3",
    service: "search",
    version: "2.18",
    tone: "danger",
    result: "Rolled back",
    at: "2026-11-14T21:05:00Z",
  },
  { id: "d2", service: "cache", version: "7.4", tone: "success", result: "Done", at: "2026-11-14T16:40:00Z" },
];

export const DASHBOARD_BACKUPS = [
  { host: "nas", tone: "success" as Tone, result: "Done", at: "2026-11-15T02:00:00Z", size: "4.2 GB" },
  { host: "db-1", tone: "success" as Tone, result: "Done", at: "2026-11-15T02:30:00Z", size: "1.8 GB" },
  { host: "web-1", tone: "danger" as Tone, result: "Failed", at: "2026-11-15T03:00:00Z", size: "no copy" },
];

/** The overview of the console: what needs attention first, then the numbers, then the detail. */
export function DashboardPageLayout() {
  return (
    <Page title="Overview" description="How every host and service is doing right now.">
      {/* The one thing that needs a person goes first, with the way to fix it. */}
      <Alert
        tone="warning"
        title="nas is almost full"
        actions={
          <ButtonLink to="#hosts/nas" size="sm">
            Open nas
          </ButtonLink>
        }
      >
        Its disk is 91% full. Backups stop when it reaches 95%.
      </Alert>

      {/* The numbers that answer "is everything fine?" at a glance. A fixed set: fit lets the three fill a
          wide row instead of leaving empty columns; on a narrow page they wrap. */}
      <Grid min="sm" fit>
        <Stat label="Services running" value="12" sub="of 14" tone="success" to="#services" />
        <Stat
          label="Requests per minute"
          value="1,080"
          sub="+8% this hour"
          chart={
            <Sparkline
              values={[420, 380, 300, 410, 620, 890, 1080]}
              label="Requests per minute, today"
              area
            />
          }
        />
        <Stat
          label="Deploys today"
          value="3"
          sub="1 slow start"
          chart={<MiniBars values={[0, 0, 0, 0, 1, 2, 0]} label="Deploys per two hours, today" />}
        />
      </Grid>

      {/* The detail, two cards a row in a wide page, one under the other when narrow. */}
      <Grid min="md">
        <Card title="Requests" description="Per hour, today.">
          <LineChart
            label="Requests per hour, today"
            categories={DASHBOARD_HOURS}
            series={DASHBOARD_REQUESTS}
          />
        </Card>

        <Card
          title="Hosts"
          padding="none"
          actions={
            <ButtonLink to="#hosts" size="sm">
              All hosts
            </ButtonLink>
          }
        >
          <List label="Hosts">
            {DASHBOARD_HOSTS.map((host) => (
              <ListItem
                key={host.name}
                to={`#hosts/${host.name}`}
                leading={<StatusDot tone={host.tone} label={host.state} />}
                title={host.name}
                description={host.detail}
                trailing={
                  host.tone === "success" ? null : <StateLabel tone={host.tone}>{host.state}</StateLabel>
                }
              />
            ))}
          </List>
        </Card>

        <Card
          title="Latest deploys"
          padding="none"
          actions={
            <ButtonLink to="#deploys" size="sm">
              All deploys
            </ButtonLink>
          }
        >
          <Table
            rows={DASHBOARD_DEPLOYS}
            rowKey={(d) => d.id}
            columns={[
              { key: "service", header: "Service" },
              { key: "version", header: "Version" },
              {
                key: "result",
                header: "Result",
                render: (d) => <StateLabel tone={d.tone}>{d.result}</StateLabel>,
              },
              { key: "at", header: "When", render: (d) => <RelativeTime date={d.at} /> },
            ]}
          />
        </Card>

        <Card
          title="Backups"
          description="Last night."
          padding="none"
          actions={<Button size="sm">Run now</Button>}
        >
          <List label="Backups">
            {DASHBOARD_BACKUPS.map((b) => (
              <ListItem
                key={b.host}
                title={b.host}
                description={
                  <>
                    <RelativeTime date={b.at} />, {b.size}
                  </>
                }
                trailing={<StateLabel tone={b.tone}>{b.result}</StateLabel>}
              />
            ))}
          </List>
        </Card>
      </Grid>
    </Page>
  );
}
