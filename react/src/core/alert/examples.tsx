import { TONES } from "@tailor/core/spec";
import { useState } from "react";
import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Stack } from "../stack/stack";
import { Alert } from "./alert";

function Closable() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Alert tone="success" title="Backup finished" onClose={() => setOpen(false)}>
      nas copied 1,204 files to example.com in 3 minutes.
    </Alert>
  ) : (
    <Button onClick={() => setOpen(true)}>Show the alert again</Button>
  );
}

export default defineExamples("alert", [
  {
    id: "tones",
    title: "Tones",
    render: () => (
      <Stack>
        {TONES.map((tone) => (
          <Alert key={tone} tone={tone}>
            Tone {tone}: a message about the host web-1.
          </Alert>
        ))}
      </Stack>
    ),
  },
  {
    id: "title-actions",
    title: "With a title and actions",
    render: () => (
      <Alert
        tone="danger"
        title="The deploy failed"
        actions={
          <>
            <Button size="sm">Show the log</Button>
            <Button size="sm" variant="ghost">
              Try again
            </Button>
          </>
        }
      >
        web-1 did not answer the health check within 30 seconds.
      </Alert>
    ),
  },
  {
    id: "closable",
    title: "With a close button",
    note: "In the HTML kit the app handles the click on the close button.",
    render: () => <Closable />,
  },
  {
    id: "long",
    title: "Long content",
    render: () => (
      <Alert tone="warning" title="The certificate of example.com ends in 6 days">
        The automatic renewal failed twice because the address
        https://example.com/.well-known/acme-challenge/a-very-long-token-that-does-not-break-anywhere did not
        answer. Check the route of web-1 and the firewall of nas, then start the renewal again.
      </Alert>
    ),
  },
]);
