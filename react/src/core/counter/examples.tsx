import { TONES } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Counter } from "./counter";

export default defineExamples("counter", [
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Cluster gap="2">
        {TONES.map((tone, i) => (
          <Counter key={tone} tone={tone} value={(i + 1) * 3} />
        ))}
      </Cluster>
    ),
  },
  {
    id: "context",
    title: "In buttons and labels",
    render: () => (
      <Cluster>
        <Button variant="ghost">
          Issues <Counter value={24} />
        </Button>
        <Button variant="ghost">
          Failing <Counter tone="danger" value={3} />
        </Button>
        <Button variant="ghost">
          Updates <Counter tone="accent" value={15} />
        </Button>
      </Cluster>
    ),
  },
  {
    id: "max",
    title: "Above the maximum",
    note: "With max={99}, the value 1284 shows as 99+.",
    render: () => (
      <Cluster gap="2">
        <Counter value={7} max={99} />
        <Counter value={99} max={99} />
        <Counter tone="info" value={1284} max={99} />
      </Cluster>
    ),
  },
]);
