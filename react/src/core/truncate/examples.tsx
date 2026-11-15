import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Truncate } from "./truncate";

const long =
  "The nightly backup of every volume on nas and web-1 finished with warnings: two files changed while they were read, and the copy at example.com took longer than the window allows, so the next run starts an hour earlier.";

export default defineExamples("truncate", [
  {
    id: "lines",
    title: "One, two and three lines",
    render: () => (
      <Stack>
        <Truncate>{long}</Truncate>
        <Truncate lines="2">{long}</Truncate>
        <Truncate lines="3">{long}</Truncate>
      </Stack>
    ),
  },
  {
    id: "short",
    title: "Short text is not cut",
    render: () => <Truncate>web-1.example.com</Truncate>,
  },
]);
