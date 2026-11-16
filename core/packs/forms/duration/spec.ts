import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "duration",
  name: "Duration",
  pack: "forms",
  group: "inputs",
  description:
    "A length of time as a number and a unit in words (seconds, minutes, hours, days). The value is in seconds; it starts in the largest unit that gives a whole number.",
  root: "t-duration",
  parts: { "t-duration-unit": "the unit list's own field, which lays out as the list" },
  props: { units: ["seconds", "minutes", "hours", "days"] },
  html: "script",
});
