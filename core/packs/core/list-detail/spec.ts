import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "list-detail",
  name: "List and detail",
  pack: "core",
  group: "layout",
  description:
    "A list beside a detail view. In a narrow space only one shows: the list, or the open detail with a back button.",
  root: "t-list-detail",
  parts: {
    "t-list-detail-list": "the list region",
    "t-list-detail-detail": "the detail region",
    "t-list-detail-back": "the back button, shown above the detail in a narrow space",
  },
  props: { list: [], detail: [], detailOpen: [], listLabel: [], detailLabel: [] },
  html: "script",
});
