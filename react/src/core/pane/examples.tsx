import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Pane } from "./pane";

export default defineExamples("pane", [
  {
    id: "default",
    title: "Title, actions and footer",
    render: () => (
      <Pane
        title="web-1"
        actions={<Button size="sm">Restart</Button>}
        footer={
          <>
            <Button>Cancel</Button>
            <Button variant="primary">Save</Button>
          </>
        }
      >
        <p>Serves example.com. The body scrolls when the pane has less height than its content.</p>
      </Pane>
    ),
  },
  {
    id: "no-padding",
    title: "No padding, for a list",
    render: () => (
      <Pane title="Hosts" padding="none">
        <ul>
          {["web-1", "nas", "db-1"].map((host) => (
            <li key={host}>
              <Button variant="ghost">{host}</Button>
            </li>
          ))}
        </ul>
      </Pane>
    ),
  },
  {
    id: "label",
    title: "No title: an accessible name only",
    render: () => (
      <Pane label="Status">
        <p>All hosts are up.</p>
      </Pane>
    ),
  },
  {
    id: "long-title",
    title: "A long title",
    render: () => (
      <Pane
        title="Every service of the example.com network that restarts on its own"
        actions={<Button size="sm">Edit</Button>}
      >
        <p>alice owns them.</p>
      </Pane>
    ),
  },
]);
