import { defineExamples } from "../../examples";
import { Icon } from "../icon/icon";
import { RelativeTime } from "../relative-time/relative-time";
import { Timeline, TimelineItem } from "./timeline";

// Fixed dates, so the pages of both kits stay the same whenever they are built.
const at = (time: string): string => `2026-11-15T${time}:00Z`;

export default defineExamples("timeline", [
  {
    id: "deploys",
    title: "Deploy events",
    render: () => (
      <Timeline label="Deploys of web-1">
        <TimelineItem
          title="Deployed nginx:1.27 to nas"
          time={<RelativeTime date={at("11:48")} />}
          tone="success"
          icon={<Icon name="bi:check-circle-fill" />}
        >
          Started by alice. Health check passed after 8 seconds.
        </TimelineItem>
        <TimelineItem
          title="Health check failed"
          time={<RelativeTime date={at("11:46")} />}
          tone="danger"
          icon={<Icon name="bi:x-circle-fill" />}
        >
          GET https://web-1.example.com/health returned 502 three times in a row.
        </TimelineItem>
        <TimelineItem title="Image pulled" time={<RelativeTime date={at("11:44")} />} tone="info" />
        <TimelineItem title="Deploy queued" time={<RelativeTime date={at("11:43")} />} />
      </Timeline>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Timeline label="Deploys of web-1">
        <TimelineItem
          title="Deployed nginx:1.27 to nas"
          time={<RelativeTime date={at("11:48")} />}
          tone="success"
          icon={<Icon name="bi:check-circle-fill" />}
        >
          Started by alice. Health check passed after 8 seconds.
        </TimelineItem>
        <TimelineItem
          title="Health check failed"
          time={<RelativeTime date={at("11:46")} />}
          tone="danger"
          icon={<Icon name="bi:x-circle-fill" />}
        >
          GET https://web-1.example.com/health returned 502 three times in a row.
        </TimelineItem>
        <TimelineItem title="Image pulled" time={<RelativeTime date={at("11:44")} />} tone="info" />
        <TimelineItem title="Deploy queued" time={<RelativeTime date={at("11:43")} />} />
      </Timeline>
    ),
  },
  {
    id: "plain",
    title: "Dots only",
    render: () => (
      <Timeline label="Changes to the host nas">
        <TimelineItem title="Disk replaced" time="Nov 12, 2026" tone="warning" />
        <TimelineItem title="Memory raised to 32 GB" time="Oct 3, 2026" />
        <TimelineItem title="Host added" time="Jan 20, 2026" />
      </Timeline>
    ),
  },
]);
