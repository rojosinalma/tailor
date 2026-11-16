/** The reference of one component: its allowed values, its parts, its classes and imports, and its code. */
import type { ComponentSpec } from "@tailor/core/spec";
import { CodeBlock } from "@tailor/react/core/code-block/code-block";
import { Fact, Facts } from "@tailor/react/core/facts/facts";
import { Section } from "@tailor/react/core/section/section";
import { Stack } from "@tailor/react/core/stack/stack";
import { Table } from "@tailor/react/core/table/table";
import { REFERENCE } from "../reference";
import { htmlSupportLabel, importPath, packName } from "./data";

export function ReferenceView({ spec }: { spec: ComponentSpec }) {
  const props = Object.entries(spec.props ?? {});
  const parts = Object.entries(spec.parts ?? {});
  const code = REFERENCE.components[spec.id];
  return (
    <Stack gap="6">
      <Facts>
        <Fact name="Root class" mono>
          {`.${spec.root}`}
        </Fact>
        <Fact name="React import" mono>
          {importPath(spec)}
        </Fact>
        <Fact name="Pack">{packName(spec.pack)}</Fact>
        <Fact name="HTML kit">{htmlSupportLabel(spec.html)}</Fact>
      </Facts>
      {props.length > 0 ? (
        <Section
          title="Properties"
          description="The allowed values of each property. Free means text or content."
        >
          <Table
            caption={`${spec.name} properties`}
            rows={props}
            rowKey={([name]) => name}
            columns={[
              { key: "name", header: "Property", render: ([name]) => <code>{name}</code> },
              {
                key: "values",
                header: "Allowed values",
                render: ([, values]) => (values.length > 0 ? <code>{values.join(" | ")}</code> : "Free"),
              },
            ]}
          />
        </Section>
      ) : null}
      {parts.length > 0 ? (
        <Section title="Parts">
          <Table
            caption={`${spec.name} parts`}
            rows={parts}
            rowKey={([name]) => name}
            columns={[
              { key: "part", header: "Class", render: ([name]) => <code>{`.${name}`}</code> },
              { key: "purpose", header: "Purpose", render: ([, purpose]) => purpose },
            ]}
          />
        </Section>
      ) : null}
      {code?.react ? (
        <Section title="React kit code" description="The first example.">
          <CodeBlock code={code.react} title="React" />
        </Section>
      ) : null}
      {code?.html ? (
        <Section title="HTML kit code" description="The first example.">
          <CodeBlock code={code.html} title="HTML" />
        </Section>
      ) : null}
    </Stack>
  );
}
