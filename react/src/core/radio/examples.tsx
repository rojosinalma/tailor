import { defineExamples } from "../../examples";
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
