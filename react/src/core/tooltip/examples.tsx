import { defineExamples } from "../../examples";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Icon } from "../icon/icon";
import { Tooltip } from "./tooltip";

export default defineExamples("tooltip", [
  {
    id: "default",
    title: "Names of icon-only buttons",
    note: "Hover a button, or reach it with the Tab key. A touch screen shows no tooltip.",
    render: () => (
      <Cluster gap="2">
        <Tooltip text="Edit">
          <Button icon={<Icon name="bi:pencil" />} label="Edit" />
        </Tooltip>
        <Tooltip text="Copy">
          <Button icon={<Icon name="bi:clipboard" />} label="Copy" variant="ghost" />
        </Tooltip>
        <Tooltip text="Remove">
          <Button icon={<Icon name="bi:trash" />} label="Remove" variant="danger" />
        </Tooltip>
      </Cluster>
    ),
  },
  {
    id: "long",
    title: "Long name",
    render: () => (
      <Tooltip text="Restart every service of web-1 and nas">
        <Button icon={<Icon name="bi:arrow-clockwise" />} label="Restart every service of web-1 and nas" />
      </Tooltip>
    ),
  },
]);
