import { defineExamples } from "../../examples";
import { Accordion, type AccordionItem } from "./accordion";

const hosts: AccordionItem[] = [
  { id: "web-1", title: "web-1", content: <p>Serves example.com and its API. Up for 41 days.</p> },
  { id: "web-2", title: "web-2", content: <p>Stand-by for web-1. Takes over within a minute.</p> },
  { id: "nas", title: "nas", content: <p>Holds the backups and the shared folders of alice.</p> },
];

export default defineExamples("accordion", [
  {
    id: "single",
    title: "One section at a time",
    note: "Opening a section closes the open one.",
    render: () => <Accordion items={hosts} defaultOpen={["web-1"]} />,
  },
  {
    id: "multiple",
    title: "Several sections at once",
    render: () => <Accordion items={hosts} multiple defaultOpen={["web-1", "nas"]} />,
  },
  {
    id: "disabled",
    title: "With a disabled section",
    render: () => (
      <Accordion
        items={[
          ...hosts.slice(0, 2),
          { id: "console", title: "console (offline)", content: <p>No data.</p>, disabled: true },
        ]}
      />
    ),
  },
  {
    id: "long",
    title: "Long titles and content",
    render: () => (
      <Accordion
        items={[
          {
            id: "a",
            title:
              "Why does the nightly backup of the storage volumes on nas take longer on the first day of the month?",
            content: (
              <p>
                On the first day of each month the job makes a full copy instead of a copy of the changes, so
                it reads every file on every volume. It takes about four times as long. The job still ends
                before the morning, when web-1 and web-2 start to get more traffic, so nobody sees the slower
                disks.
              </p>
            ),
          },
          {
            id: "b",
            title: "https://example.com/a/very/long/address/that/has/no/spaces/at/all/to/break/on",
            content: <p>The title breaks inside the word when it has to.</p>,
          },
        ]}
      />
    ),
  },
]);
