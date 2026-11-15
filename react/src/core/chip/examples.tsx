import { useState } from "react";
import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Chip } from "./chip";

function Tags() {
  const [tags, setTags] = useState(["web-1", "nas", "owner:alice", "region:eu"]);
  return (
    <Cluster gap="2">
      {tags.map((tag) => (
        <Chip key={tag} onRemove={() => setTags(tags.filter((t) => t !== tag))}>
          {tag}
        </Chip>
      ))}
    </Cluster>
  );
}

function Filters() {
  const [on, setOn] = useState<readonly string[]>(["Running"]);
  const toggle = (name: string, selected: boolean) =>
    setOn(selected ? [...on, name] : on.filter((n) => n !== name));
  return (
    <Cluster gap="2">
      {["Running", "Stopped", "Failed", "Updating"].map((name) => (
        <Chip key={name} selected={on.includes(name)} onSelectedChange={(s) => toggle(name, s)}>
          {name}
        </Chip>
      ))}
    </Cluster>
  );
}

export default defineExamples("chip", [
  {
    id: "remove",
    title: "Removable tags",
    note: "Each remove button has the name “Remove <label>”.",
    render: () => <Tags />,
  },
  {
    id: "toggle",
    title: "Toggle filters",
    note: "A toggle chip is a button with aria-pressed. In the HTML kit the page's own code changes it.",
    render: () => <Filters />,
  },
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Cluster gap="2">
        <Chip tone="success" onRemove={() => {}}>
          healthy
        </Chip>
        <Chip tone="warning" onRemove={() => {}}>
          degraded
        </Chip>
        <Chip tone="danger">failed</Chip>
        <Chip tone="info" selected onSelectedChange={() => {}}>
          info
        </Chip>
        <Chip tone="accent" selected={false} onSelectedChange={() => {}}>
          pinned
        </Chip>
      </Cluster>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <Cluster gap="2">
        <Chip disabled onRemove={() => {}}>
          locked
        </Chip>
        <Chip disabled selected>
          Archived
        </Chip>
      </Cluster>
    ),
  },
  {
    id: "long",
    title: "Long text",
    render: () => (
      <Chip onRemove={() => {}}>
        image:registry.example.com/team/monitoring-agent:2026.11.15-build-4821-with-a-very-long-tag
      </Chip>
    ),
  },
]);
