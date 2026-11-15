import { defineExamples } from "../../examples";
import { ColorPicker } from "./color";

export default defineExamples("color", [
  {
    id: "default",
    title: "With a value",
    render: () => <ColorPicker name="accent" defaultValue="#3366cc" aria-label="Accent colour" />,
  },
  {
    id: "swatches",
    title: "With preset swatches",
    render: () => (
      <ColorPicker
        name="label"
        defaultValue="#2a9d8f"
        swatches={["#e63946", "#f4a261", "#e9c46a", "#2a9d8f", "#264653", "#6d597a"]}
        aria-label="Label colour"
      />
    ),
  },
  {
    id: "none",
    title: "With a None choice",
    note: "None sets the value to an empty text.",
    render: () => <ColorPicker name="highlight" allowNone aria-label="Highlight" />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <ColorPicker defaultValue="#808080" disabled aria-label="Locked colour" />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <ColorPicker defaultValue="#fabd2f" size="sm" aria-label="Badge colour" />,
  },
]);
