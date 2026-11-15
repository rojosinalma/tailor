import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Progress } from "./progress";

export default defineExamples("progress", [
  {
    id: "default",
    title: "With a visible label",
    render: () => (
      <Stack>
        <Progress value={62} label="Uploading backup.tar" showLabel />
        <Progress value={0} label="Waiting to start" showLabel />
        <Progress value={100} label="Copied to nas" showLabel tone="success" />
      </Stack>
    ),
  },
  {
    id: "bare",
    title: "Without a visible label, in two sizes",
    note: "The label is still the accessible name.",
    render: () => (
      <Stack>
        <Progress value={35} label="Disk use of web-1" />
        <Progress value={35} label="Disk use of web-2" size="sm" />
      </Stack>
    ),
  },
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Stack>
        <Progress value={20} label="Neutral" showLabel tone="neutral" />
        <Progress value={40} label="Accent" showLabel tone="accent" />
        <Progress value={60} label="Success" showLabel tone="success" />
        <Progress value={75} label="Warning" showLabel tone="warning" />
        <Progress value={92} label="Danger" showLabel tone="danger" />
        <Progress value={50} label="Info" showLabel tone="info" />
      </Stack>
    ),
  },
  {
    id: "indeterminate",
    title: "Unknown length",
    render: () => (
      <Stack>
        <Progress value={null} label="Checking web-1" showLabel />
        <Progress value={null} label="Loading the list" size="sm" />
      </Stack>
    ),
  },
  {
    id: "long",
    title: "Long label and values out of range",
    note: "A value under 0 or over 100 is clamped.",
    render: () => (
      <Stack>
        <Progress
          value={140}
          label="Copying the nightly database snapshot from web-1 to the long-term storage on nas"
          showLabel
        />
        <Progress value={-5} label="Rebuilding the search index" showLabel />
      </Stack>
    ),
  },
]);
