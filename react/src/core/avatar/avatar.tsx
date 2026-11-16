import type spec from "@tailor/packs/core/avatar/spec";

export interface AvatarProps {
  /** The name of the person or thing: the accessible name and the source of the initials. */
  name: string;
  /** The image address. Without one, or when it does not load, the initials show. */
  src?: string;
  size?: (typeof spec.props.size)[number];
  shape?: (typeof spec.props.shape)[number];
}

/** Up to two initials: the first letters of the first and the last word of the name. */
const initials = (name: string): string => {
  const words = name.split(/[\s._-]+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
};

/**
 * A person or a thing: an image, or the initials of the name. The same markup in both kits: the image covers
 * the initials, and the stylesheet draws them again over an image that fails to load.
 */
export function Avatar({ name, src, size = "md", shape = "circle" }: AvatarProps) {
  return (
    <span
      className="t-avatar"
      role="img"
      aria-label={name}
      data-size={size === "md" ? undefined : size}
      data-shape={shape === "circle" ? undefined : shape}
    >
      <span className="t-avatar-initials" aria-hidden="true">
        {initials(name)}
      </span>
      {src ? <img className="t-avatar-image" src={src} alt="" data-initials={initials(name)} /> : null}
    </span>
  );
}
