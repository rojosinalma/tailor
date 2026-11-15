import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Stack } from "./stack";

export default defineExamples("stack", [
  {
    id: "default",
    title: "A column",
    render: () => (
      <Stack align="start">
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </Stack>
    ),
  },
]);
