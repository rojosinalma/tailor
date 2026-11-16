import { type ReactElement, useId, useState } from "react";
import { Button } from "../../core/button/button";
import { Dialog, DialogClose } from "../../core/dialog/dialog";
import { Icon } from "../../core/icon/icon";
import { Input } from "../../core/input/input";
import { NumberField } from "../../core/number/number";
import { Page } from "../../core/page/page";
import { Select } from "../../core/select/select";
import { Switch } from "../../core/switch/switch";
import {
  Form,
  FormActions,
  FormField,
  FormSummary,
  type SubmitResult,
  useTailorForm,
} from "../../forms/form/form";

// Sample data: the new service as the form starts it, and the hosts it can run on.

export interface NewService {
  name: string;
  host: string;
  image: string;
  port: number | null;
  owner: string;
  start: boolean;
}

export const NEW_SERVICE: NewService = {
  name: "",
  host: "web-1",
  image: "",
  port: 8080,
  owner: "",
  start: true,
};

export const SERVICE_HOSTS = ["web-1", "web-2", "db-1", "nas", "edge"].map((host) => ({
  value: host,
  label: host,
}));

/** A stand-in for the server: it takes a moment and knows the service "api" already. */
async function addService(service: NewService): Promise<SubmitResult> {
  await new Promise((done) => setTimeout(done, 600));
  if (service.name === "api")
    return {
      ok: false,
      message: "The service was not added.",
      errors: { name: "A service named api exists." },
    };
  return { ok: true, message: `${service.name} is added.` };
}

/**
 * The dialog that adds a service, opened by `trigger`. The first-run page opens the same dialog.
 * HTML kit: the form posts to its action with fetch; html/src/layouts/form-dialog.ts closes the dialog
 * when the answer is ok.
 */
export function AddServiceDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const form = useTailorForm<NewService>({
    defaultValues: NEW_SERVICE,
    onSubmit: async (service) => {
      const result = await addService(service);
      // A sent form closes the dialog; the success toast says what happened.
      if (result.ok) {
        setOpen(false);
        form.reset();
      }
      return result;
    },
  });
  return (
    <Dialog
      title="Add service"
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      // The buttons sit in the footer, outside the form, so they stay in reach while the fields scroll on a
      // phone. They name the form by its id. Cancel first, the one primary button last; it shows a spinner
      // while the form sends.
      footer={
        <FormActions form={form} submit="Add service">
          {/* Cancel clears what was typed and the errors, and closes. */}
          <DialogClose>
            <Button type="reset" form={formId} onClick={() => form.reset()}>
              Cancel
            </Button>
          </DialogClose>
        </FormActions>
      }
    >
      <Form form={form} id={formId} action="/api/services" label="Add service">
        {/* After a failed submit: the list of what to correct, with a link to each field. */}
        <FormSummary form={form} />
        {/* The one field that must be filled is marked; every other one has a sensible start value. */}
        <FormField
          form={form}
          name="name"
          label="Name"
          help="Lower-case letters, digits and dashes."
          required
        >
          {/* The pattern says the same as the help; both kits check it and show the pattern message. */}
          {(control) => <Input {...control} pattern="[a-z0-9\-]+" autoComplete="off" />}
        </FormField>
        <FormField form={form} name="host" label="Host">
          {(control) => <Select {...control} options={SERVICE_HOSTS} />}
        </FormField>
        <FormField form={form} name="image" label="Image" help="Leave empty to use the name.">
          {(control) => <Input {...control} autoComplete="off" placeholder="registry/name:tag" />}
        </FormField>
        <FormField form={form} name="port" label="Port">
          {(control) => <NumberField {...control} min={1} max={65535} />}
        </FormField>
        {/* An email field checks its type in both kits, when the focus leaves it and on submit. */}
        <FormField form={form} name="owner" label="Owner email" help="Alerts about the service go here.">
          {(control) => (
            <Input {...control} type="email" autoComplete="email" placeholder="name@example.com" />
          )}
        </FormField>
        <FormField form={form} name="start" label="Start now" kind="toggle">
          {(control) => <Switch {...control} description="Otherwise it waits for the first deploy." />}
        </FormField>
      </Form>
    </Dialog>
  );
}

/** A small page with the button that opens the dialog: the record is added without leaving the page. */
export function FormDialogLayout() {
  return (
    <Page
      title="Services"
      description="What runs on every host."
      primaryAction={
        <AddServiceDialog
          trigger={
            <Button variant="primary" icon={<Icon name="bi:plus-lg" />}>
              Add service
            </Button>
          }
        />
      }
    >
      <p>The list of services goes here.</p>
    </Page>
  );
}
