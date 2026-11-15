import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Help } from "./help";

export default defineExamples("help", [
  {
    id: "default",
    title: "Next to a value",
    render: () => (
      <p>
        Uptime 99.2%{" "}
        <Help label="About uptime">
          The share of the last 30 days in which web-1 answered its health check.
        </Help>
      </p>
    ),
  },
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Cluster gap="5">
        <p>
          Retention <Help tone="accent">How long nas keeps a backup.</Help>
        </p>
        <p>
          Default help <Help>The default tone is info.</Help>
        </p>
        <p>
          Delete after 7 days{" "}
          <Help tone="danger" label="Why this matters">
            A backup older than 7 days is gone for good.
          </Help>
        </p>
      </Cluster>
    ),
  },
]);
