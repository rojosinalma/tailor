import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Spinner } from "./spinner";

export default defineExamples("spinner", [
  {
    id: "sizes",
    title: "Sizes",
    render: () => (
      <Cluster>
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </Cluster>
    ),
  },
  {
    id: "inline",
    title: "Next to a text",
    note: "It takes the colour of the text around it, here the button's text.",
    render: () => (
      <Cluster>
        <Cluster gap="2">
          <Spinner size="sm" label="Checking web-1" />
          <span>Checking web-1…</span>
        </Cluster>
        <Button variant="primary">
          <Spinner size="sm" label="Deploy in progress" />
        </Button>
      </Cluster>
    ),
  },
]);
