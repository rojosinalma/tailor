import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "toast",
  name: "Toast",
  pack: "core",
  group: "feedback",
  description:
    'A short report of an outcome that leaves by itself after 4 s; a danger toast stays until closed. At most 4 show at once and a toast waits while the pointer or the focus is on it. React: render <ToastRegion /> once, then toast(tone, message, { title, action, duration }) from useToast(). HTML: window.Tailor.toast(tone, message, options), or declaratively <button data-t="toast-trigger" data-tone="success" data-message="Saved" data-title="…" data-action="Undo">; a click on that action fires a bubbling "t-toast-action" event on the trigger.',
  root: "t-toast",
  parts: {
    "t-toasts": "the region at the bottom end that holds the toasts",
    "t-toast-icon": "the glyph of the tone",
    "t-toast-content": "the title and the text",
    "t-toast-title": "the title, optional",
    "t-toast-text": "the message",
    "t-toast-action": "the action button, optional",
    "t-toast-close": "the close button",
  },
  props: { tone: ["success", "warning", "danger", "info"] },
  html: "script",
});
