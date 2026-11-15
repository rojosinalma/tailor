import { defineExamples } from "../../examples";
import { Field } from "../field/field";
import { RadioGroup } from "./radio";

const plans = [
  { value: "small", label: "Small", description: "1 CPU, 1 GB memory." },
  { value: "medium", label: "Medium", description: "2 CPUs, 4 GB memory." },
  { value: "large", label: "Large", description: "8 CPUs, 32 GB memory." },
  { value: "custom", label: "Custom", description: "Ask alice.", disabled: true },
];

export default defineExamples("radio", [
  {
    id: "default",
    title: "With descriptions",
    render: () => <RadioGroup label="Plan" name="plan" options={plans} defaultValue="medium" />,
  },
  {
    id: "horizontal",
    title: "Horizontal",
    render: () => (
      <RadioGroup
        label="Log level"
        name="level"
        orientation="horizontal"
        defaultValue="info"
        options={[
          { value: "debug", label: "Debug" },
          { value: "info", label: "Info" },
          { value: "warn", label: "Warning" },
          { value: "error", label: "Error" },
        ]}
      />
    ),
  },
  {
    id: "field",
    title: "In a field, with an error",
    note: "The field's label names the group; its help and error describe it.",
    render: () => (
      <Field label="Plan" help="You can change it later." error="Pick a plan." required>
        <RadioGroup name="plan-field" options={plans} />
      </Field>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <RadioGroup
        label="Backup target"
        name="target"
        disabled
        defaultValue="nas"
        options={[
          { value: "nas", label: "nas" },
          { value: "cloud", label: "example.com storage" },
        ]}
      />
    ),
  },
]);
