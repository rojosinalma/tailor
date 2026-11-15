import { defineExamples } from "../../examples";
import { Breadcrumb } from "./breadcrumb";

export default defineExamples("breadcrumb", [
  {
    id: "default",
    title: "Three levels",
    render: () => (
      <Breadcrumb
        items={[{ label: "Home", to: "#home" }, { label: "Hosts", to: "#hosts" }, { label: "web-1" }]}
      />
    ),
  },
  {
    id: "deep",
    title: "Deep, with long labels",
    note: "In a narrow container the middle items collapse to an ellipsis; long labels truncate.",
    render: () => (
      <Breadcrumb
        items={[
          { label: "Home", to: "#home" },
          { label: "Hosts", to: "#hosts" },
          { label: "nas", to: "#nas" },
          { label: "Volumes", to: "#volumes" },
          { label: "backup-archive-2026-long-term-retention", to: "#volume" },
          { label: "Snapshot from Sunday 15 November 2026 at 03:00 before the update" },
        ]}
      />
    ),
  },
  {
    id: "two",
    title: "Two levels",
    render: () => <Breadcrumb items={[{ label: "Settings", to: "#settings" }, { label: "Users" }]} />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "The first item, an ellipsis and the last two.",
    width: "sm",
    render: () => (
      <Breadcrumb
        items={[
          { label: "Home", to: "#home" },
          { label: "Hosts", to: "#hosts" },
          { label: "nas", to: "#nas" },
          { label: "Volumes", to: "#volumes" },
          { label: "Snapshots" },
        ]}
      />
    ),
  },
]);
