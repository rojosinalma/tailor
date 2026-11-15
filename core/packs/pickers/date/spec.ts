import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "date",
  name: "Date picker",
  pack: "pickers",
  group: "inputs",
  description: "Picks one day from a month calendar. On a phone the calendar opens as a bottom sheet.",
  root: "t-date",
  parts: {
    "t-date-trigger": "the button that shows the date and opens the calendar",
    "t-date-value": "the date text, or the placeholder",
    "t-date-icon": "the calendar icon",
    "t-date-popup": "the calendar surface, also a t-popup",
    "t-calendar": "the month calendar, also usable on its own",
    "t-calendar-header": "the row with the month title and the previous and next buttons",
    "t-calendar-title": "the shown month and year",
    "t-calendar-nav": "the previous or next month button",
    "t-calendar-grid": "the table of days",
    "t-calendar-day": "one day",
    "t-calendar-footer": "the row with the today button",
  },
  props: { size: SIZES },
  html: "script",
});
