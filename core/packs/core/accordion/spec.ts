import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "accordion",
  name: "Accordion",
  pack: "core",
  group: "display",
  description:
    "Sections that open and close under their titles. By default one is open at a time; with multiple, each opens on its own. The HTML kit uses <details>, which works with no script.",
  root: "t-accordion",
  parts: {
    "t-accordion-item": "one section; open: [data-open] (React kit) or [open] (HTML kit)",
    "t-accordion-trigger": "the title row that opens and closes the section",
    "t-accordion-icon": "the chevron, which turns when the section is open",
    "t-accordion-panel": "the content of the section",
  },
  html: "markup",
});
