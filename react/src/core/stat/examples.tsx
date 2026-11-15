import { defineExamples } from "../../examples";
import { Cluster } from "../cluster/cluster";
import { Stat } from "./stat";

function Spark({ points }: { points: string }) {
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default defineExamples("stat", [
  {
    id: "grid",
    title: "A row of stats",
    render: () => (
      <Cluster align="stretch">
        <Stat label="Hosts" value="12" sub="2 added this week" />
        <Stat label="Running" value="11" tone="success" sub="of 12" />
        <Stat label="Failed checks" value="3" tone="danger" sub="+2 since yesterday" />
        <Stat label="Disk used" value="91%" tone="warning" sub="nas, 3.6 of 4 TB" />
      </Cluster>
    ),
  },
  {
    id: "chart",
    title: "With a chart",
    render: () => (
      <Cluster align="stretch">
        <Stat
          label="Requests per minute"
          value="1,284"
          sub="+8% this hour"
          chart={<Spark points="0,25 15,20 30,22 45,14 60,16 75,8 100,5" />}
        />
        <Stat
          label="Errors"
          value="0.4%"
          tone="info"
          sub="last 24 hours"
          chart={<Spark points="0,10 20,12 40,8 60,20 80,15 100,18" />}
        />
      </Cluster>
    ),
  },
  {
    id: "link",
    title: "Clickable",
    render: () => <Stat label="Open issues" value="24" sub="7 new" to="#issues" />,
  },
  {
    id: "long",
    title: "Long value",
    render: () => <Stat label="Largest file" value="1,234,567,890,123 bytes" sub="backup-2026-11-15.tar" />,
  },
]);
