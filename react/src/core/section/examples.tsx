import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Section } from "./section";

export default defineExamples("section", [
  {
    id: "default",
    title: "Title, description and actions",
    render: () => (
      <Section
        title="Services"
        description="What web-1 runs."
        actions={
          <>
            <Button size="sm">Restart all</Button>
            <Button size="sm" variant="primary">
              Add service
            </Button>
          </>
        }
      >
        <p>Three services run on web-1: the site for example.com, the mail relay and the backup agent.</p>
        <p>Each service restarts on its own when it stops.</p>
      </Section>
    ),
  },
  {
    id: "title-only",
    title: "Title only",
    render: () => (
      <Section title="Notes">
        <p>No notes yet.</p>
      </Section>
    ),
  },
  {
    id: "long",
    title: "A long title wraps; the actions go under it",
    render: () => (
      <Section
        title="Services that run on every host of the example.com network and restart on their own"
        actions={<Button size="sm">Edit</Button>}
      >
        <p>alice owns them.</p>
      </Section>
    ),
  },
]);
