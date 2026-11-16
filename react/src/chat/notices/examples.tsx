import { useState } from "react";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { type Notice, Notices } from "./notices";

function Answer({ initial, label }: { initial: Notice[]; label: string }) {
  const [answer, setAnswer] = useState("No answer yet");
  const [items, setItems] = useState(initial);
  const answered = (id: string, text: string) => () => {
    setAnswer(text);
    setItems((list) => list.filter((i) => i.id !== id));
  };
  return (
    <Stack gap="2">
      <Notices
        label={label}
        items={items.map((item) => ({
          ...item,
          actions: item.actions.map((a) => ({
            ...a,
            onSelect: answered(item.id, `${item.title} ${a.label}`),
          })),
        }))}
      />
      <p>{answer}</p>
    </Stack>
  );
}

const none = () => undefined;

const QUESTIONS: Notice[] = [
  {
    id: "restart",
    tone: "warning",
    title: "Restart web-2?",
    text: "It still serves 3 open sessions.",
    actions: [
      { label: "Restart", variant: "primary", onSelect: none },
      { label: "Not now", onSelect: none },
    ],
  },
  {
    id: "share",
    tone: "info",
    title: "Share this conversation with bob?",
    actions: [
      { label: "Share", onSelect: none },
      { label: "Keep private", onSelect: none },
    ],
  },
];

const MANY: Notice[] = [
  ...QUESTIONS,
  {
    id: "long",
    tone: "neutral",
    title: "The conversation is long",
    text: "Older messages load when you scroll up.",
    actions: [{ label: "Dismiss", onSelect: none }],
  },
  {
    id: "quota",
    tone: "danger",
    title: "The nas is 95% full",
    text: "New files cannot be attached until space is free.",
    actions: [{ label: "Open storage", onSelect: none }],
  },
  {
    id: "done",
    tone: "success",
    title: "The backup of nas finished",
    actions: [{ label: "Dismiss", onSelect: none }],
  },
];

export default defineExamples("notices", [
  {
    id: "default",
    title: "Questions that wait for an answer",
    render: () => <Answer label="Waiting for you" initial={QUESTIONS} />,
  },
  {
    id: "many",
    title: "More than three collapse",
    render: () => <Answer label="Open questions" initial={MANY} />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Answer label="Narrow questions" initial={QUESTIONS} />,
  },
]);
