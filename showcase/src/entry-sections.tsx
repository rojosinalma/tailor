import type { ExampleSet } from "@tailor/react/examples";

/** The examples of one component, one section each. Both kits' entry pages use this same markup. */
export function EntrySections({ set, only }: { set: ExampleSet; only?: string | null }) {
  const examples = only ? set.examples.filter((e) => e.id === only) : set.examples;
  return (
    <main className="sc-entry-main" data-component={set.component}>
      {examples.map((example) => (
        <section className="sc-example" data-example={example.id} key={example.id}>
          <h2 className="sc-example-title">{example.title}</h2>
          {example.note ? <p className="sc-example-note">{example.note}</p> : null}
          <div className="sc-example-body">{example.render()}</div>
        </section>
      ))}
    </main>
  );
}
