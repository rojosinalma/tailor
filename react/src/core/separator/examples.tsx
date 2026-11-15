import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { Separator } from "./separator";

export default defineExamples("separator", [
  {
    id: "horizontal",
    title: "Across",
    render: () => (
      <Stack>
        <span>Hosts: nas, web-1</span>
        <Separator />
        <span>Users: alice</span>
      </Stack>
    ),
  },
  {
    id: "label",
    title: "With a label",
    render: () => (
      <Stack>
        <Button>Sign in with a passkey</Button>
        <Separator label="or" />
        <Button>Sign in with a password</Button>
      </Stack>
    ),
  },
  {
    id: "vertical",
    title: "Upright, in a row",
    render: () => (
      <Cluster>
        <Button variant="ghost">Edit</Button>
        <Button variant="ghost">Restart</Button>
        <Separator orientation="vertical" />
        <Button variant="danger">Remove</Button>
      </Cluster>
    ),
  },
  {
    id: "decorative",
    title: "Decorative",
    note: "Screen readers skip a decorative line.",
    render: () => (
      <Stack>
        <span>Last backup: Nov 15, 2026</span>
        <Separator decorative />
        <span>Next backup: Nov 16, 2026</span>
      </Stack>
    ),
  },
]);
