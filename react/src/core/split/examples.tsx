import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Pane } from "../pane/pane";
import { Split } from "./split";

const HOSTS = ["web-1", "web-2", "nas", "db-1", "cache-1", "mail"];

const hosts = (
  <Pane title="Hosts" padding="none">
    <ul>
      {HOSTS.map((host) => (
        <li key={host}>
          <Button variant="ghost">{host}</Button>
        </li>
      ))}
    </ul>
  </Pane>
);

const detail = (
  <Pane title="web-1">
    <p>Serves example.com. Drag the handle or move it with the arrow keys; Home and End go to the limits.</p>
  </Pane>
);

export default defineExamples("split", [
  {
    id: "default",
    title: "Side by side",
    display: "frame",
    render: () => <Split label="Resize the host list" first={hosts} second={detail} />,
  },
  {
    id: "column",
    title: "One above the other, 30 percent, limits 20 to 60",
    display: "frame",
    render: () => (
      <Split
        direction="column"
        label="Resize the output"
        defaultSize={30}
        min={20}
        max={60}
        first={detail}
        second={
          <Pane title="Output">
            <p>12:00 GET /index.html 200 alice</p>
          </Pane>
        }
      />
    ),
  },
  {
    id: "remembered",
    title: "Remembers its size",
    note: "The size stays after a reload.",
    display: "frame",
    render: () => (
      <Split
        label="Resize the side list"
        storageKey="example-split"
        defaultSize={35}
        first={hosts}
        second={detail}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow space the panes stack and the handle hides",
    display: "frame",
    width: "sm",
    render: () => <Split label="Resize the narrow host list" first={hosts} second={detail} />,
  },
]);
