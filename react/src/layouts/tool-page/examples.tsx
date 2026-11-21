import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { ToolPageLayout } from "./tool-page";

export default defineExamples("tool-page", [
  {
    id: "default",
    title: "Inputs beside the result",
    note: "The preview is 1200 × 900 pixels and fits its pane; the page never scrolls, each pane scrolls alone. Drag the handle to give the result more room.",
    display: "frame",
    render: () => (
      <>
        <ToastRegion />
        <ToolPageLayout />
      </>
    ),
  },
  {
    id: "empty",
    title: "Before the first render",
    note: "Render shows the picture in place of the empty state.",
    display: "frame",
    render: () => <ToolPageLayout result={null} />,
  },
  {
    id: "narrow",
    title: "On a phone",
    note: "One column that scrolls as a page: the inputs in full with Render under them, then the result, fitted to the width.",
    display: "frame",
    width: "sm",
    render: () => <ToolPageLayout />,
  },
]);
