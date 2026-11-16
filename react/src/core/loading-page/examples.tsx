import { defineExamples } from "../../examples";
import { LoadingPage } from "./loading-page";

export default defineExamples("loading-page", [
  {
    id: "spinner",
    title: "Spinner",
    note: "It shows after 150 ms, so a fast load never flashes.",
    display: "frame",
    render: () => <LoadingPage />,
  },
  {
    id: "skeleton",
    title: "Skeleton of a page",
    note: "A title, a toolbar and rows, in place of the page that loads.",
    display: "frame",
    render: () => <LoadingPage variant="skeleton" />,
  },
  {
    id: "label",
    title: "Own text, a longer delay",
    display: "frame",
    render: () => <LoadingPage label="Loading the hosts" delay={500} />,
  },
  {
    id: "narrow",
    title: "Narrow",
    display: "frame",
    width: "sm",
    render: () => <LoadingPage variant="skeleton" />,
  },
]);
