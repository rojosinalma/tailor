import { defineExamples } from "../../examples";
import { Stepper } from "./stepper";

const steps = [
  { id: "host", label: "Host", description: "web-1", to: "#host" },
  { id: "services", label: "Services", description: "3 picked", to: "#services" },
  { id: "access", label: "Access", description: "Who may sign in" },
  { id: "review", label: "Review" },
];

export default defineExamples("stepper", [
  {
    id: "default",
    title: "Horizontal",
    note: "The done steps link back. In a narrow container the stepper turns vertical.",
    render: () => <Stepper steps={steps} current="access" />,
  },
  {
    id: "vertical",
    title: "Vertical",
    render: () => <Stepper steps={steps} current="services" orientation="vertical" />,
  },
  {
    id: "edges",
    title: "At the start, and with a long label",
    render: () => (
      <Stepper
        current="upload"
        steps={[
          { id: "upload", label: "Upload the backup archive from the old nas" },
          { id: "check", label: "Check" },
          { id: "restore", label: "Restore", description: "Takes a few minutes" },
        ]}
      />
    ),
  },
  {
    id: "narrow",
    title: "Horizontal, in a narrow box",
    note: "The horizontal stepper turns vertical.",
    width: "sm",
    render: () => <Stepper steps={steps} current="access" />,
  },
]);
