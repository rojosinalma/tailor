import { useState } from "react";
import { Button } from "../../core/button/button";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Icon } from "../../core/icon/icon";
import { MediaFit } from "../../core/media-fit/media-fit";
import { Page } from "../../core/page/page";
import { Pane } from "../../core/pane/pane";
import { Select } from "../../core/select/select";
import { Split } from "../../core/split/split";
import { Switch } from "../../core/switch/switch";
import { Form, FormActions, FormField, type SubmitResult, useTailorForm } from "../../forms/form/form";
import { FilePicker } from "../../pickers/file/file";

// Sample data: the settings of a render, the choices, and the last result. Replace with what the server sends.

export interface RenderSettings {
  drawing: File[];
  size: string;
  format: string;
  grid: boolean;
}

export const RENDER_DEFAULTS: RenderSettings = { drawing: [], size: "1200x900", format: "png", grid: true };

const SIZES = [
  { value: "1200x900", label: "1200 × 900" },
  { value: "800x600", label: "800 × 600" },
  { value: "400x300", label: "400 × 300" },
];

const FORMATS = [
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

/** A rendered picture of 1200 × 900 pixels, as the server would send it. */
const THUMBNAIL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">' +
    '<rect width="1200" height="900" fill="#eef1f5"/>' +
    '<path d="M100 0V900M200 0V900M300 0V900M400 0V900M500 0V900M600 0V900M700 0V900M800 0V900M900 0V900M1000 0V900M1100 0V900M0 100H1200M0 200H1200M0 300H1200M0 400H1200M0 500H1200M0 600H1200M0 700H1200M0 800H1200" stroke="#c9d1dc"/>' +
    '<path d="M150 150H750V450H1050V750H150Z" fill="#dfe6ee" stroke="#33465c" stroke-width="12"/>' +
    '<path d="M450 150V450H150M750 450V750M450 450H600" fill="none" stroke="#33465c" stroke-width="8"/>' +
    '<circle cx="950" cy="250" r="90" fill="#e3b98f" stroke="#6b4423" stroke-width="8"/>' +
    '<text x="600" y="840" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#33465c">floor-plan.svg</text>' +
    "</svg>",
)}`;

export interface RenderResult {
  file: string;
  src: string;
  width: number;
  height: number;
  /** The facts under the picture. */
  facts: string;
}

export const LAST_RESULT: RenderResult = {
  file: "floor-plan.svg",
  src: THUMBNAIL,
  width: 1200,
  height: 900,
  facts: "1200 × 900 · PNG · 84 kB",
};

/** A stand-in for the server: it takes a moment and sends the picture back. */
async function render(settings: RenderSettings): Promise<SubmitResult> {
  await new Promise((done) => setTimeout(done, 600));
  return { ok: true, message: `${settings.drawing[0]?.name ?? "The drawing"} is rendered.` };
}

/**
 * A tool: the inputs on one side, the result on the other. The Page fills the screen and never scrolls;
 * each Pane scrolls alone, and MediaFit keeps any picture inside its pane.
 * HTML kit: the form posts to its action with fetch; the page's code puts the <img> into the MediaFit.
 */
export function ToolPageLayout({ result: first = LAST_RESULT }: { result?: RenderResult | null }) {
  const [result, setResult] = useState(first);
  const form = useTailorForm<RenderSettings>({
    defaultValues: RENDER_DEFAULTS,
    onSubmit: async (settings) => {
      const answer = await render(settings);
      if (answer.ok) {
        const file = settings.drawing[0]?.name ?? LAST_RESULT.file;
        const size = SIZES.find((s) => s.value === settings.size)?.label ?? "";
        const format = FORMATS.find((f) => f.value === settings.format)?.label ?? "";
        setResult({ ...LAST_RESULT, file, facts: `${size} · ${format}` });
      }
      return answer;
    },
  });
  return (
    <Page title="Thumbnails" description="Render a picture of a drawing file." mode="fill">
      <Split
        label="Resize the settings"
        defaultSize={35}
        min={25}
        max={60}
        first={
          // The submit button sits in the pane footer, so it stays in reach while the fields scroll.
          <Pane title="Settings" footer={<FormActions form={form} submit="Render" />}>
            <Form form={form} action="/api/render" label="Render settings">
              <FormField
                form={form}
                name="drawing"
                label="Drawing"
                help="An SVG or DXF file of up to 5 MB."
                required
              >
                {(control) => (
                  <FilePicker
                    name={control.name}
                    accept=".svg,.dxf"
                    maxSize={5_000_000}
                    onFilesChange={control.onValueChange}
                  />
                )}
              </FormField>
              <FormField form={form} name="size" label="Size">
                {(control) => <Select {...control} options={SIZES} />}
              </FormField>
              <FormField form={form} name="format" label="Format">
                {(control) => <Select {...control} options={FORMATS} />}
              </FormField>
              <FormField form={form} name="grid" label="Draw the grid" kind="toggle">
                {(control) => <Switch {...control} description="Lines every 100 units behind the drawing." />}
              </FormField>
            </Form>
          </Pane>
        }
        second={
          <Pane
            title="Preview"
            actions={
              // The page's code sends the file; the button waits for a result.
              <Button size="sm" icon={<Icon name="bi:download" />} disabled={!result}>
                Download
              </Button>
            }
            footer={result ? <span>{result.facts}</span> : undefined}
          >
            {/* The picture takes the free width and height of the pane, never more, whatever its size. */}
            <MediaFit
              empty={
                <EmptyState
                  icon={<Icon name="bi:image" />}
                  title="No preview yet"
                  text="Choose a drawing and press Render."
                />
              }
            >
              {result ? (
                <img
                  src={result.src}
                  width={result.width}
                  height={result.height}
                  alt={`Preview of ${result.file}`}
                />
              ) : null}
            </MediaFit>
          </Pane>
        }
      />
    </Page>
  );
}
