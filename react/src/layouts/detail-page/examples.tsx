import { ConfirmRegion } from "../../core/confirm/confirm";
import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { DetailPageLayout } from "./detail-page";

export default defineExamples("detail-page", [
  {
    id: "default",
    title: "One service",
    note: "Delete asks first. The settings tab saves each change by itself.",
    display: "frame",
    render: () => (
      <>
        <ToastRegion />
        <ConfirmRegion />
        <DetailPageLayout />
      </>
    ),
  },
  {
    id: "narrow",
    title: "On a phone",
    note: "Restart stays a button; Logs, Stop and Delete go into the menu.",
    display: "frame",
    width: "sm",
    render: () => <DetailPageLayout />,
  },
]);
