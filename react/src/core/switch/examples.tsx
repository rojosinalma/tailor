import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { Switch } from "./switch";

export default defineExamples("switch", [
  {
    id: "default",
    title: "Alone",
    render: () => <Switch name="alerts" value="on" label="Alerts" />,
  },
  {
    id: "states",
    title: "On and disabled",
    render: () => (
      <Stack gap="1">
        <Switch label="On" defaultChecked />
        <Switch label="Disabled" disabled />
        <Switch label="Disabled and on" disabled defaultChecked />
      </Stack>
    ),
  },
  {
    id: "description",
    title: "With a description",
    render: () => (
      <Switch
        name="maintenance"
        label="Maintenance mode"
        description="Visitors see a notice while web-1 is down."
        defaultChecked
      />
    ),
  },
]);
