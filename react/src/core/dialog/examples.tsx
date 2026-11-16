import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Search } from "../search/search";
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
  {
    id: "top",
    title: "Near the top, without a header",
    note: "As a command palette: the title is only the accessible name; Escape or the backdrop closes it.",
    render: () => (
      <Dialog trigger={<Button>Find a host</Button>} title="Find a host" placement="top" hideHeader>
        <Search label="Host name" shortcut={false} />
      </Dialog>
    ),
  },
]);
