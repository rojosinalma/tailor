import { useState } from "react";
import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Stack } from "../stack/stack";
import { Banner } from "./banner";

function Closable() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Banner tone="info" action={<Button size="sm">Reload</Button>} onClose={() => setOpen(false)}>
      A new version is ready.
    </Banner>
  ) : (
    <Button onClick={() => setOpen(true)}>Show the banner again</Button>
  );
}

export default defineExamples("banner", [
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Stack>
        <Banner tone="danger">Connection lost. Changes are kept until it is back.</Banner>
        <Banner tone="warning">web-1 runs on its backup disk.</Banner>
        <Banner tone="success">All services are up again.</Banner>
        <Banner tone="info">alice changed the settings of this page.</Banner>
      </Stack>
    ),
  },
  {
    id: "action",
    title: "With an action and a close button",
    note: "In the HTML kit the app handles the click on the close button.",
    render: () => <Closable />,
  },
  {
    id: "long",
    title: "Long content",
    render: () => (
      <Banner tone="warning" action={<Button size="sm">Show the hosts</Button>}>
        Three hosts (web-1, nas and example.com) have not reported for more than ten minutes and may be
        offline.
      </Banner>
    ),
  },
]);
