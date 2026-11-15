import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Sparkline } from "./sparkline";

const traffic = [12, 18, 15, 22, 30, 28, 35, 31, 40, 38, 45, 42, 50, 47, 44, 52, 58, 55, 61, 57];

export default defineExamples("sparkline", [
  {
    id: "default",
    title: "Line and area",
    render: () => (
      <Stack>
        <Sparkline values={traffic} label="Requests per minute on web-1, last hour" />
        <Sparkline values={traffic} label="Requests per minute on web-2, last hour" area />
      </Stack>
    ),
  },
  {
    id: "sizes",
    title: "Sizes",
    render: () => (
      <Stack>
        <Sparkline values={traffic} label="Small" size="sm" area />
        <Sparkline values={traffic} label="Medium" area />
      </Stack>
    ),
  },
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Stack>
        <Sparkline values={traffic} label="Neutral" tone="neutral" size="sm" area />
        <Sparkline values={traffic} label="Accent" tone="accent" size="sm" area />
        <Sparkline values={traffic} label="Success" tone="success" size="sm" area />
        <Sparkline values={traffic} label="Warning" tone="warning" size="sm" area />
        <Sparkline values={traffic} label="Danger" tone="danger" size="sm" area />
        <Sparkline values={traffic} label="Info" tone="info" size="sm" area />
      </Stack>
    ),
  },
  {
    id: "extremes",
    title: "Extreme values",
    note: "One value, all zero, a spike, and no values.",
    render: () => (
      <Stack>
        <Sparkline values={[42]} label="One value" area />
        <Sparkline values={[0, 0, 0, 0, 0, 0]} label="All zero" area />
        <Sparkline values={[2, 3, 2, 2, 98, 3, 2, 3, 2]} label="A spike" tone="danger" area />
        <Sparkline values={[]} label="No values yet" />
      </Stack>
    ),
  },
]);
