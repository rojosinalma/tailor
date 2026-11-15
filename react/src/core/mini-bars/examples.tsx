import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { MiniBars } from "./mini-bars";

const cores = [62, 48, 91, 30, 75, 55, 12, 68];

export default defineExamples("mini-bars", [
  {
    id: "default",
    title: "Load per core",
    note: "With max 100 the bars show percentages.",
    render: () => <MiniBars values={cores} max={100} label="Load per core of web-1, in percent" />,
  },
  {
    id: "sizes",
    title: "Sizes",
    render: () => (
      <Stack>
        <MiniBars values={cores} max={100} label="Small" size="sm" />
        <MiniBars values={cores} max={100} label="Medium" />
      </Stack>
    ),
  },
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Stack>
        <MiniBars values={cores} max={100} label="Neutral" tone="neutral" size="sm" />
        <MiniBars values={cores} max={100} label="Accent" tone="accent" size="sm" />
        <MiniBars values={cores} max={100} label="Success" tone="success" size="sm" />
        <MiniBars values={cores} max={100} label="Warning" tone="warning" size="sm" />
        <MiniBars values={cores} max={100} label="Danger" tone="danger" size="sm" />
        <MiniBars values={cores} max={100} label="Info" tone="info" size="sm" />
      </Stack>
    ),
  },
  {
    id: "extremes",
    title: "Extreme values",
    note: "One value, all zero, a spike, and many values.",
    render: () => (
      <Stack>
        <MiniBars values={[40]} max={100} label="One value" />
        <MiniBars values={[0, 0, 0, 0, 0, 0]} label="All zero" />
        <MiniBars values={[2, 3, 2, 2, 98, 3, 2, 3, 2]} label="A spike" tone="danger" />
        <MiniBars
          values={Array.from({ length: 96 }, (_, i) => 20 + ((i * 37) % 60))}
          label="Requests per quarter hour, last day"
          size="sm"
        />
      </Stack>
    ),
  },
]);
