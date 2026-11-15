import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { Rating } from "./rating";

export default defineExamples("rating", [
  {
    id: "default",
    title: "Not rated yet",
    render: () => <Rating name="support" label="Support quality" />,
  },
  {
    id: "value",
    title: "With a value, in three sizes",
    render: () => (
      <Stack>
        <Rating name="speed-sm" defaultValue={4} size="sm" label="Speed, small" />
        <Rating name="speed" defaultValue={4} label="Speed" />
        <Rating name="speed-lg" defaultValue={4} size="lg" label="Speed, large" />
      </Stack>
    ),
  },
  {
    id: "max",
    title: "Out of 10",
    render: () => <Rating name="score" defaultValue={7} max={10} label="Score" />,
  },
  {
    id: "readonly",
    title: "Read-only",
    note: "An image with the label and the value.",
    render: () => <Rating name="average" value={4} readOnly label="Average rating" />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <Rating name="locked" defaultValue={2} disabled label="Locked rating" />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Rating name="narrow" defaultValue={3} max={10} label="Uptime score" />,
  },
]);
