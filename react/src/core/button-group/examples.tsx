import { chevronLeft, chevronRight, copy, retry } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Button } from "../button/button";
import { Stack } from "../stack/stack";
import { ButtonGroup } from "./button-group";

export default defineExamples("button-group", [
  {
    id: "default",
    title: "Text buttons",
    render: () => (
      <ButtonGroup label="Service">
        <Button>Start</Button>
        <Button>Stop</Button>
        <Button>Restart</Button>
      </ButtonGroup>
    ),
  },
  {
    id: "icons",
    title: "With icons, in three sizes",
    render: () => (
      <Stack gap="2" align="start">
        <ButtonGroup label="Small pager">
          <Button size="sm" icon={<Glyph body={chevronLeft} />} label="Previous" />
          <Button size="sm" icon={<Glyph body={chevronRight} />} label="Next" />
        </ButtonGroup>
        <ButtonGroup label="Host actions">
          <Button icon={<Glyph body={retry} />}>Reload</Button>
          <Button icon={<Glyph body={copy} />}>Copy address</Button>
        </ButtonGroup>
        <ButtonGroup label="Large pager">
          <Button size="lg" icon={<Glyph body={chevronLeft} />} label="Previous" />
          <Button size="lg">Page 3</Button>
          <Button size="lg" icon={<Glyph body={chevronRight} />} label="Next" />
        </ButtonGroup>
      </Stack>
    ),
  },
  {
    id: "variants",
    title: "Primary and disabled",
    render: () => (
      <ButtonGroup label="Deploy">
        <Button variant="primary">Deploy</Button>
        <Button>Preview</Button>
        <Button disabled>Roll back</Button>
      </ButtonGroup>
    ),
  },
  {
    id: "long",
    title: "Long labels truncate",
    note: "The group never wraps; in a narrow space each button shrinks.",
    render: () => (
      <ButtonGroup label="Environments">
        <Button>Production web-1.example.com</Button>
        <Button>Staging web-2.example.com</Button>
        <Button>Development nas.example.com</Button>
      </ButtonGroup>
    ),
  },
]);
