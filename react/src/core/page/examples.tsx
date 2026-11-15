import { defineExamples } from "../../examples";
import { AppLink } from "../../link";
import { Button } from "../button/button";
import { Grid } from "../grid/grid";
import { Pane } from "../pane/pane";
import { Section } from "../section/section";
import { Split } from "../split/split";
import { Toolbar } from "../toolbar/toolbar";
import { Page } from "./page";

const HOSTS = ["web-1", "web-2", "nas", "db-1", "db-2", "cache-1", "mail", "backup", "proxy", "build"];

const hostPanes = HOSTS.map((host) => (
  <Pane key={host} title={host}>
    <p>Serves example.com. Last check passed.</p>
  </Pane>
));

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
    render: () => (
      <Page title="Logs" mode="fill" actions={<Button>Download</Button>}>
        <Toolbar start={<Button>All hosts</Button>} end={<Button variant="primary">Follow</Button>} />
        <Split
          label="Resize the host list"
          defaultSize={30}
          first={
            <Pane title="Hosts" padding="none">
              <ul>
                {HOSTS.map((host) => (
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
                <p key={String(i)}>12:{String(i).padStart(2, "0")} GET /index.html 200 alice</p>
              ))}
            </Pane>
          }
        />
      </Page>
    ),
  },
  {
    id: "readable",
    title: "Readable width, with a breadcrumb",
    display: "frame",
    render: () => (
      <Page
        title="About nas"
        description="Notes on the storage host."
        breadcrumb={<AppLink to="#hosts">Hosts</AppLink>}
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
    id: "long-title",
    title: "A long title and many actions wrap",
    display: "frame",
    render: () => (
      <Page
        title="Maintenance window for every host in the example.com network"
        description="Planned work that stops the services for a short time."
        actions={
          <>
            <Button>Postpone</Button>
            <Button>Notify users</Button>
            <Button variant="danger">Cancel window</Button>
            <Button variant="primary">Start now</Button>
          </>
        }
      >
        <p>The work starts at 22:00.</p>
      </Page>
    ),
  },
]);
