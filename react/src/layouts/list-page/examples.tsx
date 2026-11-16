import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { ListPageLayout } from "./list-page";

export default defineExamples("list-page", [
  {
    id: "default",
    title: "Services, with filters",
    note: "Sort by a header, filter by status, search, select rows for the bulk actions. A search that matches nothing offers Clear filters.",
    display: "frame",
    render: () => (
      <>
        <ToastRegion />
        <ListPageLayout />
      </>
    ),
  },
  {
    id: "narrow",
    title: "On a phone",
    note: "The other page actions go into one menu, each row is a card, and sorting moves into Sort by.",
    display: "frame",
    width: "sm",
    render: () => <ListPageLayout />,
  },
]);
