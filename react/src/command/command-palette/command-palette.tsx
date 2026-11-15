import { Dialog as Base } from "@base-ui/react/dialog";
import { close, search } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  filterGroups,
  fuzzyMatch,
  highlight,
  moveHighlight,
} from "@tailor/packs/command/command-palette/logic";
import { useRouter } from "@tanstack/react-router";
import { type KeyboardEvent, type ReactElement, useEffect, useId, useRef, useState } from "react";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Icon, type IconName } from "../../core/icon/icon";
import { Kbd } from "../../core/kbd/kbd";
import { Spinner } from "../../core/spinner/spinner";
import { Glyph } from "../../glyph";
import { Keys, useHotkey, useHotkeysList } from "../hotkeys/hotkeys";

export interface CommandItem {
  /** Unique within its group. */
  id: string;
  label: string;
  icon?: IconName;
  /** More words that find the item: "preferences" for "Settings". */
  keywords?: readonly string[];
  /** The shortcut to show at the end, such as "G then S". */
  keys?: string;
  /** The address to go to. */
  to?: string;
  /** The action to run. The palette closes first. */
  onSelect?: () => void;
  disabled?: boolean;
}

export interface CommandGroup {
  id: string;
  label: string;
  items: readonly CommandItem[];
}

export interface CommandPaletteProps {
  groups: readonly CommandGroup[];
  placeholder?: string;
  /** Searching is the caller's: it gets the text and gives the groups for it. Without it the palette filters. */
  onSearch?: (text: string) => void;
  /** The caller's search is running. */
  loading?: boolean;
  /** The text when nothing matches. */
  empty?: string;
  /** Shown first while the search text is empty. */
  recent?: readonly CommandItem[];
  /** Lists the registered shortcuts as a group; each runs its shortcut's action. */
  includeHotkeys?: boolean;
  /** The element that opens the palette, usually a Button. Mod+K opens it too. */
  trigger?: ReactElement;
  /** Registers Mod+K. Turn it off for a second palette on the same page. */
  shortcut?: boolean;
}

interface Row {
  readonly domId: string;
  readonly item: CommandItem;
}

/** A searchable list of commands and places, opened with Mod+K. */
export function CommandPalette({
  groups,
  placeholder = t("cmdPlaceholder"),
  onSearch,
  loading = false,
  empty = t("cmdNoResults"),
  recent,
  includeHotkeys = false,
  trigger,
  shortcut = true,
}: CommandPaletteProps) {
  const id = useId();
  const router = useRouter({ warn: false }) as ReturnType<typeof useRouter> | undefined;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const hotkeys = useHotkeysList();
  useHotkey({
    id: "command-palette",
    keys: "Mod+K",
    label: t("cmdOpen"),
    run: () => setOpen(true),
    when: shortcut,
  });

  const query = text.trim();
  const hotkeyGroup: CommandGroup = {
    id: "hotkeys",
    label: t("cmdShortcuts"),
    items: hotkeys
      .filter((h) => h.id !== "command-palette")
      .map((h) => ({ id: h.id, label: h.label, keys: h.keys, onSelect: h.run })),
  };
  const shown = [
    ...(recent?.length && !query ? [{ id: "recent", label: t("cmdRecent"), items: recent }] : []),
    ...(onSearch ? groups : filterGroups(groups, query)),
    ...(includeHotkeys ? filterGroups([hotkeyGroup], query) : []),
  ].filter((group) => group.items.length > 0);
  const rows: Row[] = shown.flatMap((group) =>
    group.items.map((item) => ({ domId: `${id}-${group.id}-${item.id}`, item })),
  );
  const enabled = rows.map((row) => !row.item.disabled);
  const found = rows.findIndex((row) => row.domId === activeId);
  const current = found >= 0 && enabled[found] ? found : enabled.indexOf(true);
  const active = rows[current];

  useEffect(() => {
    if (active) document.getElementById(active.domId)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const change = (next: string): void => {
    setText(next);
    setActiveId(null);
    onSearch?.(next);
  };

  const select = (item: CommandItem): void => {
    if (item.disabled) return;
    const { to, onSelect } = item;
    pending.current = to
      ? () => (router && to.startsWith("/") ? void router.navigate({ to }) : location.assign(to))
      : (onSelect ?? null);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End") {
      event.preventDefault();
      const next = rows[moveHighlight(enabled, current, key)];
      if (next) setActiveId(next.domId);
    } else if (key === "Enter") {
      event.preventDefault();
      if (active) select(active.item);
    } else if (key === "Escape" && text) {
      // The first Escape clears the text; the next one closes.
      event.preventDefault();
      event.stopPropagation();
      change("");
    }
  };

  return (
    <Base.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen) return;
        change("");
        const run = pending.current;
        pending.current = null;
        run?.();
      }}
    >
      {trigger ? <Base.Trigger render={trigger} /> : null}
      <Base.Portal>
        <Base.Backdrop className="t-dialog-backdrop" />
        <Base.Popup className="t-dialog t-command" aria-label={t("cmdTitle")} initialFocus={input}>
          <div className="t-command-search">
            <div className="t-control t-input-group" data-size="lg">
              <span className="t-input-addon">
                <Glyph body={search} />
              </span>
              <input
                ref={input}
                className="t-input-native"
                type="text"
                role="combobox"
                aria-label={t("cmdTitle")}
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant={active?.domId}
                autoComplete="off"
                spellCheck={false}
                placeholder={placeholder}
                value={text}
                onChange={(event) => change(event.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <Base.Close className="t-dialog-close" aria-label={t("close")}>
              <Glyph body={close} />
            </Base.Close>
          </div>
          <div className="t-command-list">
            <div role="listbox" id={`${id}-list`} aria-label={t("cmdResults")}>
              {shown.map((group) => (
                // biome-ignore lint/a11y/useSemanticElements: a group of options in a listbox, not of form fields.
                <div
                  key={group.id}
                  role="group"
                  className="t-command-group"
                  aria-labelledby={`${id}-${group.id}`}
                >
                  <div className="t-command-group-label" id={`${id}-${group.id}`}>
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const domId = `${id}-${group.id}-${item.id}`;
                    const isActive = domId === active?.domId;
                    const parts = highlight(item.label, fuzzyMatch(query, item.label)?.positions ?? []);
                    return (
                      // The focus stays in the search field, which drives the list with aria-activedescendant.
                      // biome-ignore lint/a11y/useKeyWithClickEvents: the keys are handled on the search field.
                      <div
                        key={item.id}
                        id={domId}
                        role="option"
                        tabIndex={-1}
                        className="t-option"
                        aria-selected={isActive}
                        aria-disabled={item.disabled ? true : undefined}
                        data-highlighted={isActive ? "" : undefined}
                        onPointerMove={() => {
                          if (!item.disabled && !isActive) setActiveId(domId);
                        }}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => select(item)}
                      >
                        {item.icon ? (
                          <span className="t-command-icon">
                            <Icon name={item.icon} />
                          </span>
                        ) : null}
                        <span className="t-option-label">
                          {parts.map((part, i) =>
                            part.match ? (
                              // biome-ignore lint/suspicious/noArrayIndexKey: the parts follow the label.
                              <mark key={i} className="t-command-match">
                                {part.text}
                              </mark>
                            ) : (
                              part.text
                            ),
                          )}
                        </span>
                        {item.keys ? <Keys keys={item.keys} /> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {loading ? (
              <div className="t-command-status">
                <Spinner size="sm" />
                <span aria-hidden="true">{t("loading")}</span>
              </div>
            ) : rows.length === 0 ? (
              <EmptyState size="sm" title={empty} />
            ) : null}
          </div>
          <footer className="t-command-footer" aria-hidden="true">
            <span>
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t("cmdMove")}
            </span>
            <span>
              <Kbd>↵</Kbd> {t("cmdSelect")}
            </span>
            <span>
              <Kbd>esc</Kbd> {t("cmdClose")}
            </span>
          </footer>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}
