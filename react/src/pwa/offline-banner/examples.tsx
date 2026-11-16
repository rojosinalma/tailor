import { Button } from "../../core/button/button";
import { Cluster } from "../../core/cluster/cluster";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { fixedPwa, PwaProvider } from "../pwa-install/pwa-install";
import { NeedsNetwork, OfflineBanner } from "./offline-banner";

const Page = () => (
  <Stack>
    <OfflineBanner />
    <Cluster>
      <NeedsNetwork>
        <Button variant="primary">Deploy web-1</Button>
      </NeedsNetwork>
      <NeedsNetwork>
        <Button>Restart nas</Button>
      </NeedsNetwork>
      <Button>Show the log</Button>
    </Cluster>
  </Stack>
);

const offline = fixedPwa({ offline: true });

export default defineExamples("offline-banner", [
  {
    id: "offline",
    title: "Offline",
    note: "The actions that need the server are disabled; the log is in the page and still opens.",
    render: () => (
      <PwaProvider store={offline}>
        <Page />
      </PwaProvider>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow region",
    width: "sm",
    render: () => (
      <PwaProvider store={offline}>
        <OfflineBanner />
      </PwaProvider>
    ),
  },
  {
    id: "live",
    title: "This page",
    note: "The banner shows when the network goes away, and leaves when it is back.",
    render: () => (
      <PwaProvider>
        <Page />
      </PwaProvider>
    ),
  },
]);
