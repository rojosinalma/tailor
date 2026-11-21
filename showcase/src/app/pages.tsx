/** The pages of the site: the overview, a component and a shell. */
import type { ComponentSpec } from "@tailor/core/spec";
import { Badge } from "@tailor/react/core/badge/badge";
import { ButtonLink } from "@tailor/react/core/button/button";
import { Card } from "@tailor/react/core/card/card";
import { Cluster } from "@tailor/react/core/cluster/cluster";
import { Grid } from "@tailor/react/core/grid/grid";
import { Icon } from "@tailor/react/core/icon/icon";
import { Page } from "@tailor/react/core/page/page";
import { Prose } from "@tailor/react/core/prose/prose";
import { Section } from "@tailor/react/core/section/section";
import { Stat } from "@tailor/react/core/stat/stat";
import { Table } from "@tailor/react/core/table/table";
import { Tabs } from "@tailor/react/core/tabs/tabs";
import type { ExampleSet } from "@tailor/react/examples";
import { appPages, htmlAddress, reactAddress, startPage } from "../demo/routes";
import { COMPONENTS, htmlSupportLabel, PACK_LIST, packHtmlLabel, packName, SHELLS, THEME } from "./data";
import { ExamplesView, Stage, ViewControls } from "./examples-view";
import { Frame } from "./frames";
import { ReferenceView } from "./reference-view";
import { DEVICES, useView } from "./state";

const firstSentence = (text: string): string => {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
};

/** The line under a page title: the first sentence of the description, when it is short. */
const headline = (text: string): string | undefined => {
  const first = firstSentence(text);
  return first.length <= 80 ? first : undefined;
};

/** The rest of the description under the header: what the header line does not say. */
function MoreText({ text }: { text: string }) {
  const line = headline(text);
  const rest = line === undefined ? text : text.slice(line.length).trim();
  if (rest === "") return null;
  return (
    <Prose>
      <p>{rest}</p>
    </Prose>
  );
}

export function OverviewPage() {
  return (
    <Page title="tailor" description="A UI framework: standard shells and components, in two kits.">
      <Prose>
        <p>
          Tailor gives the shells and components that a UI is built from, so that the UI is right the first
          time: spacing, theming, layout and behaviour. Every component works in every skin and palette, dark
          and light, on a desktop and on a phone. Two kits draw the same markup: a React kit, and plain HTML
          with a small script.
        </p>
      </Prose>
      <Grid min="2xs">
        <Stat label="Shells" value={String(SHELLS.length)} />
        <Stat label="Components" value={String(COMPONENTS.length)} />
        <Stat label="Packs" value={String(PACK_LIST.length)} />
        <Stat label="Skins" value={String(THEME.skins.length)} />
        <Stat label="Palettes" value={String(THEME.palettes.length)} />
      </Grid>
      <Section title="Shells" description="The frame of a UI. Open one to see it as a full UI.">
        <Grid min="xs">
          {SHELLS.map((shell) => (
            <Card key={shell.id} title={shell.name} to={`/shells/${shell.id}`}>
              {firstSentence(shell.description)}
            </Card>
          ))}
        </Grid>
      </Section>
      <Section title="Packs" description="What a project can add. Core comes with every project.">
        <Table
          caption="Packs"
          rows={PACK_LIST}
          rowKey={(pack) => pack.id}
          columns={[
            { key: "name", header: "Pack", render: (pack) => pack.name },
            { key: "description", header: "Description", render: (pack) => pack.description },
            {
              key: "requires",
              header: "Requires",
              priority: "low",
              render: (pack) => (pack.requires.length > 0 ? pack.requires.map(packName).join(", ") : "—"),
            },
            {
              key: "libraries",
              header: "Libraries",
              priority: "low",
              render: (pack) => {
                const libraries = Object.entries(pack.libraries);
                return libraries.length > 0 ? libraries.map(([name, v]) => `${name} ${v}`).join(", ") : "—";
              },
            },
            { key: "html", header: "HTML kit", render: (pack) => packHtmlLabel(pack.html) },
          ]}
        />
      </Section>
    </Page>
  );
}

function Badges({ spec }: { spec: ComponentSpec }) {
  return (
    <Cluster gap="2">
      <Badge tone="accent">{packName(spec.pack)}</Badge>
      <Badge tone={spec.html === "none" ? "neutral" : "success"}>{htmlSupportLabel(spec.html)}</Badge>
    </Cluster>
  );
}

export function ComponentPage({ spec, set }: { spec: ComponentSpec; set: ExampleSet }) {
  return (
    <Page title={spec.name} description={headline(spec.description)}>
      <MoreText text={spec.description} />
      <Badges spec={spec} />
      <Tabs
        label={`${spec.name} views`}
        tabs={[
          {
            id: "examples",
            label: "Examples",
            counter: set.examples.length,
            content: (
              <div className="sc-panel">
                <ViewControls />
                <ExamplesView spec={spec} set={set} />
              </div>
            ),
          },
          {
            id: "reference",
            label: "Reference",
            content: (
              <div className="sc-panel">
                <ReferenceView spec={spec} />
              </div>
            ),
          },
        ]}
      />
    </Page>
  );
}

/** The demo page of a shell in the chosen kit, relative to the site root. */
const demoAddress = (shell: string, kit: string): string =>
  kit === "html" ? htmlAddress({ shell, id: startPage(shell) }) : `demo.html?shell=${shell}`;

/** A link that leaves the site's router: a full address of the same site. */
const fullAddress = (relative: string): string => new URL(relative, location.href).href;

function ShellDemo({ spec }: { spec: ComponentSpec }) {
  const { kit, size } = useView();
  const device = size === "fit" ? undefined : DEVICES[size];
  const address = demoAddress(spec.id, spec.html === "none" ? "react" : kit);
  return (
    <>
      <ViewControls>
        <ButtonLink
          to={fullAddress(address)}
          target="_blank"
          rel="noopener"
          icon={<Icon name="bi:box-arrow-up-right" />}
        >
          Open full screen
        </ButtonLink>
      </ViewControls>
      <Stage size="fit" label={`${spec.name} demo`}>
        <div className="sc-device" data-fit={device ? undefined : ""}>
          <Frame
            // A new frame per kit and size: the demo is a full page and loads again.
            key={`${address} ${size}`}
            src={address}
            label={`${spec.name} demo (${kit === "html" ? "HTML" : "React"} kit)`}
            width={device?.width}
            height={device?.height ?? DEVICES.desktop.height}
          />
        </div>
      </Stage>
    </>
  );
}

/** Every page of the shell's sample app, the stress pages too, each as a full page in both kits. */
function SamplePages({ spec }: { spec: ComponentSpec }) {
  const pages = appPages(spec.id);
  if (pages.length === 0) return null;
  return (
    <Section
      title="Sample pages"
      description="The demo's pages as full pages. A stress page holds long text, names with no break, many rows, large media, or an empty, loading or error state."
    >
      <Table
        caption="Sample pages"
        rows={pages}
        rowKey={(page) => page.id}
        columns={[
          { key: "id", header: "Page", render: (page) => page.id },
          { key: "about", header: "What it shows", render: (page) => page.about },
          {
            key: "stress",
            header: "Kind",
            priority: "low",
            render: (page) => (page.stress ? <Badge tone="warning">Stress</Badge> : "Sample"),
          },
          {
            key: "open",
            header: "Open",
            render: (page) => (
              <Cluster gap="2">
                <ButtonLink size="sm" to={fullAddress(reactAddress(page))} target="_blank" rel="noopener">
                  React
                </ButtonLink>
                {spec.html === "none" ? null : (
                  <ButtonLink size="sm" to={fullAddress(htmlAddress(page))} target="_blank" rel="noopener">
                    HTML
                  </ButtonLink>
                )}
              </Cluster>
            ),
          },
        ]}
      />
    </Section>
  );
}

export function ShellPage({ spec, set }: { spec: ComponentSpec; set: ExampleSet }) {
  return (
    <Page title={spec.name} description={headline(spec.description)}>
      <Badges spec={spec} />
      <ShellDemo spec={spec} />
      <MoreText text={spec.description} />
      <SamplePages spec={spec} />
      <Section title="Reference">
        <ReferenceView spec={spec} />
      </Section>
      <Section title="Examples" description="The shell in a box of its own, in contained mode.">
        <ExamplesView spec={spec} set={set} only={(example) => example.display === "frame"} />
      </Section>
    </Page>
  );
}
