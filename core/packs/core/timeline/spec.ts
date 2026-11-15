import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "timeline",
  name: "Timeline",
  pack: "core",
  group: "display",
  description: "Events in time order, each with a toned marker on a line that connects them.",
  root: "t-timeline",
  parts: {
    "t-timeline-item": "one event",
    "t-timeline-marker": "a dot or an icon in the tone of the event, with the line to the next one",
    "t-timeline-content": "the title, the time and the body",
    "t-timeline-title": "what happened",
    "t-timeline-time": "when it happened",
    "t-timeline-body": "more detail",
  },
  props: { tone: TONES },
  html: "markup",
});
