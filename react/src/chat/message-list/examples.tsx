import { useEffect, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { Cluster } from "../../core/cluster/cluster";
import { Icon } from "../../core/icon/icon";
import { defineExamples } from "../../examples";
import { Composer } from "../composer/composer";
import { Notices } from "../notices/notices";
import { ChatView, type Message, MessageList } from "./message-list";

const day = (date: string) => (time: string) => `${date}T${time}:00Z`;
const nov13 = day("2026-11-13");
const nov14 = day("2026-11-14");
const nov15 = day("2026-11-15");
const alice = { name: "alice" };
const bob = { name: "bob" };

const copy = (text: string) => ({
  label: "Copy",
  icon: <Icon name="bi:copy" />,
  onSelect: () => void navigator.clipboard.writeText(text),
});
const withCopy = (messages: Message[]): Message[] =>
  messages.map((m) => (m.role === "system" ? m : { ...m, actions: [copy(m.text)] }));

const THREAD: Message[] = withCopy([
  {
    id: "d1",
    role: "other",
    author: alice,
    time: nov14("16:02"),
    text: "Is the **web-1** deploy still on for tomorrow?",
  },
  { id: "d2", role: "self", time: nov14("16:05"), text: "Yes, at 10:00. I will post here when it starts." },
  { id: "s1", role: "system", time: nov15("09:58"), text: "bob joined the conversation" },
  { id: "m1", role: "self", time: nov15("10:00"), text: "Starting the deploy of `web-1` now." },
  { id: "m2", role: "other", author: bob, time: nov15("10:01"), text: "Watching the dashboards." },
  { id: "m3", role: "other", author: bob, time: nov15("10:01"), text: "The error rate is flat so far." },
  {
    id: "m4",
    role: "other",
    author: alice,
    time: nov15("10:04"),
    text: "The health check says:\n\n```\nGET https://example.com/health 200 OK\nversion: 2.14.0\n```",
  },
  {
    id: "m5",
    role: "self",
    time: nov15("10:06"),
    text: "Good. Steps left:\n\n1. Warm the cache\n2. Move the traffic from `web-2`\n3. Close the change",
  },
  {
    id: "m6",
    role: "other",
    author: bob,
    time: nov15("10:08"),
    text: "The release notes are attached.",
    attachments: [{ name: "release-2.14.0.pdf", href: "https://example.com/files/release-2.14.0.pdf" }],
  },
  { id: "m7", role: "self", time: nov15("10:12"), text: "All traffic is on web-1. Closing the change." },
  { id: "m8", role: "other", author: alice, time: nov15("10:13"), text: "Thanks, nice work!" },
]);

const REPLY = "Done: the backup of nas finished at 10:20 and the archive is 4.2 GB, as expected.";

/** Text that arrives in eight steps, 50 ms apart: it always ends within half a second. */
function useConversation(initial: Message[]) {
  const [messages, setMessages] = useState(initial);
  const timers = useRef<number[]>([]);
  const next = useRef(0);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, run: () => void): void => {
    timers.current.push(window.setTimeout(run, ms));
  };
  const update = (id: string, change: Partial<Message>): void =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)));

  const stream = (text: string): void => {
    next.current += 1;
    const id = `reply-${next.current}`;
    const words = text.split(" ");
    setMessages((list) => [
      ...list,
      { id, role: "other", author: bob, time: nov15("10:20"), text: "", state: "streaming" },
    ]);
    for (let step = 1; step <= 8; step++) {
      later(step * 50, () =>
        update(id, {
          text: words.slice(0, Math.ceil((words.length * step) / 8)).join(" "),
          state: step === 8 ? undefined : "streaming",
        }),
      );
    }
  };

  const send = (text: string): void => {
    next.current += 1;
    const id = `sent-${next.current}`;
    setMessages((list) => [...list, { id, role: "self", time: nov15("10:19"), text, state: "sending" }]);
    later(100, () => {
      update(id, { state: undefined });
      stream(REPLY);
    });
  };

  return { messages, setMessages, update, stream, send };
}

function Conversation() {
  const { messages, stream, send } = useConversation(THREAD);
  const [asked, setAsked] = useState(true);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    stream(REPLY);
  });
  // While the reply still arrives, a hidden marker tells the image check to wait for the end.
  const arriving = !started.current || messages.some((m) => m.state === "streaming");
  return (
    <ChatView
      messages={
        <>
          {arriving ? <span hidden data-sc-wait="" /> : null}
          <MessageList label="Deploy of web-1" messages={messages} />
        </>
      }
      notices={
        <Notices
          label="Waiting for you"
          items={
            asked
              ? [
                  {
                    id: "restart",
                    tone: "warning",
                    title: "Restart web-2?",
                    text: "It still serves 3 open sessions.",
                    actions: [
                      { label: "Restart", variant: "primary", onSelect: () => setAsked(false) },
                      { label: "Not now", onSelect: () => setAsked(false) },
                    ],
                  },
                ]
              : []
          }
        />
      }
      composer={<Composer label="Message" placeholder="Write a message" onSend={(text) => send(text)} />}
    />
  );
}

function Live() {
  const { messages, stream } = useConversation(THREAD);
  return (
    <>
      <Cluster>
        <Button onClick={() => stream(REPLY)}>Receive a message</Button>
      </Cluster>
      <MessageList label="Live thread" messages={messages} />
    </>
  );
}

function Failed() {
  const { messages, update } = useConversation([
    {
      id: "f1",
      role: "other",
      author: alice,
      time: nov15("11:00"),
      text: "Can you check the backup of nas?",
    },
    { id: "f2", role: "self", time: nov15("11:02"), text: "Checking it now.", state: "failed" },
  ]);
  return (
    <MessageList
      label="Failed message"
      messages={messages}
      onRetry={(id) => {
        update(id, { state: "sending" });
        window.setTimeout(() => update(id, { state: undefined }), 100);
      }}
    />
  );
}

const OLDER: Message[][] = [
  [
    {
      id: "o3",
      role: "other",
      author: alice,
      time: nov13("09:00"),
      text: "Who owns the deploy of web-1 this week?",
    },
    { id: "o4", role: "self", time: nov13("09:10"), text: "I do. It is planned for Sunday." },
  ],
  [
    {
      id: "o1",
      role: "other",
      author: bob,
      time: nov13("08:00"),
      text: "Morning. The change for web-1 is approved.",
    },
    {
      id: "o2",
      role: "other",
      author: bob,
      time: nov13("08:01"),
      text: "The window is Sunday, 10:00 to 11:00.",
    },
  ],
];

function Older() {
  const { messages, setMessages } = useConversation(THREAD);
  const pages = useRef(0);
  return (
    <MessageList
      label="Thread with older messages"
      messages={messages}
      onEndReached={() => {
        const page = OLDER[pages.current];
        if (!page) return;
        pages.current += 1;
        setMessages((list) => [...page, ...list]);
      }}
    />
  );
}

export default defineExamples("message-list", [
  {
    id: "conversation",
    title: "A conversation",
    note: "ChatView puts the transcript, the notices and the composer in a column that fills its parent. Send a message: it shows as sending, then a reply streams in.",
    display: "frame",
    render: () => <Conversation />,
  },
  {
    id: "thread",
    title: "Grouped by author and day",
    note: "The time shows on hover and focus; on a touch screen it always shows, with the message actions.",
    display: "frame",
    render: () => <MessageList label="Deploy of web-1" messages={THREAD} />,
  },
  {
    id: "live",
    title: "New messages while scrolled up",
    note: "At the end, the view follows the new text. Scroll up first: the view stays, and a button leads to the new messages.",
    display: "frame",
    render: () => <Live />,
  },
  {
    id: "older",
    title: "Loading older messages",
    note: "At the top edge, onEndReached loads older messages; the reading position stays.",
    display: "frame",
    render: () => <Older />,
  },
  {
    id: "failed",
    title: "A message that failed",
    render: () => <Failed />,
  },
  {
    id: "relative",
    title: "Relative times, always shown",
    render: () => (
      <MessageList
        label="Short thread"
        times="always"
        timeFormat="relative"
        messages={[
          { id: "r1", role: "other", author: alice, time: nov15("11:20"), text: "Is nas back online?" },
          { id: "r2", role: "self", time: nov15("11:40"), text: "Yes, since a few minutes." },
        ]}
      />
    ),
  },
  {
    id: "long",
    title: "Long words and code",
    render: () => (
      <MessageList
        label="Long content"
        messages={[
          {
            id: "l1",
            role: "other",
            author: { name: "alice" },
            time: nov15("11:00"),
            text: "The log has https://example.com/a/very/long/path/that/does/not/break/anywhere/on/its/own/because/it/is/one/word and this line:\n\n```\nweb-1 kernel: [12345.678901] eth0: link up, 1000 Mbps, full duplex, flow control rx/tx, mtu 9000\n```",
          },
          {
            id: "l2",
            role: "self",
            time: nov15("11:01"),
            text: "Supercalifragilisticexpialidociousconfigurationvalueforweb1 is set.",
          },
        ]}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    display: "frame",
    width: "sm",
    render: () => <MessageList label="Deploy of web-1" messages={THREAD} />,
  },
]);
