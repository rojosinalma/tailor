/** The items of a menu, shared by Menu and ContextMenu. Both draw the same markup in both kits. */
import { Menu as Base } from "@base-ui/react/menu";
import { check } from "@tailor/core/glyphs.gen";
import type spec from "@tailor/packs/core/menu/spec";
import { type ReactNode, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";

export interface MenuActionItem {
  readonly type?: "item";
  /** Names the item for the page's own code: `data-id` in the markup. */
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  /** The keyboard shortcut to show, for example "Ctrl+R". The menu does not bind it. */
  readonly shortcut?: string;
  readonly tone?: (typeof spec.props.tone)[number];
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
  /** Makes the item a link. */
  readonly to?: string;
}

export interface MenuSeparatorItem {
  readonly type: "separator";
}

export interface MenuCheckboxItem {
  readonly type: "checkbox";
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean;
}

export interface MenuRadioOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface MenuRadioGroupItem {
  readonly type: "radio-group";
  /** Shown above the options. */
  readonly label?: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly options: readonly MenuRadioOption[];
}

export interface MenuGroupItem {
  readonly type: "group";
  readonly label: string;
  readonly items: readonly (MenuActionItem | MenuCheckboxItem | MenuSeparatorItem)[];
}

export type MenuItem =
  | MenuActionItem
  | MenuSeparatorItem
  | MenuCheckboxItem
  | MenuRadioGroupItem
  | MenuGroupItem;

const ITEM = "t-option t-menu-item";

function Label({ icon, label, shortcut }: { icon?: ReactNode; label: string; shortcut?: string }) {
  return (
    <>
      {icon === undefined ? null : <span className="t-menu-icon">{icon}</span>}
      <span className="t-menu-label">{label}</span>
      {shortcut ? <span className="t-menu-shortcut">{shortcut}</span> : null}
    </>
  );
}

const Tick = () => <Glyph body={check} />;

function GroupLabel({ id, label }: { id: string; label: string }) {
  return (
    <div className="t-menu-group-label" id={id}>
      {label}
    </div>
  );
}

/** The static markup that the HTML kit script takes over. */
function StaticEntry({ item }: { item: MenuItem }) {
  const labelId = useId();
  switch (item.type) {
    case "separator":
      // biome-ignore lint/a11y/useSemanticElements: the same element as Base UI's separator, so both kits match.
      return <div className="t-menu-separator" role="separator" aria-orientation="horizontal" />;
    case "group":
      return (
        // biome-ignore lint/a11y/useSemanticElements: a group inside a menu is an ARIA group, never a fieldset.
        <div className="t-menu-group" role="group" aria-labelledby={labelId}>
          <GroupLabel id={labelId} label={item.label} />
          <StaticEntries items={item.items} />
        </div>
      );
    case "radio-group":
      return (
        // biome-ignore lint/a11y/useSemanticElements: a group inside a menu is an ARIA group, never a fieldset.
        <div className="t-menu-group" role="group" aria-labelledby={item.label ? labelId : undefined}>
          {item.label ? <GroupLabel id={labelId} label={item.label} /> : null}
          {item.options.map((option) => {
            const checked = option.value === item.value;
            return (
              <button
                key={option.value}
                type="button"
                className={ITEM}
                role="menuitemradio"
                tabIndex={-1}
                data-value={option.value}
                aria-checked={checked}
                aria-disabled={option.disabled ? true : undefined}
              >
                <span className="t-menu-icon t-menu-check">
                  <Tick />
                </span>
                <span className="t-menu-label">{option.label}</span>
              </button>
            );
          })}
        </div>
      );
    case "checkbox":
      return (
        <button
          type="button"
          className={ITEM}
          role="menuitemcheckbox"
          tabIndex={-1}
          data-id={item.id}
          aria-checked={item.checked}
          aria-disabled={item.disabled ? true : undefined}
        >
          <span className="t-menu-icon t-menu-check">
            <Tick />
          </span>
          <span className="t-menu-label">{item.label}</span>
        </button>
      );
    default: {
      const content = <Label icon={item.icon} label={item.label} shortcut={item.shortcut} />;
      if (item.to !== undefined && !item.disabled)
        return (
          <AppLink
            to={item.to}
            className={ITEM}
            role="menuitem"
            tabIndex={-1}
            data-id={item.id}
            data-tone={item.tone}
          >
            {content}
          </AppLink>
        );
      return (
        <button
          type="button"
          className={ITEM}
          role="menuitem"
          tabIndex={-1}
          data-id={item.id}
          data-tone={item.tone}
          aria-disabled={item.disabled ? true : undefined}
        >
          {content}
        </button>
      );
    }
  }
}

function StaticEntries({ items }: { items: readonly MenuItem[] }) {
  return items.map((item, index) => (
    <StaticEntry
      key={
        item.type === "separator" || item.type === "radio-group" || item.type === "group" ? index : item.id
      }
      item={item}
    />
  ));
}

function Entry({ item }: { item: MenuItem }) {
  switch (item.type) {
    case "separator":
      return <Base.Separator className="t-menu-separator" />;
    case "group":
      return (
        <Base.Group className="t-menu-group">
          <Base.GroupLabel className="t-menu-group-label">{item.label}</Base.GroupLabel>
          <Entries items={item.items} />
        </Base.Group>
      );
    case "radio-group":
      return (
        <Base.RadioGroup
          className="t-menu-group"
          value={item.value}
          onValueChange={(value: string) => item.onValueChange(value)}
        >
          {item.label ? <Base.GroupLabel className="t-menu-group-label">{item.label}</Base.GroupLabel> : null}
          {item.options.map((option) => (
            <Base.RadioItem
              key={option.value}
              className={ITEM}
              value={option.value}
              disabled={option.disabled}
              label={option.label}
              data-value={option.value}
            >
              <Base.RadioItemIndicator className="t-menu-icon t-menu-check" keepMounted>
                <Tick />
              </Base.RadioItemIndicator>
              <span className="t-menu-label">{option.label}</span>
            </Base.RadioItem>
          ))}
        </Base.RadioGroup>
      );
    case "checkbox":
      return (
        <Base.CheckboxItem
          className={ITEM}
          checked={item.checked}
          onCheckedChange={(checked) => item.onCheckedChange(checked)}
          disabled={item.disabled}
          label={item.label}
          data-id={item.id}
        >
          <Base.CheckboxItemIndicator className="t-menu-icon t-menu-check" keepMounted>
            <Tick />
          </Base.CheckboxItemIndicator>
          <span className="t-menu-label">{item.label}</span>
        </Base.CheckboxItem>
      );
    default: {
      const content = <Label icon={item.icon} label={item.label} shortcut={item.shortcut} />;
      if (item.to !== undefined && !item.disabled)
        return (
          <Base.LinkItem
            className={ITEM}
            render={<AppLink to={item.to} />}
            closeOnClick
            label={item.label}
            data-id={item.id}
            data-tone={item.tone}
          >
            {content}
          </Base.LinkItem>
        );
      return (
        <Base.Item
          className={ITEM}
          disabled={item.disabled}
          label={item.label}
          onClick={item.onSelect}
          data-id={item.id}
          data-tone={item.tone}
        >
          {content}
        </Base.Item>
      );
    }
  }
}

function Entries({ items }: { items: readonly MenuItem[] }) {
  return items.map((item, index) => (
    <Entry
      key={
        item.type === "separator" || item.type === "radio-group" || item.type === "group" ? index : item.id
      }
      item={item}
    />
  ));
}

/** The items of a menu, as Base UI parts or, in static mode, as the markup of the HTML kit. */
export function MenuEntries({ items }: { items: readonly MenuItem[] }) {
  return useIsStatic() ? <StaticEntries items={items} /> : <Entries items={items} />;
}
