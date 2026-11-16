import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { FirstRunPageLayout } from "./first-run-page";

export default defineExamples("first-run-page", [
  {
    id: "default",
    title: "Before the first service",
    note: "Add service opens the same dialog as the form-dialog layout.",
    display: "frame",
    render: () => (
      <>
        <ToastRegion />
        <FirstRunPageLayout />
      </>
    ),
  },
  {
    id: "narrow",
    title: "On a phone",
    display: "frame",
    width: "sm",
    render: () => <FirstRunPageLayout />,
  },
]);
