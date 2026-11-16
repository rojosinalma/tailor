import { t } from "@tailor/core/text";
import {
  canonicalKeys,
  firesInFields,
  formatSteps,
  libraryChord,
  parseKeys,
} from "@tailor/packs/command/hotkeys/logic";
import {
  detectPlatform,
  type RegisterableHotkey,
  useHotkey as useLibraryHotkey,
} from "@tanstack/react-hotkeys";
import {
  createContext,
  Fragment,
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Kbd } from "../../core/kbd/kbd";
import { isDevelopment } from "../../kit";

/** One registered shortcut, as the help view and the palette list it. */
export interface HotkeyInfo {
  readonly id: string;
  /** The readable keys: "Mod+K", "Shift+?", "G then S". */
  readonly keys: string;
  readonly label: string;
  readonly group?: string;
  /** Runs the shortcut's action. */
  readonly run: () => void;
}

interface Entry extends HotkeyInfo {
  readonly token: symbol;
  readonly canonical: string;
  readonly scope: object | null;
  readonly when: boolean;
}

/** The shortcuts of the app. The latest registration of the same keys in the same scope wins. */
class Registry {
  #entries: Entry[] = [];
  #listeners = new Set<() => void>();
  #list: readonly HotkeyInfo[] = [];

  add(entry: Entry): () => void {
    const twin = entry.when ? this.#winner(entry) : undefined;
    if (twin && isDevelopment())
      console.warn(
        `tailor: "${entry.keys}" is registered by "${twin.id}" and "${entry.id}"; "${entry.id}" wins.`,
      );
    this.#entries = [...this.#entries, entry];
    this.#changed();
    return () => {
      this.#entries = this.#entries.filter((e) => e.token !== entry.token);
      this.#changed();
    };
  }

  /** Whether the entry is the one that fires for its keys. */
  wins(token: symbol): boolean {
    const entry = this.#entries.find((e) => e.token === token);
    return entry?.when === true && this.#winner(entry) === entry;
  }

  list = (): readonly HotkeyInfo[] => this.#list;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  /** The latest live registration of the entry's keys in its scope. */
  #winner(entry: Entry): Entry | undefined {
    return this.#entries.findLast(
      (e) => e.when && e.canonical === entry.canonical && e.scope === entry.scope,
    );
  }

  #changed(): void {
    this.#list = this.#entries
      .filter((e) => this.#winner(e) === e)
      .map(({ id, keys, label, group, run }) => ({ id, keys, label, group, run }));
    for (const listener of this.#listeners) listener();
  }
}

const RegistryContext = createContext<Registry | null>(null);
/** The marker element of the dialog scope that a registration comes from. */
const ScopeContext = createContext<RefObject<HTMLSpanElement | null> | null>(null);

/** Holds the registry of the app's shortcuts. Put it once at the app root. */
export function HotkeysProvider({ children }: { children: ReactNode }) {
  const [registry] = useState(() => new Registry());
  return <RegistryContext value={registry}>{children}</RegistryContext>;
}

const useRegistry = (): Registry => {
  const registry = use(RegistryContext);
  if (!registry) throw new Error("tailor: shortcuts need a HotkeysProvider at the app root");
  return registry;
};

/**
 * Marks the shortcuts registered below it as belonging to the dialog that holds it: they fire while
 * that dialog is open, when shortcuts from the page do not.
 */
export function HotkeyScope({ children }: { children: ReactNode }) {
  const marker = useRef<HTMLSpanElement>(null);
  return (
    <ScopeContext value={marker}>
      <span ref={marker} hidden />
      {children}
    </ScopeContext>
  );
}

const DIALOG = '[role="dialog"], [role="alertdialog"], dialog[open]';

/** The open dialog that holds the focus, or null. */
const focusedDialog = (): Element | null =>
  document.activeElement?.closest(DIALOG) ?? document.querySelector("dialog:modal");

export interface UseHotkeyOptions {
  /** Unique within the app; the help view and the palette use it. */
  id: string;
  /** "Mod+K" (Cmd on Apple devices, Ctrl elsewhere), "Shift+?", "G then S", "/", "Escape". */
  keys: string;
  /** What the shortcut does, for the help view: "Open settings". */
  label: string;
  /** The group in the help view. */
  group?: string;
  run: () => void;
  /** The shortcut fires only while this is true. */
  when?: boolean;
  /** Also fire while the focus is in a text field. Shortcuts with Mod, Ctrl or Meta always do. */
  allowInFields?: boolean;
}

/** Registers a shortcut for as long as the component is mounted. */
export function useHotkey({
  id,
  keys,
  label,
  group,
  run,
  when = true,
  allowInFields = false,
}: UseHotkeyOptions) {
  const registry = useRegistry();
  const scope = use(ScopeContext);
  const [token] = useState(() => Symbol(id));
  const action = useRef(run);
  action.current = run;
  const steps = useMemo(() => parseKeys(keys), [keys]);
  const hotkey = useMemo(() => {
    const names = steps.map(libraryChord);
    return (names.length === 1 ? names[0] : names) as RegisterableHotkey;
  }, [steps]);

  useEffect(
    () =>
      registry.add({
        token,
        id,
        keys,
        label,
        group,
        when,
        canonical: canonicalKeys(keys),
        scope,
        run: () => action.current(),
      }),
    [registry, token, id, keys, label, group, when, scope],
  );
  const wins = useSyncExternalStore(registry.subscribe, () => registry.wins(token));

  useLibraryHotkey(
    hotkey,
    (event: KeyboardEvent) => {
      // While a dialog is open, only the shortcuts from inside it fire.
      if (focusedDialog() !== (scope?.current?.closest(DIALOG) ?? null)) return;
      event.preventDefault();
      action.current();
    },
    {
      enabled: wins,
      ignoreInputs: !(allowInFields || firesInFields(steps)),
      preventDefault: false,
      stopPropagation: false,
      conflictBehavior: "allow",
    },
  );
}

/** Every registered shortcut that can fire now, in the order of registration. */
export function useHotkeysList(): readonly HotkeyInfo[] {
  const registry = useRegistry();
  return useSyncExternalStore(registry.subscribe, registry.list);
}

const isApple = (): boolean => detectPlatform() === "mac";

/** The parts to show: ["⌘", "K"] on Apple devices, ["Ctrl", "K"] elsewhere; a sequence has "then" between steps. */
export function formatKeys(keys: string): string[] {
  return formatSteps(keys, isApple()).flatMap((parts, i) => (i === 0 ? parts : [t("hkThen"), ...parts]));
}

/** The keys of a shortcut, drawn as keyboard keys. */
export function Keys({ keys }: { keys: string }) {
  const steps = formatSteps(keys, isApple());
  return (
    <span className="t-hotkeys-keys">
      {steps.map((parts, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the steps never reorder.
        <Fragment key={i}>
          {i > 0 ? t("hkThen") : null}
          <Kbd keys={parts} />
        </Fragment>
      ))}
    </span>
  );
}
