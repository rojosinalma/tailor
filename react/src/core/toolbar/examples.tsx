import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Select } from "../select/select";
import { Toolbar } from "./toolbar";

const STATES = [
  { value: "all", label: "All states" },
  { value: "up", label: "Up" },
  { value: "down", label: "Down" },
];

function HostToolbar() {
  return (
    <Toolbar
      start={
        <>
          <Select options={STATES} defaultValue="all" aria-label="State" />
          <Button>web-1</Button>
        </>
      }
      end={
        <>
          <Button>Export</Button>
          <Button variant="primary">Add host</Button>
        </>
      }
    />
  );
}

export default defineExamples("toolbar", [
  {
    id: "default",
    title: "Filters at the start, actions at the end",
    render: () => <HostToolbar />,
  },
  {
    id: "narrow",
    title: "Narrow: the actions go under the filters",
    width: "sm",
    render: () => <HostToolbar />,
  },
  {
    id: "children",
    title: "One row of controls",
    render: () => (
      <Toolbar>
        <Button>Refresh</Button>
        <Button>Sort</Button>
        <Button>Group</Button>
      </Toolbar>
    ),
  },
]);
