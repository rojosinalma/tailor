import { defineExamples } from "../../examples";
import { Breadcrumb } from "../breadcrumb/breadcrumb";
import { Button } from "../button/button";
import { Grid } from "../grid/grid";
import { Pane } from "../pane/pane";
import { Section } from "../section/section";
import { Split } from "../split/split";
import { StateLabel } from "../state-label/state-label";
import { Toolbar } from "../toolbar/toolbar";
import { Page, type PageAction } from "./page";

const HOSTS = ["web-1", "web-2", "nas", "db-1", "db-2", "cache-1", "mail", "backup", "proxy", "build"];

const hostPanes = HOSTS.map((host) => (
  <Pane key={host} title={host}>
    <p>Serves example.com. Last check passed.</p>
  </Pane>
));

const logs = (
  <Page title="Logs" mode="fill" actions={<Button>Download</Button>}>
    <Toolbar start={<Button>All hosts</Button>} end={<Button variant="primary">Follow</Button>} />
    <Split
      label="Resize the host list"
      defaultSize={30}
      first={
        <Pane title="Hosts" padding="none">
          <ul>
            {HOSTS.slice(0, 4).map((host) => (
              <li key={host}>
                <Button variant="ghost">{host}</Button>
              </li>
            ))}
          </ul>
        </Pane>
      }
      second={
        <Pane title="web-1" footer={<Button>Clear</Button>}>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={String(i)}>{`12:${String(i).padStart(2, "0")} GET /index.html 200 alice`}</p>
          ))}
        </Pane>
      }
    />
  </Page>
);

const MORE: readonly PageAction[] = [
  { id: "postpone", label: "Postpone" },
  { id: "notify", label: "Notify users" },
  { id: "docs", label: "Read the plan", to: "https://example.com/plan" },
  { type: "separator" },
  { id: "cancel", label: "Cancel window", tone: "danger" },
];

const maintenance = (
  <Page
    title="Maintenance window for every host in the example.com network"
    description="Planned work that stops the services for a short time."
    primaryAction={<Button variant="primary">Start now</Button>}
    moreActions={MORE}
  >
    <p>The work starts at 22:00.</p>
  </Page>
);

export default defineExamples("page", [
  {
    id: "scroll",
    title: "Scroll: the header stays, the body scrolls",
    display: "frame",
    render: () => (
      <Page
        title="Hosts"
        description="Every machine that runs a service."
        actions={
          <>
            <Button>Export</Button>
            <Button variant="primary">Add host</Button>
          </>
        }
      >
        <Section title="Web" description="Hosts that serve example.com.">
          <Grid>{hostPanes.slice(0, 4)}</Grid>
        </Section>
        <Section title="Storage" actions={<Button size="sm">Add disk</Button>}>
          <Grid>{hostPanes.slice(4)}</Grid>
        </Section>
      </Page>
    ),
  },
  {
    id: "fill",
    title: "Fill: the body takes the free height, its panes scroll alone",
    display: "frame",
    render: () => logs,
  },
  {
    id: "readable",
    title: "Readable width, with a breadcrumb and a status",
    note: "The header keeps the same width as the body, so the action stays near the title on a wide screen.",
    display: "frame",
    render: () => (
      <Page
        title="About nas"
        status={<StateLabel tone="success">Online</StateLabel>}
        description="Notes on the storage host."
        actions={<Button>Edit notes</Button>}
        breadcrumb={<Breadcrumb items={[{ label: "Hosts", to: "#hosts" }, { label: "nas" }]} />}
        width="readable"
      >
        <Section title="Disks">
          <p>
            The host nas holds four disks in one pool. A disk that fails is replaced while the pool stays
            online; the pool then copies the data to the new disk.
          </p>
          <p>Backups run every night at 02:00 and keep thirty days.</p>
        </Section>
        <Section title="Access">
          <p>Only alice and the backup job can write. Everyone on the network can read the shared folder.</p>
        </Section>
      </Page>
    ),
  },
  {
    id: "more-actions",
    title: "A main action and more actions",
    note: "In a page of at least 40rem the other actions are buttons; in a narrower page they go into one menu.",
    display: "frame",
    render: () => maintenance,
  },
  {
    id: "more-actions-narrow",
    title: "The same page, narrow",
    display: "frame",
    width: "sm",
    render: () => maintenance,
  },
  {
    id: "narrow-fill",
    title: "A narrow fill page",
    display: "frame",
    width: "sm",
    render: () => logs,
  },
]);
