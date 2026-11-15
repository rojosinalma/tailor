import { defineExamples } from "../../examples";
import { FilePicker } from "./file";

export default defineExamples("file", [
  {
    id: "default",
    title: "One file",
    render: () => <FilePicker name="config" label="Config file" />,
  },
  {
    id: "multiple",
    title: "Several files, with limits",
    note: "At most 3 PDF or text files of up to 1 MB each. A refused file gets an error line that says why.",
    render: () => (
      <FilePicker
        name="attachments"
        label="Attachments"
        multiple
        accept=".pdf,.txt"
        maxSize={1_000_000}
        maxFiles={3}
        hint="PDF or text, up to 1 MB each"
      />
    ),
  },
  {
    id: "images",
    title: "Images only",
    render: () => <FilePicker name="avatar" label="Avatar" accept="image/*" hint="PNG, JPG or WebP" />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <FilePicker name="locked" label="Locked upload" disabled />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <FilePicker name="logs" label="Log files" multiple hint="Any log file of web-1 or nas" />,
  },
]);
