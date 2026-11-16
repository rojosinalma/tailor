import { defineExamples } from "../../examples";
import { fixedPwa, PwaProvider } from "../pwa-install/pwa-install";
import { PwaUpdate } from "./pwa-update";

const ready = fixedPwa({ updateReady: true });

export default defineExamples("pwa-update", [
  {
    id: "ready",
    title: "A new version is ready",
    render: () => (
      <PwaProvider store={ready}>
        <PwaUpdate />
      </PwaProvider>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow region",
    width: "sm",
    render: () => (
      <PwaProvider store={ready}>
        <PwaUpdate />
      </PwaProvider>
    ),
  },
  {
    id: "live",
    title: "This page",
    note: 'Nothing shows until a new version waits. With mode="silent" nothing shows at all.',
    render: () => (
      <PwaProvider>
        <PwaUpdate />
      </PwaProvider>
    ),
  },
]);
