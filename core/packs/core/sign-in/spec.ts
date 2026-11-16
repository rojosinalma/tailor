import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "sign-in",
  name: "Sign-in page",
  pack: "core",
  group: "pages",
  description:
    'A centred sign-in card: brand, title, a real form that password managers fill (name or email, password, keep me signed in), the server\'s error above it, other ways under an "or" line, and links under it. In the HTML kit it posts to `action`.',
  root: "t-sign-in",
  parts: {
    "t-sign-in-box": "the card, capped at a narrow measure",
    "t-sign-in-head": "the brand and the title",
    "t-sign-in-brand": "the logo and the app name",
    "t-sign-in-footer": "a line of links under the card's content",
  },
  props: { identifier: ["email", "username"], action: [], title: [] },
  html: "markup",
});
