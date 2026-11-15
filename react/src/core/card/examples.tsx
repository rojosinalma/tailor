import { TONES } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Facts } from "../facts/facts";
import { Stack } from "../stack/stack";
import { StateLabel } from "../state-label/state-label";
import { Card } from "./card";

export default defineExamples("card", [
  {
    id: "default",
    title: "Title, body and footer",
    render: () => (
      <Card
        title="web-1"
        description="Web server in the main region"
        actions={<Badge tone="success">running</Badge>}
        footer={
          <>
            <Button variant="ghost">Logs</Button>
            <Button>Restart</Button>
          </>
        }
      >
        <Facts
          items={[
            { key: "Address", value: "10.0.4.21", mono: true },
            { key: "Image", value: "registry.example.com/team/web:2026.11.15", mono: true },
            { key: "Uptime", value: "14 days" },
            { key: "Owner", value: "alice" },
          ]}
        />
      </Card>
    ),
  },
  {
    id: "body",
    title: "Body only",
    render: () => <Card>A card with no header holds any content: text, a form, a chart.</Card>,
  },
  {
    id: "link",
    title: "Clickable",
    note: "The title is the link and its hit area covers the card. The button stays clickable.",
    render: () => (
      <Card
        title="nas"
        to="#nas"
        description="Storage, 4 disks"
        actions={<Button size="sm">Back up now</Button>}
      >
        <StateLabel tone="warning">Disk 3 is 91% full</StateLabel>
      </Card>
    ),
  },
  {
    id: "none",
    title: "Edge to edge",
    note: 'padding="none" lets a chart, a list or a table run to the edges.',
    render: () => (
      <Card title="Traffic" description="web-1, last 24 hours" padding="none">
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" width="100%" height="96" aria-hidden="true">
          <polygon
            points="0,24 0,18 10,15 20,17 30,10 40,12 50,6 60,9 70,4 80,8 90,5 100,7 100,24"
            fill="currentColor"
            opacity="0.25"
          />
          <polyline
            points="0,18 10,15 20,17 30,10 40,12 50,6 60,9 70,4 80,8 90,5 100,7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Card>
    ),
  },
  {
    id: "tones",
    title: "Tones and selection",
    render: () => (
      <Stack>
        {TONES.map((tone) => (
          <Card key={tone} tone={tone} title={`Tone ${tone}`} />
        ))}
        <Card selected title="Selected" description="The card the user picked." />
      </Stack>
    ),
  },
  {
    id: "long",
    title: "Long content",
    render: () => (
      <Card
        title="monitoring-agent-with-a-very-long-service-name-that-does-not-fit-on-one-line"
        description="A long description wraps to the next line instead of pushing the actions out of the card."
        actions={
          <Cluster gap="2">
            <Button size="sm">Edit</Button>
            <Button size="sm" variant="danger">
              Remove
            </Button>
          </Cluster>
        }
      >
        https://example.com/a/very/long/address/without/any/spaces/that/has/to/wrap/somewhere/inside/the/card
      </Card>
    ),
  },
]);
