import { close, plus } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Cluster } from "../cluster/cluster";
import { Button } from "./button";

export default defineExamples("button", [
  {
    id: "variants",
    title: "Variants",
    render: () => (
      <Cluster>
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Cluster>
    ),
  },
  {
    id: "sizes",
    title: "Sizes",
    render: () => (
      <Cluster>
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
      </Cluster>
    ),
  },
  {
    id: "icons",
    title: "With an icon",
    render: () => (
      <Cluster>
        <Button variant="primary" icon={<Glyph body={plus} />}>
          Add host
        </Button>
        <Button icon={<Glyph body={close} />} label="Remove" />
        <Button variant="ghost" icon={<Glyph body={close} />} label="Dismiss" />
      </Cluster>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <Cluster>
        <Button disabled>Default</Button>
        <Button variant="primary" disabled>
          Primary
        </Button>
        <Button variant="danger" disabled>
          Danger
        </Button>
      </Cluster>
    ),
  },
]);
