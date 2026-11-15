import type { Tone } from "@tailor/core/spec";
import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { HistoryBars, type HistoryItem } from "./history-bars";

const days = (count: number, toneOf: (day: number) => Tone): HistoryItem[] =>
  Array.from({ length: count }, (_, i) => {
    const tone = toneOf(i);
    const state =
      tone === "success" ? "up" : tone === "warning" ? "slow" : tone === "danger" ? "down" : "no data";
    return { tone, label: `Day ${i + 1}: ${state}` };
  });

const month = days(30, (d) => (d === 11 ? "danger" : d === 12 || d === 23 ? "warning" : "success"));

export default defineExamples("history-bars", [
  {
    id: "default",
    title: "Uptime, last 30 days",
    render: () => <HistoryBars items={month} label="Uptime of web-1, last 30 days" />,
  },
  {
    id: "small",
    title: "Small",
    render: () => <HistoryBars items={month} label="Uptime of nas, last 30 days" size="sm" />,
  },
  {
    id: "tones",
    title: "Every tone",
    render: () => (
      <HistoryBars
        label="Every tone"
        items={(["neutral", "accent", "success", "warning", "danger", "info"] as const).map((tone) => ({
          tone,
          label: tone,
        }))}
      />
    ),
  },
  {
    id: "extremes",
    title: "Few and many periods",
    note: "One period; and 90 periods, which shrink to fit and never overflow.",
    render: () => (
      <Stack>
        <HistoryBars items={[{ tone: "success", label: "Today: up" }]} label="Uptime of web-2, today" />
        <HistoryBars
          items={days(90, (d) => (d < 10 ? "neutral" : d % 29 === 0 ? "danger" : "success"))}
          label="Uptime of console, last 90 days"
          size="sm"
        />
      </Stack>
    ),
  },
]);
