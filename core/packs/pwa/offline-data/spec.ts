import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "offline-data",
  name: "Offline data",
  pack: "pwa",
  group: "feedback",
  description:
    'Keeps the data that the app loaded with TanStack Query in the browser (IndexedDB, else localStorage) and shows it again at the next start and while offline, where queries wait for the network instead of failing. Draws nothing. <OfflineData client={queryClient} storageKey="example" buster={appVersion}> in place of QueryClientProvider; useIsRestoring() is true until the kept data is back. Give a new buster when the shape of the data changes.',
  root: "t-offline-data",
  html: "none",
});
