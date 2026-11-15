import { retry } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Cluster } from "../cluster/cluster";
import { Stack } from "../stack/stack";
import { StateLabel } from "./state-label";

export default defineExamples("state-label", [
  {
    id: "tones",
    title: "Tones",
    note: "Each tone but neutral and accent brings its own icon.",
    render: () => (
      <Cluster gap="5">
        <StateLabel tone="success">Running</StateLabel>
        <StateLabel tone="warning">Degraded</StateLabel>
        <StateLabel tone="danger">Failed</StateLabel>
        <StateLabel tone="info">Scheduled</StateLabel>
        <StateLabel tone="accent">Pinned</StateLabel>
        <StateLabel>Stopped</StateLabel>
      </Cluster>
    ),
  },
  {
    id: "icon",
    title: "Own icon",
    render: () => (
      <StateLabel tone="info" icon={<Glyph body={retry} />}>
        Restarting
      </StateLabel>
    ),
  },
  {
    id: "long",
    title: "Long text",
    render: () => (
      <Stack>
        <StateLabel tone="danger">
          Failed: the health check on web-1 timed out three times in a row after the last update
        </StateLabel>
      </Stack>
    ),
  },
]);
