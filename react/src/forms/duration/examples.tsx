import { useState } from "react";
import { Field } from "../../core/field/field";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { Duration } from "./duration";

function Live() {
  const [seconds, setSeconds] = useState<number | null>(5400);
  return (
    <Stack>
      <Field label="Session length" help={`The value is ${seconds ?? "empty"} seconds.`}>
        <Duration label="Session length" name="session" value={seconds} onValueChange={setSeconds} />
      </Field>
    </Stack>
  );
}

export default defineExamples("duration", [
  {
    id: "default",
    title: "The largest whole unit",
    note: "7200 seconds show as 2 hours, 300 as 5 minutes, 90 as 90 seconds.",
    render: () => (
      <Stack>
        <Duration label="Backup interval" name="interval" defaultValue={7200} />
        <Duration label="Timeout" name="timeout" defaultValue={300} />
        <Duration label="Retry delay" name="retry" defaultValue={90} />
      </Stack>
    ),
  },
  {
    id: "field",
    title: "In a field, with the value in seconds",
    render: () => <Live />,
  },
  {
    id: "units",
    title: "Some units only, with limits",
    note: "Minutes to days, from 5 minutes to 30 days.",
    render: () => (
      <Field label="Keep logs for" help="From 5 minutes to 30 days.">
        <Duration
          label="Keep logs for"
          name="retention"
          defaultValue={1209600}
          units={["minutes", "hours", "days"]}
          min={300}
          max={2592000}
        />
      </Field>
    ),
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <Duration label="Lock time" defaultValue={600} disabled />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Field label="Check every">
        <Duration label="Check every" name="check" defaultValue={3600} />
      </Field>
    ),
  },
]);
