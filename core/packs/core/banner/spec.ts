import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "banner",
  name: "Banner",
  pack: "core",
  group: "feedback",
  description:
    'A notice across the top of the content region, such as "Connection lost" or "A new version is ready". One line that wraps on a phone. In the HTML kit the app handles the close button.',
  root: "t-banner",
  parts: {
    "t-banner-icon": "the glyph of the tone",
    "t-banner-text": "the message",
    "t-banner-action": "the action button, optional",
    "t-banner-close": "the close button, only when the banner can be closed",
  },
  props: { tone: TONES },
  html: "markup",
});
