import { type ReactNode, useState } from "react";
import { Button } from "../../core/button/button";
import { Icon } from "../../core/icon/icon";
import { Menu } from "../../core/menu/menu";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { Composer } from "./composer";

/** Shows what was sent last, so the example proves the send. */
function Sent({ children }: { children: (send: (text: string, files: File[]) => void) => ReactNode }) {
  const [sent, setSent] = useState("Nothing sent yet");
  return (
    <Stack gap="2">
      {children((text, files) =>
        setSent(
          `Sent: ${text || "(no text)"}${files.length ? ` with ${files.map((f) => f.name).join(", ")}` : ""}`,
        ),
      )}
      <p>{sent}</p>
    </Stack>
  );
}

function Busy() {
  const [busy, setBusy] = useState(true);
  return (
    <Stack gap="2">
      <Composer
        label="Reply"
        placeholder="Write a reply"
        busy={busy}
        onStop={() => setBusy(false)}
        onSend={() => setBusy(true)}
      />
      <p>{busy ? "A reply is on its way" : "Stopped"}</p>
    </Stack>
  );
}

const LONG =
  "The deploy of web-1 is done. The cache is warm, the traffic moved from web-2, and the change is closed. alice checked the health of example.com and it reports version 2.14.0.";

export default defineExamples("composer", [
  {
    id: "default",
    title: "Enter sends, Shift+Enter makes a new line",
    note: "On a touch screen Enter makes a new line and the send button sends. The field grows with the text, then scrolls.",
    render: () => (
      <Sent>{(send) => <Composer label="Message" placeholder="Write a message" onSend={send} />}</Sent>
    ),
  },
  {
    id: "attachments",
    title: "With attachments and an extra action",
    note: "The paperclip opens the file chooser; pasted and dropped files are added too.",
    render: () => (
      <Sent>
        {(send) => (
          <Composer
            label="Message with files"
            placeholder="Write a message or attach a file"
            accept="image/*,.pdf,.log"
            onSend={send}
            actions={
              <Menu
                label="Insert"
                trigger={
                  <Button variant="ghost" size="sm" icon={<Icon name="bi:plus-lg" />} label="Insert" />
                }
                items={[
                  { id: "host", label: "Host name" },
                  { id: "date", label: "Today's date" },
                ]}
              />
            }
          />
        )}
      </Sent>
    ),
  },
  {
    id: "busy",
    title: "Busy, with a stop button",
    render: () => <Busy />,
  },
  {
    id: "limit",
    title: "Near the character limit",
    render: () => (
      <Composer label="Short note" maxLength={200} defaultValue={LONG} onSend={() => undefined} />
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <Composer
        label="Closed conversation"
        placeholder="The conversation is closed"
        disabled
        onSend={() => undefined}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Composer label="Narrow message" placeholder="Write a message" accept="*" onSend={() => undefined} />
    ),
  },
]);
