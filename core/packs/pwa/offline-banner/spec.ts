import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "offline-banner",
  name: "Offline banner",
  pack: "pwa",
  group: "feedback",
  description:
    'Shows "You are offline" while the device has no network and announces both the loss and the return. Actions that need the server are disabled while offline, never queued: React <NeedsNetwork><Button>Deploy</Button></NeedsNetwork> and useOnline(); HTML data-t="needs-network" on the element. Place the banner once at the top of the content region. React: <OfflineBanner /> inside <PwaProvider>. HTML: <div class="t-offline-banner" data-t="offline-banner" role="status"></div>.',
  root: "t-offline-banner",
  html: "script",
});
