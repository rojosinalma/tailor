import { Badge } from "../../core/badge/badge";
import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { defineExamples } from "../../examples";
import { sampleImage } from "../thumb-grid/examples";
import { Carousel } from "./carousel";

const HOSTS = [
  { name: "web-1", role: "Web server", state: "running" },
  { name: "web-2", role: "Web server", state: "running" },
  { name: "nas", role: "Storage, 4 disks", state: "degraded" },
  { name: "db-1", role: "Database", state: "running" },
  { name: "backup", role: "Nightly backups", state: "idle" },
  { name: "edge", role: "Reverse proxy", state: "running" },
  { name: "build", role: "Build runner", state: "idle" },
] as const;

const tone = (state: string) =>
  state === "running" ? "success" : state === "degraded" ? "warning" : "neutral";

const hostCards = (count: number) =>
  HOSTS.slice(0, count).map((host) => (
    <Card
      key={host.name}
      title={host.name}
      description={host.role}
      actions={<Badge tone={tone(host.state)}>{host.state}</Badge>}
      footer={<Button size="sm">Open</Button>}
    >
      Uptime 14 days, last deploy Nov 14, 2026.
    </Card>
  ));

export default defineExamples("carousel", [
  {
    id: "cards",
    title: "Cards, three per view",
    note: "A narrower container shows two, a phone one. Swipe, use the buttons or the dots, or the arrow keys.",
    render: () => (
      <Carousel label="Hosts" perView="3">
        {hostCards(7)}
      </Carousel>
    ),
  },
  {
    id: "photos",
    title: "Photos, one per view, looping",
    note: "A bare image as a slide fills it.",
    render: () => (
      <Carousel label="Photos" loop>
        {[0, 1, 2, 3].map((i) => (
          <img key={i} src={sampleImage(i, "16:9")} alt={`Hills and a sun, view ${i + 1}`} />
        ))}
      </Carousel>
    ),
  },
  {
    id: "two",
    title: "Two per view, small gap",
    render: () => (
      <Carousel label="Services" perView="2" gap="2">
        {hostCards(5)}
      </Carousel>
    ),
  },
  {
    id: "fits",
    title: "Everything fits",
    note: "When all slides fit in one view, the controls stay hidden.",
    render: () => (
      <Carousel label="Two hosts" perView="2">
        {hostCards(2)}
      </Carousel>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Carousel label="Narrow hosts" perView="3">
        {hostCards(4)}
      </Carousel>
    ),
  },
]);
