import { TONES } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { StatusDot } from "./status-dot";

export default defineExamples("status-dot", [
  {
    id: "labels",
    title: "With visible labels",
    render: () => (
      <Cluster gap="5">
        {TONES.map((tone) => (
          <StatusDot key={tone} tone={tone} label={tone} showLabel />
        ))}
      </Cluster>
    ),
  },
  {
    id: "names",
    title: "Next to a name",
    note: "The label is hidden text here: screen readers read it, the dot shows it.",
    render: () => (
      <Stack gap="2">
        <Cluster gap="2">
          <StatusDot tone="success" label="Running" /> web-1
        </Cluster>
        <Cluster gap="2">
          <StatusDot tone="danger" label="Stopped" /> web-2
        </Cluster>
        <Cluster gap="2">
          <StatusDot tone="neutral" label="Unknown" /> nas
        </Cluster>
      </Stack>
    ),
  },
  {
    id: "pulse",
    title: "In progress",
    note: "The pulse stops when the device asks for reduced motion.",
    render: () => <StatusDot tone="info" label="Deploying" showLabel pulse />,
  },
]);
