import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "search",
  name: "Search field",
  pack: "core",
  group: "inputs",
  description:
    "A search field with a clear button. The / key focuses it; Escape clears it, or leaves it when empty. Debounce the value in the caller.",
  root: "t-search",
  parts: {
    "t-search-icon": "the search glyph, also a t-input-addon",
    "t-search-clear": "the clear button, shown while there is text; also a t-input-action",
    "t-search-key": "the / hint, shown while the field is empty and not focused",
  },
  props: { size: SIZES },
  html: "script",
});
