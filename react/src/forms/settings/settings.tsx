import { check, danger, retry as retryGlyph } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { activeIndex, SAVED_FOR, type SaveState, saveOutcome } from "@tailor/packs/forms/settings/logic";
import { useDebouncer } from "@tanstack/react-pacer/debouncer";
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "../../core/button/button";
import { Check } from "../../core/check/check";
import { Field } from "../../core/field/field";
import { Help } from "../../core/help/help";
import { Switch } from "../../core/switch/switch";
import { useToast } from "../../core/toast/toast";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export type { SaveState };

export interface SettingsSectionItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
}

export interface SettingsProps {
  /** The sections in page order; each matches a SettingsSection by id. */
  sections: readonly SettingsSectionItem[];
  /** The section in view. A new value scrolls to it. */
  value?: string;
  onValueChange?: (id: string) => void;
  /** SettingsSection elements. */
  children: ReactNode;
}

/** The id prefix of one settings page, so that two pages on a screen keep their own ids. */
const Prefix = createContext("");

/** The box that scrolls the element: the element itself, or the nearest box above it that scrolls. */
function scrollerOf(element: HTMLElement): HTMLElement {
  for (let box: HTMLElement | null = element; box; box = box.parentElement) {
    const { overflowY } = getComputedStyle(box);
    if ((overflowY === "auto" || overflowY === "scroll") && box.scrollHeight > box.clientHeight) return box;
  }
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.body;
}

/** The index of the section in view, measured from the layout. */
function measure(root: HTMLElement): number {
  const nav = root.querySelector(".t-settings-nav");
  const content = root.querySelector<HTMLElement>(".t-settings-content");
  if (!nav || !content) return -1;
  const scroller = scrollerOf(content);
  const box = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
  const navBox = nav.getBoundingClientRect();
  // Above the content (a narrow box), the sticky list covers the top of the scroll box.
  const stacked = navBox.right > content.getBoundingClientRect().left + 1;
  const line = Math.max(box, stacked ? navBox.bottom : box) + 16;
  const tops = [...content.querySelectorAll(".t-settings-section")].map((s) => s.getBoundingClientRect().top);
  const atEnd =
    scroller.scrollTop > 0 && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
  return activeIndex(tops, line, atEnd);
}

/** A settings page: the section list and the sections, which scroll inside the page's parent. */
export function Settings({ sections, value, onValueChange, children }: SettingsProps) {
  const isStatic = useIsStatic();
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(sections[0]?.id);
  const active = value ?? inner;
  const mark = useCallback(
    (id: string | undefined) => {
      if (!id) return;
      setInner(id);
      if (id !== active) onValueChange?.(id);
    },
    [active, onValueChange],
  );

  useEffect(() => {
    if (isStatic) return;
    const onScroll = (): void => {
      if (root.current) mark(sections[measure(root.current)]?.id);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [isStatic, mark, sections]);

  // A new value from outside scrolls to its section.
  const shown = useRef(value);
  useEffect(() => {
    if (value === undefined || value === shown.current) return;
    shown.current = value;
    document.getElementById(`${prefix}-${value}`)?.scrollIntoView({ block: "start" });
  }, [value, prefix]);

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string): void => {
    event.preventDefault();
    const section = document.getElementById(`${prefix}-${id}`);
    section?.scrollIntoView({ block: "start" });
    section?.querySelector<HTMLElement>(".t-settings-section-title")?.focus({ preventScroll: true });
    shown.current = id;
    mark(id);
  };

  return (
    <div className="t-settings" data-t={isStatic ? "settings" : undefined} ref={root}>
      <div className="t-settings-layout">
        <nav className="t-settings-nav" aria-label={t("settingsSections")}>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  className="t-settings-link"
                  href={`#${prefix}-${section.id}`}
                  aria-current={section.id === active ? "true" : undefined}
                  onClick={(event) => go(event, section.id)}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="t-settings-content">
          <Prefix value={prefix}>{children}</Prefix>
        </div>
      </div>
    </div>
  );
}

export interface SettingsSectionProps {
  /** The id from the sections of Settings. */
  id: string;
  title: string;
  description?: ReactNode;
  /** Setting rows. */
  children: ReactNode;
}

/** One section of a settings page. */
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const prefix = use(Prefix);
  const full = `${prefix}-${id}`;
  return (
    <section className="t-settings-section" id={full} aria-labelledby={`${full}-title`}>
      <h2 className="t-settings-section-title" id={`${full}-title`} tabIndex={-1}>
        {title}
      </h2>
      {description ? <p className="t-settings-section-description">{description}</p> : null}
      <div className="t-settings-section-body">{children}</div>
    </section>
  );
}

/** The state of an auto-saved setting, for the row that shows it. */
export interface SaveStatus {
  readonly state: SaveState;
  /** Sends the value that did not save again. */
  readonly retry: () => void;
}

export interface AutoSave<T> extends SaveStatus {
  /** The value to show in the control. */
  readonly value: T;
  /** Give it to the control's onValueChange or onCheckedChange. */
  readonly setValue: (next: T) => void;
}

export interface AutoSaveOptions<T> {
  /** The saved value to start from. */
  value: T;
  /** Saves one value. Return nothing or `{ ok: true }`; `{ ok: false, message }` or a throw means not saved. */
  save: (value: T) => Promise<unknown>;
  /** Milliseconds to wait after the last change: give it for text (800). Without it, each change saves at once. */
  delay?: number;
}

/** Saves a setting on each change and tells the state. A failure puts the last saved value back. */
export function useAutoSave<T>({ value: start, save, delay }: AutoSaveOptions<T>): AutoSave<T> {
  const toast = useToast();
  const [value, setShown] = useState(start);
  const [state, setState] = useState<SaveState>("idle");
  const saved = useRef(start);
  const failed = useRef(start);
  const round = useRef(0);

  const run = async (next: T): Promise<void> => {
    const mine = ++round.current;
    setState("saving");
    let outcome: { ok: boolean; message?: string };
    try {
      outcome = saveOutcome(await save(next));
    } catch (error) {
      outcome = { ok: false, message: error instanceof Error ? error.message : undefined };
    }
    if (mine !== round.current) return;
    if (outcome.ok) {
      saved.current = next;
      setState("saved");
      return;
    }
    failed.current = next;
    setShown(saved.current);
    setState("failed");
    toast("danger", outcome.message ?? t("settingFailed"));
  };
  const debouncer = useDebouncer(run, { wait: delay ?? 0, onUnmount: (d) => d.flush() });

  useEffect(() => {
    if (state !== "saved") return;
    const timer = setTimeout(() => setState("idle"), SAVED_FOR);
    return () => clearTimeout(timer);
  }, [state]);

  return {
    value,
    state,
    setValue: (next: T) => {
      setShown(next);
      if (delay) debouncer.maybeExecute(next);
      else void run(next);
    },
    retry: () => {
      setShown(failed.current);
      void run(failed.current);
    },
  };
}

export interface SettingProps {
  /** A readable label, never a config key. */
  label: string;
  /** A line under the label. */
  description?: ReactNode;
  /** An explanation in a popover beside the label. */
  help?: ReactNode;
  /** The save state from useAutoSave. */
  state?: SaveStatus;
  /**
   * The address that the HTML kit saves the value to: { name, value } as JSON, PATCH by default. The server
   * answers 204, { ok: true }, or { ok: false, message }.
   */
  saveUrl?: string;
  saveMethod?: "PATCH" | "PUT" | "POST";
  /** One control, with a name. A Switch or Check takes the row's label. */
  children: ReactElement;
}

function StateMark({ status }: { status?: SaveStatus }) {
  const state = status?.state ?? "idle";
  return (
    <span className="t-setting-state" aria-live="polite" data-state={state === "idle" ? undefined : state}>
      {state === "saving" ? (
        <>
          <span className="t-spinner" data-size="sm" aria-hidden="true" />
          <span className="t-sr-only">{t("settingSaving")}</span>
        </>
      ) : state === "saved" ? (
        <>
          <Glyph body={check} />
          <span className="t-sr-only">{t("settingSaved")}</span>
        </>
      ) : state === "failed" ? (
        <>
          <Glyph body={danger} />
          <span>{t("settingNotSaved")}</span>
          <Button
            variant="ghost"
            size="sm"
            icon={<Glyph body={retryGlyph} />}
            label={t("retry")}
            onClick={status?.retry}
          />
        </>
      ) : null}
    </span>
  );
}

const isToggle = (element: ReactElement): boolean => element.type === Switch || element.type === Check;

/** One setting: the label and description, an optional help, the control at the end and its save state. */
export function Setting({ label, description, help, state, saveUrl, saveMethod, children }: SettingProps) {
  const isStatic = useIsStatic();
  const child = Children.only(children);
  // A Switch or Check carries its own label: it gets the row's label, read by screen readers only.
  const control =
    isValidElement(child) && isToggle(child)
      ? cloneElement(child as ReactElement<{ label: ReactNode }>, {
          label: <span className="t-sr-only">{label}</span>,
        })
      : child;
  return (
    <div
      className="t-setting"
      data-t={isStatic && saveUrl ? "setting" : undefined}
      data-save-url={isStatic ? saveUrl : undefined}
      data-save-method={isStatic && saveUrl ? saveMethod : undefined}
      data-toggle={isToggle(child) ? "" : undefined}
    >
      <div className="t-setting-row">
        <Field label={label} help={description}>
          {control}
        </Field>
        {help ? (
          <span className="t-setting-help">
            <Help label={`${t("moreInformation")}: ${label}`}>{help}</Help>
          </span>
        ) : null}
        <StateMark status={state} />
      </div>
    </div>
  );
}
