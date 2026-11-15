import { defineExamples } from "../../examples";
import { Badge } from "../badge/badge";
import { Fact, Facts } from "./facts";

const host = [
  { key: "Name", value: "web-1" },
  { key: "Address", value: "10.0.4.21", mono: true },
  { key: "State", value: <Badge tone="success">running</Badge> },
  { key: "Image", value: "registry.example.com/team/web:2026.11.15-build-4821", mono: true },
  { key: "Last successful backup", value: "15 November 2026, 03:00" },
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
]);
