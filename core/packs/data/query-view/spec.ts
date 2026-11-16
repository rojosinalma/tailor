import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "query-view",
  name: "Query view",
  pack: "data",
  group: "display",
  description:
    'The standard states of loaded data: loading (skeletons, only after 150 ms), an error with Try again, empty, or the content; a refetch keeps the content and shows a thin line on top. React: takes any query of the shape { status, data, error, isFetching, refetch }. HTML kit: the server picks one of the blocks: <div class="t-query" data-state="loading" aria-busy="true"> with t-skeleton parts, data-state="error" around a danger t-alert, data-state="empty" around a t-empty, or the content in a plain t-query (with aria-busy="true" and a t-query-progress first while it refreshes).',
  root: "t-query",
  parts: {
    "t-query-progress": "the thin line on top while data refreshes",
  },
  props: { state: ["loading", "error", "empty"] },
  html: "markup",
});
