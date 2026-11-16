import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "log-view",
  name: "Log view",
  pack: "data",
  group: "display",
  description:
    'A log: monospace lines with a time and a level, ANSI colours in the palette hues, a filter that marks matches, a copy button, and follow, which keeps the end in view until the user scrolls up. It fills its parent. HTML kit: <pre class="t-log" data-t="log" aria-label="…"> with the raw text, or <ol class="t-log" data-t="log"> with <li data-level="warn" data-time="10:00:01"> lines; data-wrap wraps long lines, data-follow="off" starts without follow, data-max-lines (default 2000) caps the lines. Append with element.append(…) and a t:append event, or window.Tailor.log(element).append(text). No virtualisation in the HTML kit.',
  root: "t-log",
  parts: {
    "t-log-bar": "the filter, the follow switch and the copy button",
    "t-log-view": "the box that scrolls, with the name of the log",
    "t-log-lines": "the lines (ol, or the pre of the HTML kit)",
    "t-log-line": "one line; data-level and data-tone from its level",
    "t-log-time": "the time column",
    "t-log-level": "the level in words",
    "t-log-text": "the text; ANSI runs carry data-fg, data-bold and data-dim",
    "t-log-mark": "a match of the filter",
    "t-log-jump": "the Jump to end button, shown while follow is off",
  },
  props: { level: ["error", "warn", "info", "debug"] },
  html: "script",
});
