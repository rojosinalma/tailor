import { defineExamples } from "../../examples";
import { OfflinePage } from "./offline-page";

export default defineExamples("offline-page", [
  {
    id: "default",
    title: "Default",
    note: "Try again reloads the page. Nothing on it needs the network.",
    display: "frame",
    render: () => <OfflinePage />,
  },
  {
    id: "text",
    title: "Own text",
    display: "frame",
    render: () => (
      <OfflinePage
        title="nas is out of reach"
        text="This device has no network. Your changes are kept and are sent when the connection is back."
      />
    ),
  },
  {
    id: "narrow",
    title: "Narrow",
    display: "frame",
    width: "sm",
    render: () => <OfflinePage />,
  },
]);
