import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "file",
  name: "File picker",
  pack: "pickers",
  group: "inputs",
  description:
    "Chooses files: a drop zone with a button, then the list of files with their size and a remove button. Files of the wrong type, too large or too many are refused with the reason.",
  root: "t-file",
  parts: {
    "t-file-zone": "the drop zone; data-dragging on the root while files hover over it",
    "t-file-icon": "the upload icon",
    "t-file-text": "the button and the hints",
    "t-file-hint": "the hint under the button",
    "t-file-list": "the chosen files",
    "t-file-item": "one file",
    "t-file-name": "the file name",
    "t-file-size": "the file size",
    "t-file-remove": "the button that removes one file",
    "t-file-errors": "the error lines of refused files",
  },
  html: "script",
});
