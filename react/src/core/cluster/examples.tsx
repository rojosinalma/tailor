import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "./cluster";

export default defineExamples("cluster", [
  {
    id: "default",
    title: "A row that wraps",
    render: () => (
      <Cluster>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </Cluster>
    ),
  },
  {
    id: "between",
    title: "Space between",
    render: () => (
      <Cluster justify="between">
        <Button>Back</Button>
        <Button variant="primary">Next</Button>
      </Cluster>
    ),
  },
]);
