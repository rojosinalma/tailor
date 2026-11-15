import { plus } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";
import { EmptyState } from "./empty-state";

export default defineExamples("empty-state", [
  {
    id: "default",
    title: "With an icon, a text and actions",
    render: () => (
      <EmptyState
        icon={<Icon name="bi:hdd-network" />}
        title="No hosts yet"
        text="Add a host to start watching its services."
        actions={
          <>
            <Button variant="primary" icon={<Glyph body={plus} />}>
              Add host
            </Button>
            <Button>Import a list</Button>
          </>
        }
      />
    ),
  },
  {
    id: "small",
    title: "Small, inside a table or a card",
    render: () => (
      <EmptyState
        size="sm"
        icon={<Icon name="bi:search" />}
        title="No results"
        text="No host matches “web-9”. Check the name or clear the filter."
        actions={<Button size="sm">Clear the filter</Button>}
      />
    ),
  },
  {
    id: "title-only",
    title: "A title only",
    render: () => <EmptyState title="Nothing in the queue" />,
  },
  {
    id: "long",
    title: "Long text",
    render: () => (
      <EmptyState
        icon={<Icon name="bi:inbox" />}
        title="There are no backup jobs for the storage volumes on nas at the moment"
        text="A backup job copies a volume to another host on a schedule. Make one for each volume that holds data you cannot get back from another place, such as photos, documents and the databases of your services."
        actions={<Button variant="primary">Make a backup job</Button>}
      />
    ),
  },
]);
