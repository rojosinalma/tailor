import { check, warning } from "@tailor/core/glyphs.gen";
import { TONES } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { Badge } from "./badge";

const VARIANTS = ["soft", "solid", "outline"] as const;

export default defineExamples("badge", [
  {
    id: "tones",
    title: "Tones and variants",
    note: "Soft is the default. Solid is for what needs attention now.",
    render: () => (
      <Stack>
        {VARIANTS.map((variant) => (
          <Cluster key={variant} gap="2">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant={variant}>
                {tone}
              </Badge>
            ))}
          </Cluster>
        ))}
      </Stack>
    ),
  },
  {
    id: "icon",
    title: "With an icon",
    render: () => (
      <Cluster gap="2">
        <Badge tone="success" icon={<Glyph body={check} />}>
          Healthy
        </Badge>
        <Badge tone="warning" variant="solid" icon={<Glyph body={warning} />}>
          Update ready
        </Badge>
      </Cluster>
    ),
  },
  {
    id: "context",
    title: "Next to a name",
    render: () => (
      <Stack gap="2">
        <Cluster gap="2">
          web-1 <Badge tone="info">v2.4.1</Badge> <Badge>staging</Badge>
        </Cluster>
        <Cluster gap="2">
          nas{" "}
          <Badge tone="danger" variant="outline">
            disk full
          </Badge>
        </Cluster>
      </Stack>
    ),
  },
  {
    id: "long",
    title: "Long text",
    note: "A badge stays on one line; text that does not fit ends in an ellipsis.",
    render: () => (
      <Badge tone="accent">
        registry.example.com/team/monitoring-agent:2026.11.15-build-4821-with-a-very-long-tag
      </Badge>
    ),
  },
]);
