import { Avatar as Base } from "@base-ui/react/avatar";
import type spec from "@tailor/packs/core/avatar/spec";
import { useIsStatic } from "../../kit";

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

/** A person or a thing: an image, or the initials of the name. */
export function Avatar({ name, src, size = "md", shape = "circle" }: AvatarProps) {
  const isStatic = useIsStatic();
  const root = {
    className: "t-avatar",
    role: "img",
    "aria-label": name,
    "data-size": size === "md" ? undefined : size,
    "data-shape": shape === "circle" ? undefined : shape,
  };
  if (isStatic) {
    return (
      <span {...root}>
        <span className="t-avatar-initials" aria-hidden="true">
          {initials(name)}
        </span>
        {src ? <img className="t-avatar-image" src={src} alt="" data-initials={initials(name)} /> : null}
      </span>
    );
  }
  return (
    <Base.Root {...root}>
      <Base.Fallback className="t-avatar-initials" aria-hidden="true">
        {initials(name)}
      </Base.Fallback>
      {src ? <Base.Image className="t-avatar-image" src={src} alt="" /> : null}
    </Base.Root>
  );
}
