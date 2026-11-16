import { useState } from "react";
import { Page } from "../../core/page/page";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { type CalendarEvent, CalendarView } from "./calendar-view";

const EVENTS: readonly CalendarEvent[] = [
  { id: "freeze", title: "Change freeze", start: "2026-11-12", end: "2026-11-17", tone: "warning" },
  {
    id: "deploy",
    title: "Deploy window",
    start: "2026-11-15T14:30",
    end: "2026-11-15T16:00",
    tone: "accent",
  },
  {
    id: "backup",
    title: "Backup check on nas",
    start: "2026-11-15T09:00",
    end: "2026-11-15T10:00",
    tone: "info",
  },
  { id: "review", title: "Review with alice", start: "2026-11-15T09:30", end: "2026-11-15T10:30" },
  { id: "patch", title: "Patch web-1", start: "2026-11-15T11:00", tone: "success" },
  {
    id: "rotate",
    title: "Rotate the certificates of example.com",
    start: "2026-11-15T18:00",
    tone: "danger",
  },
  { id: "standup", title: "Standup", start: "2026-11-16T09:00", end: "2026-11-16T09:30" },
  { id: "move", title: "Move db-1", start: "2026-11-18T22:00", end: "2026-11-19T02:00", tone: "danger" },
  {
    id: "docs",
    title: "Read the runbook",
    start: "2026-11-19T13:00",
    end: "2026-11-19T14:00",
    to: "#runbook",
  },
  { id: "audit", title: "Audit", start: "2026-11-03", tone: "neutral" },
  { id: "offsite", title: "Offsite", start: "2026-11-25", end: "2026-11-27", tone: "success" },
  { id: "early", title: "Early build", start: "2026-11-10T07:00", end: "2026-11-10T08:00" },
];

function Picked() {
  const [picked, setPicked] = useState("Nothing picked yet.");
  return (
    <Stack gap="2">
      <CalendarView
        label="Schedule with actions"
        events={EVENTS}
        defaultDate="2026-11-15"
        onSelectEvent={(event) => setPicked(`Event: ${event.title}`)}
        onSelectSlot={(start, end) => setPicked(`Free time: ${start} to ${end}`)}
      />
      <p aria-live="polite">{picked}</p>
    </Stack>
  );
}

export default defineExamples("calendar-view", [
  {
    id: "month",
    title: "Month",
    note: "Arrow keys move between days, Enter opens a day. A day with more events than room shows +N more.",
    render: () => <CalendarView label="Schedule" events={EVENTS} defaultDate="2026-11-15" />,
  },
  {
    id: "week",
    title: "Week",
    note: "The hours scroll inside the view and start at the working hours. Events at the same time sit side by side.",
    render: () => (
      <CalendarView label="Week schedule" events={EVENTS} defaultDate="2026-11-15" defaultView="week" />
    ),
  },
  {
    id: "agenda",
    title: "Agenda",
    render: () => (
      <CalendarView label="Agenda" events={EVENTS} defaultDate="2026-11-15" defaultView="agenda" />
    ),
  },
  {
    id: "actions",
    title: "Picking an event or a free day",
    note: "With onSelectSlot, Enter on a day or a click on a free time reports the slot.",
    render: () => <Picked />,
  },
  {
    id: "sunday",
    title: "Weeks from Sunday, in another language",
    render: () => (
      <CalendarView label="Kalender" events={EVENTS} defaultDate="2026-11-15" weekStart={0} locale="de-DE" />
    ),
  },
  {
    id: "empty",
    title: "No events",
    render: () => (
      <CalendarView label="Empty schedule" events={[]} defaultDate="2026-11-15" defaultView="agenda" />
    ),
  },
  {
    id: "narrow-month",
    title: "Narrow month",
    note: "Dots in place of the bars, and the events of the picked day under the grid.",
    width: "sm",
    render: () => <CalendarView label="Narrow schedule" events={EVENTS} defaultDate="2026-11-15" />,
  },
  {
    id: "narrow-week",
    title: "Narrow week",
    note: "One day at a time; the day buttons pick the day.",
    width: "sm",
    render: () => (
      <CalendarView label="Narrow week" events={EVENTS} defaultDate="2026-11-15" defaultView="week" />
    ),
  },
  {
    id: "fill",
    title: "In a fill page",
    note: "The week takes the free height of the page.",
    display: "frame",
    render: () => (
      <Page title="On call" mode="fill">
        <CalendarView label="On call week" events={EVENTS} defaultDate="2026-11-15" defaultView="week" />
      </Page>
    ),
  },
]);
