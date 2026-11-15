import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Avatar } from "./avatar";

const photo =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3ClinearGradient id='g' x2='1' y2='1'%3E%3Cstop stop-color='teal'/%3E%3Cstop offset='1' stop-color='navy'/%3E%3C/linearGradient%3E%3Crect width='4' height='4' fill='url(%23g)'/%3E%3Ccircle cx='2' cy='1.6' r='.8' fill='wheat'/%3E%3Cellipse cx='2' cy='4' rx='1.5' ry='1.3' fill='wheat'/%3E%3C/svg%3E";

export default defineExamples("avatar", [
  {
    id: "initials",
    title: "Initials, in three sizes",
    render: () => (
      <Cluster>
        <Avatar name="Alice Martin" size="sm" />
        <Avatar name="Alice Martin" />
        <Avatar name="Alice Martin" size="lg" />
      </Cluster>
    ),
  },
  {
    id: "image",
    title: "With an image",
    render: () => (
      <Cluster>
        <Avatar name="Alice Martin" src={photo} size="sm" />
        <Avatar name="Alice Martin" src={photo} />
        <Avatar name="Alice Martin" src={photo} size="lg" />
      </Cluster>
    ),
  },
  {
    id: "square",
    title: "Square, for a thing",
    render: () => (
      <Cluster>
        <Avatar name="web-1" shape="square" />
        <Avatar name="nas" shape="square" size="lg" />
      </Cluster>
    ),
  },
  {
    id: "broken",
    title: "An image that does not load",
    note: "The initials show.",
    render: () => <Avatar name="Bob Stone" src="/missing/bob.png" size="lg" />,
  },
]);
