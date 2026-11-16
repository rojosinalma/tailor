import { t } from "@tailor/core/text";
import { type ReactElement, useId, useRef, useState } from "react";
import { Dialog } from "../../core/dialog/dialog";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Search } from "../../core/search/search";
import { type HotkeyInfo, Keys, useHotkey, useHotkeysList } from "../hotkeys/hotkeys";

export interface HotkeysHelpProps {
  /** The element that opens the help, usually a Button. Shift+? opens it too. */
  trigger?: ReactElement;
}

interface Group {
  readonly label: string;
  readonly items: HotkeyInfo[];
}

/** The shortcuts by group, in the order the groups first appear; only those that match the text. */
function groupsOf(list: readonly HotkeyInfo[], text: string): Group[] {
  const query = text.trim().toLowerCase();
  const groups = new Map<string, HotkeyInfo[]>();
  for (const hotkey of list) {
    const group = hotkey.group ?? t("hkGeneral");
    if (query && !`${hotkey.label} ${group}`.toLowerCase().includes(query)) continue;
    groups.set(group, [...(groups.get(group) ?? []), hotkey]);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

/** A dialog that lists every registered shortcut, grouped, with a filter. */
export function HotkeysHelp({ trigger }: HotkeysHelpProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const filter = useRef<HTMLInputElement>(null);
  const list = useHotkeysList();
  useHotkey({ id: "hotkeys-help", keys: "Shift+?", label: t("hkHelpOpen"), run: () => setOpen(true) });

  const groups = groupsOf(list, text);
  return (
    <Dialog
      trigger={trigger}
      title={t("hkHelpTitle")}
      size="lg"
      initialFocus={filter}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setText("");
      }}
    >
      {/* The first Escape only clears the filter (the field does that); the dialog stays open. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: it only stops an Escape that the field handled. */}
      <div
        className="t-hotkeys-help"
        onKeyDown={(event) => {
          if (event.key === "Escape" && text) event.stopPropagation();
        }}
      >
        <Search
          label={t("hkHelpFilter")}
          placeholder={t("hkHelpFilter")}
          value={text}
          onValueChange={setText}
          shortcut={false}
          inputRef={filter}
        />
        {groups.length > 0 ? (
          <div className="t-hotkeys-help-groups">
            {groups.map((group, g) => (
              <section key={group.label} className="t-hotkeys-help-group" aria-labelledby={`${id}-${g}`}>
                <h3 className="t-hotkeys-help-title" id={`${id}-${g}`}>
                  {group.label}
                </h3>
                <dl>
                  {group.items.map((hotkey) => (
                    <div key={hotkey.id} className="t-hotkeys-help-row">
                      <dt>{hotkey.label}</dt>
                      <dd>
                        <Keys keys={hotkey.keys} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState size="sm" title={text.trim() ? t("hkHelpNone") : t("hkHelpEmpty")} />
        )}
      </div>
    </Dialog>
  );
}
