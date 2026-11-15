import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "avatar",
  name: "Avatar",
  pack: "core",
  group: "display",
  description:
    "A person or a thing: an image, or the initials of the name when there is no image or it does not load.",
  root: "t-avatar",
  parts: {
    "t-avatar-image": "the image, over the initials",
    "t-avatar-initials": "the initials of the name",
  },
  props: { size: SIZES, shape: ["circle", "square"] },
  html: "markup",
});
