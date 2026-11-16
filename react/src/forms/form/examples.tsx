import { Button } from "../../core/button/button";
import { Check, CheckGroup } from "../../core/check/check";
import { Input } from "../../core/input/input";
import { NumberField } from "../../core/number/number";
import { RadioGroup } from "../../core/radio/radio";
import { Select } from "../../core/select/select";
import { Switch } from "../../core/switch/switch";
import { Textarea } from "../../core/textarea/textarea";
import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { DatePicker } from "../../pickers/date/date";
import { Duration } from "../duration/duration";
import { ListEditor } from "../list-editor/list-editor";
import {
  Form,
  FormActions,
  FormField,
  FormSection,
  FormSummary,
  type SubmitResult,
  type TailorForm,
  useTailorForm,
} from "./form";

const kinds = [
  { value: "server", label: "Server" },
  { value: "storage", label: "Storage" },
  { value: "network", label: "Network device" },
];

const tags = ["backup", "media", "public"];

interface Host {
  name: string;
  address: string;
  email: string;
  port: number | null;
  kind: string;
  tags: string[];
  since: string;
  enabled: boolean;
}

const empty: Host = {
  name: "",
  address: "",
  email: "",
  port: 22,
  kind: "",
  tags: [],
  since: "",
  enabled: true,
};

/** A server that knows web-1 already. The HTML kit sends the same form to /api/hosts. */
async function addHost(host: Host): Promise<SubmitResult> {
  await new Promise((done) => setTimeout(done, 600));
  if (host.name === "web-1")
    return { ok: false, message: "The host was not added.", errors: { name: "A host named web-1 exists." } };
  return { ok: true, message: `${host.name} is added.` };
}

function HostFields({ form, grid }: { form: TailorForm<Host>; grid?: boolean }) {
  return (
    <>
      <FormField
        form={form}
        name="name"
        label="Host name"
        help="Lower-case letters, digits and dashes."
        required
      >
        {(control) => <Input {...control} autoComplete="off" />}
      </FormField>
      <FormField form={form} name="address" label="Address" required>
        {(control) => <Input {...control} autoComplete="off" />}
      </FormField>
      <FormField form={form} name="port" label="Port" required>
        {(control) => <NumberField {...control} min={1} max={65535} />}
      </FormField>
      <FormField form={form} name="kind" label="Kind" required>
        {(control) => <Select {...control} options={kinds} placeholder="Pick a kind" />}
      </FormField>
      <FormField form={form} name="email" label="Contact email" help="Alerts about the host go here.">
        {(control) => <Input {...control} type="email" autoComplete="email" placeholder="name@example.com" />}
      </FormField>
      <FormField form={form} name="since" label="In service since">
        {(control) => <DatePicker {...control} placeholder="Pick a day" />}
      </FormField>
      <FormField form={form} name="tags" label="Tags" kind="group" span={grid}>
        {(control) => (
          <CheckGroup {...control}>
            {tags.map((tag) => (
              <Check key={tag} name="tags" value={tag} label={tag} />
            ))}
          </CheckGroup>
        )}
      </FormField>
      <FormField form={form} name="enabled" label="Watch the host" kind="toggle" span={grid}>
        {(control) => <Switch {...control} description="Alerts start when it stops answering." />}
      </FormField>
    </>
  );
}

function AddHost({ layout }: { layout: "stack" | "grid" }) {
  const form = useTailorForm<Host>({ defaultValues: empty, onSubmit: addHost });
  return (
    <Form form={form} layout={layout} action="/api/hosts" label="Add host">
      <FormSummary form={form} />
      <HostFields form={form} grid={layout === "grid"} />
      <FormActions form={form} submit="Add host">
        <Button type="reset" onClick={() => form.reset()}>
          Reset
        </Button>
      </FormActions>
    </Form>
  );
}

interface Job {
  title: string;
  hosts: string[];
  every: number | null;
  notes: string;
  mode: string;
}

function Sections() {
  const form = useTailorForm<Job>({
    defaultValues: {
      title: "Nightly backup",
      hosts: ["web-1", "nas"],
      every: 86400,
      notes: "",
      mode: "full",
    },
    onSubmit: async (job) => ({ ok: true, message: `${job.title} is saved.` }),
  });
  return (
    <Form form={form} layout="grid" action="/api/jobs" label="Backup job">
      <FormSummary form={form} />
      <FormSection title="Job" description="What runs and how often.">
        <FormField form={form} name="title" label="Title" required>
          {(control) => <Input {...control} autoComplete="off" />}
        </FormField>
        <FormField form={form} name="every" label="Runs every" required>
          {(control) => <Duration {...control} label="Runs every" units={["hours", "days"]} />}
        </FormField>
        <FormField form={form} name="mode" label="Copy" kind="group" span>
          {(control) => (
            <RadioGroup
              {...control}
              orientation="horizontal"
              options={[
                { value: "full", label: "Full copy" },
                { value: "changes", label: "Changes only" },
              ]}
            />
          )}
        </FormField>
      </FormSection>
      <FormSection title="Hosts">
        <FormField
          form={form}
          name="hosts"
          label="Hosts"
          help="The hosts to back up, in order."
          required
          span
        >
          {(control) => <ListEditor {...control} label="Hosts" placeholder="Host name" />}
        </FormField>
        <FormField form={form} name="notes" label="Notes" span>
          {(control) => <Textarea {...control} rows={3} placeholder="What the job is for" />}
        </FormField>
      </FormSection>
      <FormActions form={form} submit="Save job" />
    </Form>
  );
}

interface Account {
  user: string;
}

function Checked() {
  const form = useTailorForm<Account>({
    defaultValues: { user: "" },
    validators: {
      user: (value) =>
        /^[a-z][a-z0-9-]*$/.test(value) ? undefined : "Start with a letter; use a-z, 0-9 and -.",
    },
    onSubmit: async (account) => ({ ok: true, message: `${account.user} can sign in.` }),
  });
  return (
    <Form form={form} label="New user">
      <FormField form={form} name="user" label="User name" required>
        {(control) => <Input {...control} autoComplete="off" />}
      </FormField>
      <FormActions form={form} submit="Add user" />
    </Form>
  );
}

export default defineExamples("form", [
  {
    id: "stack",
    title: "Add a host",
    note: "A host named web-1 exists: the server's error goes on the name. Fields check when the focus leaves them and on submit.",
    render: () => (
      <>
        <ToastRegion />
        <AddHost layout="stack" />
      </>
    ),
  },
  {
    id: "grid",
    title: "Two columns in a wide container",
    note: "A narrow container shows one column.",
    render: () => <AddHost layout="grid" />,
  },
  {
    id: "sections",
    title: "Sections, with the editors of the pack",
    render: () => <Sections />,
  },
  {
    id: "check",
    title: "A check of its own",
    note: "A validator is a function, so it runs in the React kit only; the HTML kit checks the native rules.",
    render: () => <Checked />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <AddHost layout="grid" />,
  },
]);
