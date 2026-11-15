import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { Skeleton } from "./skeleton";

export default defineExamples("skeleton", [
  {
    id: "text",
    title: "Text",
    note: "One line, and three lines with a shorter last one.",
    render: () => (
      <Stack gap="5">
        <Skeleton />
        <Skeleton lines={3} />
      </Stack>
    ),
  },
  {
    id: "box",
    title: "Box, in three sizes",
    render: () => (
      <Stack>
        <Skeleton shape="box" size="sm" />
        <Skeleton shape="box" />
        <Skeleton shape="box" size="lg" />
      </Stack>
    ),
  },
  {
    id: "circle",
    title: "Circle, in three sizes",
    render: () => (
      <Cluster>
        <Skeleton shape="circle" size="sm" />
        <Skeleton shape="circle" />
        <Skeleton shape="circle" size="lg" />
      </Cluster>
    ),
  },
  {
    id: "region",
    title: "A loading region",
    note: 'The region carries aria-busy="true" while it loads; the placeholders are hidden from screen readers.',
    render: () => (
      <section aria-busy="true" aria-label="Host web-1">
        <Stack>
          <Skeleton shape="circle" />
          <Skeleton lines={4} />
          <Skeleton shape="box" size="sm" />
        </Stack>
      </section>
    ),
  },
]);
