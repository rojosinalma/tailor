import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { DialogClose } from "../dialog/dialog";
import { Stack } from "../stack/stack";
import { Drawer } from "./drawer";

const details = (
  <Stack>
    <p>web-1 serves three services from the rack in room 2.</p>
    <p>Last deploy: 14 minutes ago, by alice.</p>
  </Stack>
);

const footer = (
  <>
    <DialogClose>
      <Button>Cancel</Button>
    </DialogClose>
    <DialogClose>
      <Button variant="primary">Save</Button>
    </DialogClose>
  </>
);

export default defineExamples("drawer", [
  {
    id: "default",
    title: "From the end",
    render: () => (
      <Drawer trigger={<Button>Host details</Button>} title="Host details" footer={footer}>
        {details}
      </Drawer>
    ),
  },
  {
    id: "sides",
    title: "From the start and from the bottom",
    render: () => (
      <Cluster>
        <Drawer trigger={<Button>Filters</Button>} title="Filters" side="start">
          <p>Show the hosts of nas and example.com only.</p>
        </Drawer>
        <Drawer trigger={<Button>Share</Button>} title="Share" side="bottom" footer={footer}>
          <p>Send a link to this view to alice.</p>
        </Drawer>
      </Cluster>
    ),
  },
  {
    id: "wide",
    title: "Wide, with long content",
    render: () => (
      <Drawer trigger={<Button>Deploy log</Button>} title="Deploy log of web-1" size="md">
        <Stack>
          {Array.from(
            { length: 30 },
            (_, i) => `Step ${i + 1}: pulled the image example.com/web:2.4.1 and checked its signature.`,
          ).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Stack>
      </Drawer>
    ),
  },
]);
