import { Popover } from "@base-ui/react/popover";
import { t } from "@tailor/core/text";
import {
  areaText,
  fromArea,
  fromHue,
  type Hsv,
  hexToHsv,
  hsvToHex,
  moveArea,
  moveHue,
  parseHex,
} from "@tailor/packs/pickers/color/logic";
import type spec from "@tailor/packs/pickers/color/spec";
import { type CSSProperties, type KeyboardEvent, type PointerEvent, useRef, useState } from "react";
import { useIsStatic } from "../../kit";
import { usePickerField } from "../date/date";

export interface ColorPickerProps {
  /** "#rrggbb"; "" for no colour (with `allowNone`). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Preset colours as "#rrggbb". */
  swatches?: readonly string[];
  /** Adds a None choice, the value "". */
  allowNone?: boolean;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  size?: (typeof spec.props.size)[number];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

/** The custom properties that the area and the thumbs read. */
export const colorVars = (hsv: Hsv): CSSProperties =>
  ({
    "--t-color-hue": hsv.h,
    "--t-color-x": hsv.s,
    "--t-color-y": 1 - hsv.v,
    "--t-swatch": hsvToHex(hsv),
  }) as CSSProperties;

/** The x and y (0–1) of a pointer inside an element. */
export function pointIn(element: Element, event: { clientX: number; clientY: number }) {
  const box = element.getBoundingClientRect();
  return {
    x: box.width ? (event.clientX - box.left) / box.width : 0,
    y: box.height ? (event.clientY - box.top) / box.height : 0,
  };
}

/** A free colour, picked from an area, a hue slider, a hex field or swatches. */
export function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  swatches = [],
  allowNone = false,
  name,
  id,
  disabled,
  required,
  size = "md",
  ...aria
}: ColorPickerProps) {
  const isStatic = useIsStatic();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(parseHex(defaultValue) ?? (allowNone ? "" : "#000000"));
  const current = value !== undefined ? (parseHex(value) ?? (allowNone ? "" : "#000000")) : inner;
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(current || "#000000"));
  const [hex, setHex] = useState(current);
  const popup = useRef<HTMLDivElement>(null);
  const dataSize = size === "md" ? undefined : size;
  const shown = current || t("colorNone");
  const picker = usePickerField({ id, name, disabled, required }, aria, shown);
  const presets = swatches.map(parseHex).filter((s): s is string => s !== null);

  if (isStatic) {
    return (
      <span className="t-color-picker">
        <input
          type={allowNone ? "text" : "color"}
          className="t-control t-input"
          data-t="color"
          data-size={dataSize}
          data-allow-none={allowNone ? "" : undefined}
          data-swatches={presets.length ? presets.join(" ") : undefined}
          pattern={allowNone ? "#[0-9a-fA-F]{6}" : undefined}
          {...picker.native}
          defaultValue={current}
        />
      </span>
    );
  }

  const commit = (next: string, from?: Hsv): void => {
    if (from) setHsv(from);
    else if (next) setHsv(hexToHsv(next));
    setHex(next);
    if (next === current) return;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const pick = (next: Hsv): void => commit(hsvToHex(next), next);

  const drag = (read: (point: { x: number; y: number }) => Hsv) => ({
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      pick(read(pointIn(event.currentTarget, event)));
      event.currentTarget.querySelector<HTMLElement>("[role='slider']")?.focus();
      event.preventDefault();
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        pick(read(pointIn(event.currentTarget, event)));
    },
  });
  const keys = (move: (hsv: Hsv, key: string, shift: boolean) => Hsv | null) => (event: KeyboardEvent) => {
    if (event.key === "Enter") return setOpen(false);
    const next = move(hsv, event.key, event.shiftKey);
    if (!next) return;
    event.preventDefault();
    pick(next);
  };
  const text = areaText(hsv);

  return (
    <span className="t-color-picker">
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setHex(current);
            if (current && hsvToHex(hsv) !== current) setHsv(hexToHsv(current));
          }
        }}
      >
        <Popover.Trigger
          ref={picker.ref}
          type="button"
          className="t-control t-color-picker-trigger"
          aria-haspopup="dialog"
          data-size={dataSize}
          {...picker.trigger}
        >
          <span
            className="t-color-picker-swatch"
            data-none={current ? undefined : ""}
            style={current ? ({ "--t-swatch": current } as CSSProperties) : undefined}
          />
          <span className="t-color-picker-value" id={picker.valueId}>
            {shown}
          </span>
        </Popover.Trigger>
        <input type="hidden" name={picker.field.name} value={current} />
        <Popover.Portal>
          <Popover.Positioner className="t-popup-positioner" sideOffset={4} align="start">
            <Popover.Popup
              ref={popup}
              className="t-popup t-color-picker-popup"
              role="dialog"
              {...picker.popup}
              style={colorVars(hsv)}
              initialFocus={() => popup.current?.querySelector<HTMLElement>(".t-color-area-thumb") ?? true}
              finalFocus={picker.ref}
            >
              <div className="t-color-area" {...drag(({ x, y }) => fromArea(hsv.h, x, y))}>
                <div
                  className="t-color-area-thumb"
                  role="slider"
                  tabIndex={0}
                  aria-label={t("colorArea")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={text.s}
                  aria-valuetext={`${t("colorSaturation")} ${text.s}%, ${t("colorBrightness")} ${text.v}%`}
                  onKeyDown={keys(moveArea)}
                />
              </div>
              <div className="t-color-hue" {...drag(({ x }) => fromHue(hsv, x))}>
                <div
                  className="t-color-hue-thumb"
                  role="slider"
                  tabIndex={0}
                  aria-label={t("colorHue")}
                  aria-valuemin={0}
                  aria-valuemax={360}
                  aria-valuenow={Math.round(hsv.h)}
                  aria-valuetext={`${Math.round(hsv.h)}°`}
                  aria-orientation="horizontal"
                  onKeyDown={keys(moveHue)}
                />
              </div>
              <div className="t-color-picker-row">
                <input
                  className="t-control t-input t-color-hex"
                  data-size="sm"
                  aria-label={t("colorHex")}
                  spellCheck={false}
                  autoComplete="off"
                  value={hex}
                  aria-invalid={hex !== "" && !parseHex(hex) ? true : undefined}
                  onChange={(event) => {
                    setHex(event.target.value);
                    const next = parseHex(event.target.value);
                    if (next) commit(next);
                  }}
                  onBlur={() => setHex(current)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setOpen(false);
                  }}
                />
                {allowNone ? (
                  <button
                    type="button"
                    className="t-btn"
                    data-size="sm"
                    aria-pressed={current === ""}
                    onClick={() => {
                      commit("");
                      setOpen(false);
                    }}
                  >
                    {t("colorNone")}
                  </button>
                ) : null}
              </div>
              {presets.length ? (
                <fieldset className="t-color-swatches" aria-label={t("colorSwatches")}>
                  {presets.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className="t-color-swatch"
                      aria-label={swatch}
                      aria-pressed={swatch === current}
                      style={{ "--t-swatch": swatch } as CSSProperties}
                      onClick={() => commit(swatch)}
                    />
                  ))}
                </fieldset>
              ) : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}
