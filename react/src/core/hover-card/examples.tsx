import { defineExamples } from "../../examples";
import { Progress } from "../progress/progress";
import { Stack } from "../stack/stack";
import { HoverCard } from "./hover-card";

const web1 = (
  <Stack gap="2">
    <strong>web-1</strong>
    <span>Serves example.com and its API. Up for 41 days.</span>
    <Progress value={62} label="Disk use" showLabel size="sm" />
  </Stack>
);

export default defineExamples("hover-card", [
  {
    id: "default",
    title: "In a sentence",
    note: "Rest the pointer on the link or focus it with the Tab key. A touch screen follows the link.",
    render: () => (
      <p>
        The site runs on{" "}
        <HoverCard to="#web-1" content={web1}>
          web-1
        </HoverCard>{" "}
        and keeps its backups on nas.
      </p>
    ),
  },
  {
    id: "long",
    title: "Long preview",
    render: () => (
      <p>
        Owner:{" "}
        <HoverCard
          to="#alice"
          content={
            <Stack gap="2">
              <strong>alice</strong>
              <span>
                Looks after web-1, web-2 and nas. Asks for a review of every change to the backup jobs and
                keeps the notes of each incident on the shared drive, in a folder per month, with the time
                line, the cause and what changed after it.
              </span>
            </Stack>
          }
        >
          alice
        </HoverCard>
      </p>
    ),
  },
]);
