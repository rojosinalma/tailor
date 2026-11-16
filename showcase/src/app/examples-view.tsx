/** The examples of one component in the chosen kit, inside the box of the Size control. */
import type { ComponentSpec } from "@tailor/core/spec";
import { Alert } from "@tailor/react/core/alert/alert";
import { EmptyState } from "@tailor/react/core/empty-state/empty-state";
import { Icon } from "@tailor/react/core/icon/icon";
import { Section } from "@tailor/react/core/section/section";
import { Segmented } from "@tailor/react/core/segmented/segmented";
import { Stack } from "@tailor/react/core/stack/stack";
import { Toolbar } from "@tailor/react/core/toolbar/toolbar";
import type { Example, ExampleSet } from "@tailor/react/examples";
import { Component, type ReactNode } from "react";
import { Frame, Isolated } from "./frames";
import { type Kit, type Size, useView } from "./state";

export const KIT_OPTIONS = [
  { value: "react", label: "React" },
  { value: "html", label: "HTML" },
] as const;

export const SIZE_OPTIONS = [
  { value: "fit", label: "Fit" },
  { value: "phone", label: "Phone 390" },
  { value: "tablet", label: "Tablet 820" },
  { value: "desktop", label: "Desktop 1440" },
] as const;

/** The Kit and Size controls, in one toolbar that wraps. */
export function ViewControls({ children }: { children?: ReactNode }) {
  const { kit, size, setKit, setSize } = useView();
  return (
    <Toolbar
      start={
        <>
          <Segmented
            label="Kit"
            size="sm"
            options={KIT_OPTIONS}
            value={kit}
            onValueChange={(value) => setKit(value as Kit)}
          />
          <Segmented
            label="Size"
            size="sm"
            options={SIZE_OPTIONS}
            value={size}
            onValueChange={(value) => setSize(value as Size)}
          />
        </>
      }
      end={children}
    />
  );
}

class Guard extends Component<{ children: ReactNode }, { error: string | null }> {
  override state = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  override render() {
    return this.state.error === null ? (
      this.props.children
    ) : (
      <Alert tone="danger" title="The example failed">
        {this.state.error}
      </Alert>
    );
  }
}

function ExampleBody({ example }: { example: Example }) {
  return (
    <div className="sc-example" data-example={example.id} data-display={example.display}>
      <div className="sc-example-body" data-width={example.width}>
        <Guard>{example.render()}</Guard>
      </div>
    </div>
  );
}

/** The box whose width the Size control sets; wider than the window, it scrolls sideways. */
export function Stage({ size, label, children }: { size: Size; label: string; children: ReactNode }) {
  // The outer box keeps the height of the content in a grid that sizes a scrolling box to nothing.
  return (
    <div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls sideways must be reachable with the keyboard. */}
      <section className="sc-stage" aria-label={label} tabIndex={0}>
        <div className="sc-stage-inner" data-size={size}>
          {children}
        </div>
      </section>
    </div>
  );
}

export function ExamplesView({
  spec,
  set,
  only,
}: {
  spec: ComponentSpec;
  set: ExampleSet;
  /** Keeps the examples that pass, such as the frame examples of a shell. */
  only?: (example: Example) => boolean;
}) {
  const { kit, size } = useView();
  const examples = only ? set.examples.filter(only) : set.examples;
  const label = `${spec.name} examples`;
  if (kit === "html" && spec.html === "none")
    return (
      <EmptyState
        icon={<Icon name="bi:filetype-jsx" />}
        title="React kit only"
        text={`The HTML kit has no ${spec.name.toLowerCase()}. Switch the kit to React to see the examples.`}
      />
    );
  if (kit === "react")
    return (
      <Stage size={size} label={label}>
        <Isolated>
          <Stack gap="6">
            {examples.map((example) => (
              <Section key={example.id} title={example.title} description={example.note}>
                <ExampleBody example={example} />
              </Section>
            ))}
          </Stack>
        </Isolated>
      </Stage>
    );
  return (
    <Stage size={size} label={label}>
      <Stack gap="6">
        {examples.map((example) => (
          <Section key={example.id} title={example.title} description={example.note}>
            <Frame
              src={`html/${spec.id}.html?example=${encodeURIComponent(example.id)}&embed=1`}
              label={`${spec.name}: ${example.title} (HTML kit)`}
            />
          </Section>
        ))}
      </Stack>
    </Stage>
  );
}
