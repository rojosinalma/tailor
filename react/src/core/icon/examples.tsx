import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Icon } from "./icon";

export default defineExamples("icon", [
  {
    id: "sets",
    title: "From the sprite",
    render: () => (
      <Cluster>
        <Icon name="bi:house" />
        <Icon name="bi:gear" />
        <Icon name="bi:hdd-stack" />
        <Icon name="bi:check-circle" label="Healthy" />
        <Icon name="simple-icons:github" label="GitHub" />
      </Cluster>
    ),
  },
]);
