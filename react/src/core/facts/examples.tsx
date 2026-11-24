import { defineExamples } from "../../examples";
import { Badge } from "../badge/badge";
import { Help } from "../help/help";
import { Fact, Facts } from "./facts";

const host = [
  { key: "Name", value: "web-1" },
  { key: "Address", value: "10.0.4.21", mono: true },
  { key: "State", value: <Badge tone="success">running</Badge> },
  { key: "Image", value: "registry.example.com/team/web:2026.11.15-build-4821", mono: true },
  { key: "Last successful backup", value: "15 November 2026, 03:00" },
];

/** Settings as facts, each key with its help: the help buttons sit one above the other. */
const limits = [
  {
    key: "Daily limit",
    help: <Help label="About the daily limit">The most that may be spent in one day.</Help>,
    value: "$120",
  },
  {
    key: "Monthly limit",
    help: <Help label="About the monthly limit">The most that may be spent in one month.</Help>,
    value: "$3,000",
  },
  {
    key: "Alert at",
    help: <Help label="About the alert">A notice goes out at this share of the limit.</Help>,
    value: "80 %",
  },
  {
    key: "Stop at",
    help: <Help label="About the stop">New work stops at this share of the limit.</Help>,
    value: "100 %",
  },
];

/** Columns with a long state, as a dashboard shows it. */
const states = [
  { key: "Pace", value: <Badge tone="warning">Above the required daily average for the month</Badge> },
  { key: "Spent", value: "$1,240.50" },
  { key: "Left", value: "$1,759.50" },
];

export default defineExamples("facts", [
  {
    id: "rows",
    title: "Rows",
    note: "Keys form one column. In a narrow box each value moves under its key.",
    render: () => <Facts items={host} />,
  },
  {
    id: "columns",
    title: "Columns",
    render: () => <Facts layout="columns" items={host} />,
  },
  {
    id: "children",
    title: "Rows as children",
    render: () => (
      <Facts>
        <Fact name="Owner">alice</Fact>
        <Fact name="Fingerprint" mono>
          SHA256:2b8f3c0e9a1d47b6c5e8f0a9d3b7c1e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6
        </Fact>
      </Facts>
    ),
  },
  {
    id: "help",
    title: "A help button on each key",
    note: "On a touch screen each row is tall enough for the touch area of its help button.",
    render: () => <Facts items={limits} />,
  },
  {
    id: "long-badge",
    title: "Columns with a long badge",
    note: "A badge longer than its column ends with an ellipsis.",
    width: "sm",
    render: () => <Facts layout="columns" items={states} />,
  },
]);
