import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { FormDialogLayout } from "./form-dialog";

export default defineExamples("form-dialog", [
  {
    id: "default",
    title: "Add a service in a dialog",
    note: "Add service opens the form. A submit with errors lists them; the name api exists already. A sent form shows a toast and the dialog closes.",
    display: "frame",
    render: () => (
      <>
        <ToastRegion />
        <FormDialogLayout />
      </>
    ),
  },
  {
    id: "narrow",
    title: "On a phone",
    note: "On a phone the dialog takes the full screen.",
    display: "frame",
    width: "sm",
    render: () => <FormDialogLayout />,
  },
]);
