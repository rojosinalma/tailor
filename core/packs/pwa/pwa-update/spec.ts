import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "pwa-update",
  name: "Update notice",
  pack: "pwa",
  group: "feedback",
  description:
    'Shows "A new version is ready" with a Reload button when the service worker has a new version waiting. The page never reloads by itself, except with mode="silent": then the update starts at the next link click or when the page is hidden, never while a field has the focus. Place it once at the top of the content region. React: <PwaUpdate /> inside <PwaProvider worker="/sw.js">. HTML: <div class="t-pwa-update" data-t="pwa-update" role="status"></div> (add data-mode="silent" for the silent mode).',
  root: "t-pwa-update",
  props: { mode: ["notice", "silent"] },
  html: "script",
});
