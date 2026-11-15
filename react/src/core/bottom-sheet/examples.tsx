import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { DialogClose } from "../dialog/dialog";
import { Field } from "../field/field";
import { Input } from "../input/input";
import { Stack } from "../stack/stack";
import { BottomSheet } from "./bottom-sheet";

export default defineExamples("bottom-sheet", [
  {
    id: "choices",
    title: "A menu of choices",
    note: "On a touch screen, swipe the handle or the title down to close.",
    render: () => (
      <BottomSheet trigger={<Button>Actions for web-1</Button>} title="web-1">
        <Stack gap="2">
          {["Restart", "Show the log", "Move to nas"].map((label) => (
            <DialogClose key={label}>
              <Button variant="ghost">{label}</Button>
            </DialogClose>
          ))}
        </Stack>
      </BottomSheet>
    ),
  },
  {
    id: "form",
    title: "A short task",
    render: () => (
      <BottomSheet
        trigger={<Button>Rename web-1</Button>}
        title="Rename web-1"
        footer={
          <>
            <DialogClose>
              <Button>Cancel</Button>
            </DialogClose>
            <DialogClose>
              <Button variant="primary">Rename</Button>
            </DialogClose>
          </>
        }
      >
        <Field label="Name" help="The new name shows in every list at once.">
          <Input name="host" defaultValue="web-1" />
        </Field>
      </BottomSheet>
    ),
  },
]);
