import { defineExamples } from "../../examples";
import { Pane } from "../pane/pane";
import { Stack } from "../stack/stack";
import { Grid } from "./grid";

const HOSTS = ["web-1", "web-2", "nas", "db-1", "cache-1", "mail"];

export default defineExamples("grid", [
  {
    id: "default",
    title: "Columns of at least xs",
    note: "The panes in a row have equal height, also when one holds more text.",
    render: () => (
      <Grid>
        {HOSTS.map((host, i) => (
          <Pane key={host} title={host}>
            <p>
              {i === 1 ? "Serves example.com and the mail relay, and runs the nightly backup job." : "Up."}
            </p>
          </Pane>
        ))}
      </Grid>
    ),
  },
  {
    id: "small",
    title: "Min 2xs, gap 2",
    render: () => (
      <Grid min="2xs" gap="2">
        {HOSTS.map((host) => (
          <Pane key={host} label={host}>
            <p>{host}</p>
          </Pane>
        ))}
      </Grid>
    ),
  },
  {
    id: "wide",
    title: "Min md",
    render: () => (
      <Grid min="md">
        {HOSTS.slice(0, 3).map((host) => (
          <Pane key={host} title={host}>
            <p>Up.</p>
          </Pane>
        ))}
      </Grid>
    ),
  },
  {
    id: "fit",
    title: "A fixed set fills the row",
    note: "With fit, three panes share a wide row; without it, the row keeps empty columns at the end.",
    render: () => (
      <Stack>
        <Grid min="2xs" fit>
          {HOSTS.slice(0, 3).map((host) => (
            <Pane key={host} title={host}>
              <p>Up.</p>
            </Pane>
          ))}
        </Grid>
        <Grid min="2xs">
          {HOSTS.slice(0, 3).map((host) => (
            <Pane key={host} title={host}>
              <p>Up.</p>
            </Pane>
          ))}
        </Grid>
      </Stack>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box the columns wrap",
    width: "md",
    render: () => (
      <Grid>
        {HOSTS.slice(0, 4).map((host) => (
          <Pane key={host} title={host}>
            <p>Up.</p>
          </Pane>
        ))}
      </Grid>
    ),
  },
]);
