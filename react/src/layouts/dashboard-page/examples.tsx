import { defineExamples } from "../../examples";
import { DashboardPageLayout } from "./dashboard-page";

export default defineExamples("dashboard-page", [
  {
    id: "default",
    title: "The overview of a console",
    display: "frame",
    render: () => <DashboardPageLayout />,
  },
  {
    id: "narrow",
    title: "On a phone",
    note: "The stats and the cards stack in one column.",
    display: "frame",
    width: "sm",
    render: () => <DashboardPageLayout />,
  },
]);
