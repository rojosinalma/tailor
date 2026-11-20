import { defineExamples } from "../../examples";
import { EmptyState } from "../empty-state/empty-state";
import { Icon } from "../icon/icon";
import { Pane } from "../pane/pane";
import { MediaFit } from "./media-fit";
import { drawing } from "./sample";

const LARGE = drawing(1200, 900);
const SMALL = drawing(240, 180);
const TALL = drawing(600, 1600);

const noPreview = (
  <EmptyState
    icon={<Icon name="bi:image" />}
    title="No preview yet"
    text="Render a drawing to see it here."
  />
);

export default defineExamples("media-fit", [
  {
    id: "default",
    title: "A large picture in a pane: it fits the free width and height",
    note: "The picture is 1200 × 900 pixels. It scales down with its ratio kept; the pane never grows.",
    display: "frame",
    render: () => (
      <Pane title="Preview">
        <MediaFit>
          <img src={LARGE} width={1200} height={900} alt="Drawing of 1200 × 900 pixels" />
        </MediaFit>
      </Pane>
    ),
  },
  {
    id: "tall",
    title: "A tall picture: the height limits it",
    display: "frame",
    render: () => (
      <Pane title="Preview">
        <MediaFit>
          <img src={TALL} width={600} height={1600} alt="Drawing of 600 × 1600 pixels" />
        </MediaFit>
      </Pane>
    ),
  },
  {
    id: "small",
    title: "A small picture stays at its natural size",
    display: "frame",
    render: () => (
      <Pane title="Preview">
        <MediaFit>
          <img src={SMALL} width={240} height={180} alt="Drawing of 240 × 180 pixels" />
        </MediaFit>
      </Pane>
    ),
  },
  {
    id: "contain",
    title: 'fit="contain": a small picture scales up to the box',
    display: "frame",
    render: () => (
      <Pane title="Preview">
        <MediaFit fit="contain">
          <img src={SMALL} width={240} height={180} alt="Drawing of 240 × 180 pixels, scaled up" />
        </MediaFit>
      </Pane>
    ),
  },
  {
    id: "empty",
    title: "Empty: the empty slot shows until a picture is put in",
    display: "frame",
    render: () => (
      <Pane title="Preview">
        <MediaFit empty={noPreview} />
      </Pane>
    ),
  },
  {
    id: "svg",
    title: "An inline SVG",
    display: "frame",
    render: () => (
      <Pane title="Diagram">
        <MediaFit>
          <svg
            width="800"
            height="400"
            viewBox="0 0 800 400"
            role="img"
            aria-label="Two boxes joined by a line"
          >
            <rect x="40" y="120" width="240" height="160" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect
              x="520"
              y="120"
              width="240"
              height="160"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
            />
            <path d="M280 200H520" stroke="currentColor" strokeWidth="6" />
          </svg>
        </MediaFit>
      </Pane>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow pane",
    display: "frame",
    width: "sm",
    render: () => (
      <Pane title="Preview">
        <MediaFit>
          <img src={LARGE} width={1200} height={900} alt="Drawing of 1200 × 900 pixels, narrow" />
        </MediaFit>
      </Pane>
    ),
  },
]);
