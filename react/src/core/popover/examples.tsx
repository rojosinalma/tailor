import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { Popover } from "./popover";

export default defineExamples("popover", [
  {
    id: "default",
    title: "With a title and controls",
    render: () => (
      <Popover trigger={<Button>Share</Button>} title="Share web-1">
        <Stack>
          <p>alice and the team of nas can see this host.</p>
          <Cluster gap="2">
            <Button size="sm" variant="primary">
              Copy link
            </Button>
            <Button size="sm">Invite</Button>
          </Cluster>
        </Stack>
      </Popover>
    ),
  },
  {
    id: "sides",
    title: "Sides and alignment",
    render: () => (
      <Cluster>
        <Popover trigger={<Button>Above</Button>} label="Above" side="top">
          <p>Opens above its trigger.</p>
        </Popover>
        <Popover trigger={<Button>Centred</Button>} label="Centred" align="center">
          <p>Centred under its trigger.</p>
        </Popover>
        <Popover trigger={<Button>Right</Button>} label="Right" side="right">
          <p>Opens to the right of its trigger.</p>
        </Popover>
      </Cluster>
    ),
  },
  {
    id: "long",
    title: "Long content",
    render: () => (
      <Popover trigger={<Button>Release notes</Button>} title="Version 2.4.1">
        <p>
          The deploy of web-1 now waits for the health check of every service before it routes traffic, and a
          failed check rolls back to the last image on example.com without asking.
        </p>
      </Popover>
    ),
  },
]);
