import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Slider } from "./slider";

export default defineExamples("slider", [
  {
    id: "default",
    title: "With the value shown",
    render: () => <Slider label="Volume" name="volume" defaultValue={40} showValue />,
  },
  {
    id: "step",
    title: "With a step",
    render: () => (
      <Slider label="CPU limit" name="cpu" min={1} max={16} step={1} defaultValue={4} showValue />
    ),
  },
  {
    id: "states",
    title: "At the ends and disabled",
    render: () => (
      <Stack>
        <Slider label="Empty" defaultValue={0} />
        <Slider label="Full" defaultValue={100} />
        <Slider label="Locked" defaultValue={60} disabled showValue />
      </Stack>
    ),
  },
]);
