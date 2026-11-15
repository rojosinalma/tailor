import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "context-menu",
  name: "Context menu",
  pack: "core",
  group: "actions",
  description:
    "The menu of an area, opened at the pointer by a right click, a long press, the context-menu key or Shift+F10. Many people never find it: always offer the same actions in a visible menu button too. Takes the same items as the menu.",
  root: "t-context-menu",
  parts: { "t-menu": "the menu that opens; see the menu component" },
  html: "script",
});
