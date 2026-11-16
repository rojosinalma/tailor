import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "offline-page",
  name: "Offline page",
  pack: "core",
  group: "pages",
  description:
    "The page for no network connection: a glyph, a title, one sentence and Try again, which reloads. It loads nothing: no sprite icon, no image.",
  root: "t-status-page",
  props: { title: [], text: [] },
  html: "script",
});
