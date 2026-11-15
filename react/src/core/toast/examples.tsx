import { defineExamples } from "../../examples";
import { useIsStatic } from "../../kit";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Dialog } from "../dialog/dialog";
import { ToastRegion, type ToastTone, useToast } from "./toast";

/** A button that shows a toast. The HTML kit uses the declarative hook. */
interface ShowProps {
  tone: ToastTone;
  message: string;
  title?: string;
  /** The label of an action button in the toast. */
  action?: string;
  label: string;
}

function Show({ tone, message, title, action, label }: ShowProps) {
  const isStatic = useIsStatic();
  const toast = useToast();
  const hook = isStatic
    ? {
        "data-t": "toast-trigger",
        "data-tone": tone,
        "data-message": message,
        "data-title": title,
        "data-action": action,
      }
    : {
        onClick: () =>
          toast(tone, message, {
            title,
            action: action ? { label: action, onClick: () => toast("success", "Done.") } : undefined,
          }),
      };
  return <Button {...hook}>{label}</Button>;
}

export default defineExamples("toast", [
  {
    id: "default",
    title: "Outcomes",
    note: 'A danger toast stays until it is closed. Hover a toast to keep it. In the HTML kit a click on Undo fires a "t-toast-action" event on its trigger. A toast from inside a dialog shows above it.',
    render: () => (
      <Cluster>
        <ToastRegion />
        <Show tone="success" label="Save" message="The settings of web-1 are saved." />
        <Show tone="info" label="Sync" title="Sync started" message="nas copies 1,204 files." />
        <Show tone="warning" label="Check disk" message="The disk of nas is 91% full." />
        <Show tone="danger" label="Deploy" title="The deploy failed" message="web-1 did not answer." />
        <Show tone="info" label="Archive web-1" message="web-1 is in the archive." action="Undo" />
        <Dialog trigger={<Button>Edit host</Button>} title="Edit host">
          <Show tone="success" label="Apply" message="The changes to web-1 are applied." />
        </Dialog>
      </Cluster>
    ),
  },
]);
