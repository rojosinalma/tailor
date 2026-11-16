import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "settings",
  name: "Settings",
  pack: "forms",
  group: "inputs",
  description:
    "A settings page that saves by itself: sections in a side list that marks the section in view (a row of links in a narrow container), rows of Setting with a readable label, a description, an optional help and the control at the end. useAutoSave saves each change (text after a pause) and the row shows saving, saved or not saved with a retry. It fills its parent, a page body or a dialog, and scrolls its content itself.",
  root: "t-settings",
  parts: {
    "t-settings-layout": "the side list and the content side by side, or one above the other",
    "t-settings-nav": "the list of section links",
    "t-settings-link": "one section link; aria-current marks the section in view",
    "t-settings-content": "the sections, which scroll",
    "t-settings-section": "one section with its title",
    "t-settings-section-title": "the title of a section",
    "t-settings-section-description": "the line under the title of a section",
    "t-settings-section-body": "the rows of a section",
    "t-setting": "one setting row (its own root, from Setting)",
    "t-setting-row": "the grid of the label, the description, the help, the control and the state",
    "t-setting-help": "the help button beside the label",
    "t-setting-state": "the save state at the end of the row, a polite live region",
  },
  html: "script",
});
