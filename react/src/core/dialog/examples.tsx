import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Dialog, DialogClose } from "./dialog";

export default defineExamples("dialog", [
  {
    id: "default",
    title: "With a trigger",
    render: () => (
      <Dialog
        trigger={<Button>Edit host</Button>}
        title="Edit host"
        footer={
          <>
            <DialogClose>
              <Button>Cancel</Button>
            </DialogClose>
            <DialogClose>
              <Button variant="primary">Save</Button>
            </DialogClose>
          </>
        }
      >
        <p>The host web-1 serves three services. A change here applies at once.</p>
      </Dialog>
    ),
  },
  {
    id: "small",
    title: "Small",
    render: () => (
      <Dialog trigger={<Button>About</Button>} title="About" size="sm">
        <p>Version 2.4.1</p>
      </Dialog>
    ),
  },
]);
