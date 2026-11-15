import { check, close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/chip/spec";
import { Glyph } from "../../glyph";

interface ChipBase {
  tone?: (typeof spec.props.tone)[number];
  disabled?: boolean;
  /** The text; it also names the remove button. */
  children: string;
}

interface RemovableChip extends ChipBase {
  /** Shows the remove button. */
  onRemove?: () => void;
  selected?: never;
  onSelectedChange?: never;
}

interface ToggleChip extends ChipBase {
  /** Makes the chip a toggle button. */
  selected: boolean;
  onSelectedChange?: (selected: boolean) => void;
  onRemove?: never;
}

export type ChipProps = RemovableChip | ToggleChip;

/** A value the user added or can toggle: a tag or a filter. */
export function Chip({ tone, disabled, children, ...rest }: ChipProps) {
  if (rest.selected !== undefined) {
    const { selected, onSelectedChange } = rest;
    return (
      <button
        type="button"
        className="t-chip"
        data-tone={tone}
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onSelectedChange?.(!selected)}
      >
        <span className="t-chip-check">
          <Glyph body={check} />
        </span>
        <span className="t-chip-label">{children}</span>
      </button>
    );
  }
  const { onRemove } = rest;
  return (
    <span className="t-chip" data-tone={tone} data-disabled={disabled ? "" : undefined}>
      <span className="t-chip-label">{children}</span>
      {onRemove ? (
        <button
          type="button"
          className="t-chip-remove"
          aria-label={t("removeItem").replace("{label}", children)}
          disabled={disabled}
          onClick={onRemove}
        >
          <Glyph body={close} />
        </button>
      ) : null}
    </span>
  );
}
