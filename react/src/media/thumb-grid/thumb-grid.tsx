import { file, play } from "@tailor/core/glyphs.gen";
import type spec from "@tailor/packs/media/thumb-grid/spec";
import type { MouseEvent, ReactNode } from "react";
import { Skeleton } from "../../core/skeleton/skeleton";
import { Glyph } from "../../glyph";
import { AppLink } from "../../link";

export type ThumbKind = (typeof spec.props.kind)[number];

export interface ThumbItem {
  id: string;
  /** The preview image. For a video, its poster. */
  src: string;
  /** What the image shows. It names the tile when there is no caption. */
  alt: string;
  /** The name under the preview; it truncates. */
  caption?: string;
  /** A line of details, such as "2.4 MB · Nov 14". */
  meta?: string;
  /** "video" puts a play mark on the poster, "file" a file badge. */
  kind?: ThumbKind;
  /** Makes the tile a link. With `onSelect` too, a click calls onSelect and the link is the fallback. */
  to?: string;
  /** Makes the tile a button. */
  onSelect?: () => void;
  /** Marks the tile as the current one. */
  selected?: boolean;
  /** Shows a placeholder while the preview loads. */
  loading?: boolean;
  /** Buttons over the corner of the preview. They stay clickable. */
  actions?: ReactNode;
}

export interface ThumbGridProps {
  /** The accessible name of the grid. */
  label: string;
  /** The least width of a tile. */
  min?: (typeof spec.props.min)[number];
  ratio?: (typeof spec.props.ratio)[number];
  items: readonly ThumbItem[];
}

/** Extra attributes on the link of a tile, for a component that builds on the grid. */
export type ThumbLinkData = (item: ThumbItem, index: number) => Record<`data-${string}`, string | undefined>;

function Name({ item, index, linkData }: { item: ThumbItem; index: number; linkData?: ThumbLinkData }) {
  const { caption, alt, to, onSelect, selected } = item;
  const named = caption ? {} : { "aria-label": alt };
  if (to !== undefined) {
    const select = onSelect
      ? (event: MouseEvent) => {
          event.preventDefault();
          onSelect();
        }
      : undefined;
    return (
      <AppLink
        to={to}
        className="t-thumbs-name"
        aria-current={selected ? "true" : undefined}
        onClick={select}
        {...named}
        {...linkData?.(item, index)}
      >
        {caption}
      </AppLink>
    );
  }
  if (onSelect) {
    return (
      <button
        type="button"
        className="t-thumbs-name"
        aria-pressed={selected === undefined ? undefined : selected}
        onClick={onSelect}
        {...named}
      >
        {caption}
      </button>
    );
  }
  return caption ? <span className="t-thumbs-name">{caption}</span> : null;
}

/** The grid itself. Gallery uses it with extra attributes on the links. */
export function renderThumbGrid(
  { label, min = "xs", ratio = "4:3", items }: ThumbGridProps,
  linkData?: ThumbLinkData,
) {
  return (
    <ul
      className="t-thumbs"
      aria-label={label}
      data-min={min === "xs" ? undefined : min}
      data-ratio={ratio === "4:3" ? undefined : ratio}
    >
      {items.map((item, index) => {
        const interactive = !item.loading && (item.to !== undefined || item.onSelect !== undefined);
        const named = interactive || item.caption;
        return (
          <li key={item.id}>
            <figure
              className="t-thumbs-item"
              data-t-hit={interactive ? "" : undefined}
              aria-busy={item.loading ? true : undefined}
            >
              <div className="t-thumbs-preview">
                {item.loading ? (
                  <Skeleton shape="box" />
                ) : (
                  <img className="t-thumbs-image" src={item.src} alt={named ? item.alt : ""} />
                )}
                {item.kind === "video" || item.kind === "file" ? (
                  <span className="t-thumbs-kind" data-kind={item.kind} aria-hidden="true">
                    <Glyph body={item.kind === "video" ? play : file} />
                  </span>
                ) : null}
              </div>
              <figcaption className="t-thumbs-caption">
                {item.loading ? (
                  <Skeleton />
                ) : (
                  <>
                    <Name item={item} index={index} linkData={linkData} />
                    {item.meta ? <span className="t-thumbs-meta">{item.meta}</span> : null}
                  </>
                )}
              </figcaption>
              {item.actions && !item.loading ? <div className="t-thumbs-actions">{item.actions}</div> : null}
            </figure>
          </li>
        );
      })}
    </ul>
  );
}

/** A grid of media tiles: images, video posters and files with a preview. */
export function ThumbGrid(props: ThumbGridProps) {
  return renderThumbGrid(props);
}
