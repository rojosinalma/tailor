import { defineExamples } from "../../examples";
import { MarkdownEditor } from "./markdown-editor";

const notes = `## Release notes

The **nas** backup now runs at 02:00. See [the schedule](https://example.com/docs/backup).

- Faster restore
- Smaller archives

> Restart \`web-1\` after the update.`;

export default defineExamples("markdown-editor", [
  {
    id: "tabs",
    title: "Write and Preview tabs",
    note: "Ctrl+B, Ctrl+I and Ctrl+K make the selection bold, italic or a link (Cmd on a Mac).",
    render: () => (
      <form>
        <MarkdownEditor label="Release notes" name="notes" defaultValue={notes} />
      </form>
    ),
  },
  {
    id: "split",
    title: "Side by side",
    note: "In a wide container the text and the preview sit side by side; in a narrow one they become tabs.",
    render: () => <MarkdownEditor label="Description" mode="split" defaultValue={notes} rows={12} />,
  },
  {
    id: "empty",
    title: "Empty, with a placeholder",
    render: () => (
      <MarkdownEditor label="Comment" name="comment" rows={4} placeholder="Leave a comment for alice" />
    ),
  },
  {
    id: "narrow",
    title: "Split mode in a narrow box",
    width: "sm",
    render: () => <MarkdownEditor label="Summary" mode="split" defaultValue={notes} />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <MarkdownEditor label="Locked notes" defaultValue={notes} rows={4} disabled />,
  },
]);
