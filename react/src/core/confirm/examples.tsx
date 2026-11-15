import { useState } from "react";
import { defineExamples } from "../../examples";
import { useIsStatic } from "../../kit";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { type ConfirmOptions, ConfirmRegion, useConfirm } from "./confirm";

/** A button that asks, and shows the answer next to it. The HTML kit uses the declarative hook. */
function Ask({ label, result, options }: { label: string; result: string; options: ConfirmOptions }) {
  const isStatic = useIsStatic();
  const confirm = useConfirm();
  const [answer, setAnswer] = useState("");
  const hook = isStatic
    ? {
        "data-t": "confirm-trigger",
        "data-title": options.title,
        "data-text": options.text,
        "data-confirm-label": options.confirmLabel,
        "data-danger": options.danger ? "" : undefined,
        "data-result-target": `#${result}`,
      }
    : { onClick: async () => setAnswer(String(await confirm(options))) };
  return (
    <Cluster align="center">
      <Button variant={options.danger ? "danger" : "default"} {...hook}>
        {label}
      </Button>
      <output id={result} aria-label={`Answer to ${label}`}>
        {answer}
      </output>
    </Cluster>
  );
}

export default defineExamples("confirm", [
  {
    id: "default",
    title: "Before a destructive and an irreversible action",
    note: "The answer shows next to the button.",
    render: () => (
      <Stack>
        <ConfirmRegion />
        <Ask
          label="Delete web-1"
          result="confirm-delete"
          options={{
            title: "Delete web-1?",
            text: "The host and its three services go away for good. Their backups on nas stay.",
            confirmLabel: "Delete",
            danger: true,
          }}
        />
        <Ask
          label="Restart nas"
          result="confirm-restart"
          options={{
            title: "Restart nas?",
            text: "The shares are offline for about two minutes.",
            confirmLabel: "Restart",
          }}
        />
      </Stack>
    ),
  },
]);
