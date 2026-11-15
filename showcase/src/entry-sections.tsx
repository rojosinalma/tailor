import type { ExampleSet } from "@tailor/react/examples";

/** The examples of one component, one section each. Both kits' entry pages use this same markup. */
export function EntrySections({
  set,
  title,
  only,
}: {
  set: ExampleSet;
  title: string;
  only?: string | null;
}) {
  const examples = only ? set.examples.filter((e) => e.id === only) : set.examples;
  return (
    <main className="sc-entry-main" data-component={set.component}>
      <h1 className="sc-entry-title">{title}</h1>
      {examples.map((example) => (
        <section
          className="sc-example"
          data-example={example.id}
          data-display={example.display}
          key={example.id}
        >
          <h2 className="sc-example-title">{example.title}</h2>
          {example.note ? <p className="sc-example-note">{example.note}</p> : null}
          <div className="sc-example-body">{example.render()}</div>
        </section>
      ))}
    </main>
  );
}
