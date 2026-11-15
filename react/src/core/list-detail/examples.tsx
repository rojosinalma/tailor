import { useState } from "react";
import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Pane } from "../pane/pane";
import { ListDetail } from "./list-detail";

const HOSTS = ["web-1", "web-2", "nas", "db-1", "cache-1", "mail"];

function Hosts() {
  const [open, setOpen] = useState<string | null>(null);
  const host = open ?? "web-1";
  return (
    <ListDetail
      listLabel="Host list"
      detailLabel="Host details"
      detailOpen={open !== null}
      onBack={() => setOpen(null)}
      list={
        <Pane title="Hosts" padding="none">
          <ul>
            {HOSTS.map((name) => (
              <li key={name}>
                <Button
                  variant="ghost"
                  data-t-detail-open=""
                  aria-current={open === name ? "true" : undefined}
                  onClick={() => setOpen(name)}
                >
                  {name}
                </Button>
              </li>
            ))}
          </ul>
        </Pane>
      }
      detail={
        <Pane title={host}>
          <p>{host} serves example.com. alice manages it.</p>
        </Pane>
      }
    />
  );
}

export default defineExamples("list-detail", [
  {
    id: "default",
    title: "Hosts and one host",
    display: "frame",
    render: () => <Hosts />,
  },
  {
    id: "narrow",
    title: "Narrow: the list, or one host with a back button",
    display: "frame",
    width: "sm",
    render: () => <Hosts />,
  },
]);
