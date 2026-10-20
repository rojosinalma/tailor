// tailor-react Primer adapter — renders the same Ui.* API through
// @primer/react 38 instead of the tailor CSS vocabulary.
//
// Usage (per project, chosen at scaffold time):
//   import { Ui } from "tailor-react/primer";
//   <ThemeProvider> + <BaseStyles> wrap the app (see Primer React's getting-started
//   guide for the theme wiring).
//
// Components Primer has no sensible mapping for fall back to the CSS-path
// component (same markup contract); see README.md in this folder for the list.
import {
  ActionList, ActionMenu, Avatar as PrimerAvatar, AvatarStack as PrimerAvatarStack,
  Banner, Breadcrumbs, Button as PrimerButton, ButtonGroup as PrimerButtonGroup,
  Checkbox, CheckboxGroup, ConfirmationDialog, CounterLabel, Dialog as PrimerDialog,
  FormControl, Header as PrimerHeader, Label as PrimerLabel, NavList, PageLayout,
  ProgressBar, Radio, RelativeTime as PrimerRelativeTime, SegmentedControl, Select as PrimerSelect,
  Spinner as PrimerSpinner, StateLabel as PrimerStateLabel, Textarea as PrimerTextarea,
  TextInput, Timeline as PrimerTimeline, ToggleSwitch, Token, Tooltip as PrimerTooltip,
  Truncate as PrimerTruncate,
} from "@primer/react";
import { Blankslate, UnderlinePanels } from "@primer/react/experimental";
import { createContext, useCallback, useContext, useState, type ReactElement, type ReactNode } from "react";
import { Ui as Css } from "../../src/index.ts";
import { ICON_SPRITE, IconSpriteContext, iconSlot } from "../../src/actions.tsx";
import type { Tone } from "../../src/util.ts";

/* ── prop translation helpers ────────────────────────────────────────────── */

type LabelVariant = React.ComponentProps<typeof PrimerLabel>["variant"];

const TONE_TO_LABEL: Partial<Record<Tone, LabelVariant>> = {
  neutral: "default", accent: "accent", success: "success", warning: "attention",
  danger: "danger", info: "accent", text: "secondary",
  red: "danger", orange: "severe", yellow: "attention", green: "success",
  cyan: "accent", purple: "done", pink: "sponsors",
};

const SIZE_TO_PRIMER = { xs: "small", sm: "small", md: "medium", lg: "large" } as const;

/* ── actions ─────────────────────────────────────────────────────────────── */

function Button({
  variant, tone, size, iconOnly, busy, pressed, tip, tipAt, children, type, disabled, onClick,
  className, "aria-label": ariaLabel,
}: React.ComponentProps<typeof Css.Button>) {
  const primerVariant =
    variant === "primary" ? "primary"
    : variant === "danger" || tone === "danger" ? "danger"
    : variant === "ghost" || variant === "link" ? "invisible"
    : "default";
  const btn = (
    <PrimerButton
      variant={primerVariant}
      size={size ? SIZE_TO_PRIMER[size] : undefined}
      loading={busy || undefined}
      aria-pressed={pressed}
      aria-label={iconOnly ? ariaLabel ?? tip : ariaLabel}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </PrimerButton>
  );
  return tip ? <PrimerTooltip text={tip} direction={tipAt === "bottom" ? "s" : tipAt === "left" ? "w" : tipAt === "right" ? "e" : "n"}>{btn}</PrimerTooltip> : btn;
}

function ButtonGroup({ options, filter, value, defaultValue, onChange, size, children }: React.ComponentProps<typeof Css.ButtonGroup>) {
  const [internal, setInternal] = useState(defaultValue ?? options?.[0]?.value);
  const selected = value !== undefined ? value : internal;
  return (
    <PrimerButtonGroup>
      {options
        ? options.map((o) => (
            <PrimerButton
              key={o.value}
              size={size ? SIZE_TO_PRIMER[size] : "small"}
              aria-pressed={filter ? selected === o.value : undefined}
              onClick={() => { setInternal(o.value); onChange?.(o.value); }}
            >
              {o.label}
            </PrimerButton>
          ))
        : children}
    </PrimerButtonGroup>
  );
}

function Segmented({ label, options, value, defaultValue, onChange }: React.ComponentProps<typeof Css.Segmented>) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value);
  const selected = value !== undefined ? value : internal;
  return (
    <SegmentedControl aria-label={label ?? "View"} onChange={(i) => { const o = options[i]; if (o) { setInternal(o.value); onChange?.(o.value); } }}>
      {options.map((o) => (
        <SegmentedControl.Button key={o.value} selected={o.value === selected}>
          {typeof o.label === "string" ? o.label : o.value}
        </SegmentedControl.Button>
      ))}
    </SegmentedControl>
  );
}

function Menu({ trigger, children }: React.ComponentProps<typeof Css.Menu>) {
  return (
    <ActionMenu>
      <ActionMenu.Button>{trigger}</ActionMenu.Button>
      <ActionMenu.Overlay>
        <ActionList>{children}</ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

function MenuItem({ checked, tone, onSelect, children }: React.ComponentProps<typeof Css.Menu.Item>) {
  return (
    <ActionList.Item
      selected={checked}
      variant={tone === "danger" ? "danger" : "default"}
      onSelect={() => onSelect?.()}
    >
      {children}
    </ActionList.Item>
  );
}

Menu.Item = MenuItem;
Menu.Header = function MenuHeader({ children }: { children?: ReactNode }) {
  return <ActionList.GroupHeading as="h3">{children}</ActionList.GroupHeading>;
};
Menu.Divider = function MenuDivider() { return <ActionList.Divider />; };
Menu.Desc = function MenuDesc({ children }: { children?: ReactNode }) {
  return <ActionList.Description variant="block">{children}</ActionList.Description>;
};
Menu.Kbd = Css.Menu.Kbd;

function Tabs({ tabs, panels, value, defaultValue, onChange, ...rest }: React.ComponentProps<typeof Css.Tabs>) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value);
  const active = value !== undefined ? value : internal;
  return (
    <UnderlinePanels aria-label={rest["aria-label"] ?? "Tabs"}>
      {tabs.map((t) => (
        <UnderlinePanels.Tab
          key={t.value}
          aria-selected={t.value === active}
          onSelect={() => { setInternal(t.value); onChange?.(t.value); }}
        >
          {t.label}
        </UnderlinePanels.Tab>
      ))}
      {tabs.map((t) => (
        <UnderlinePanels.Panel key={t.value}>{panels[t.value]}</UnderlinePanels.Panel>
      ))}
    </UnderlinePanels>
  );
}

function Breadcrumb({ children }: React.ComponentProps<typeof Css.Breadcrumb>) {
  return <Breadcrumbs>{children}</Breadcrumbs>;
}

Breadcrumb.Item = function BreadcrumbItem({ href, current, children }: React.ComponentProps<typeof Css.Breadcrumb.Item>) {
  return <Breadcrumbs.Item href={href} selected={current}>{children}</Breadcrumbs.Item>;
};

function List({ label, multi, children }: React.ComponentProps<typeof Css.List>) {
  return (
    <ActionList aria-label={label} selectionVariant={multi ? "multiple" : "single"} showDividers>
      {children}
    </ActionList>
  );
}

List.Item = function ListItem({ selected, disabled, lead, name, desc, trail, onClick }: React.ComponentProps<typeof Css.List.Item>) {
  return (
    <ActionList.Item selected={selected} disabled={disabled} onSelect={() => onClick?.(undefined as never)}>
      {lead !== undefined && <ActionList.LeadingVisual>{iconSlot(lead)}</ActionList.LeadingVisual>}
      {name}
      {desc !== undefined && <ActionList.Description variant="block">{desc}</ActionList.Description>}
      {trail !== undefined && <ActionList.TrailingVisual>{trail}</ActionList.TrailingVisual>}
    </ActionList.Item>
  );
};
List.Group = function ListGroup({ children }: { children?: ReactNode }) {
  return <ActionList.GroupHeading as="h3">{children}</ActionList.GroupHeading>;
};
List.Divider = function ListDivider() { return <ActionList.Divider />; };

/* ── forms ───────────────────────────────────────────────────────────────── */

function Field({ label, hint, error, success, children }: React.ComponentProps<typeof Css.Field>) {
  return (
    <FormControl>
      <FormControl.Label>{label}</FormControl.Label>
      {children as ReactElement}
      {hint !== undefined && <FormControl.Caption>{hint}</FormControl.Caption>}
      {error !== undefined && <FormControl.Validation variant="error">{error}</FormControl.Validation>}
      {success !== undefined && <FormControl.Validation variant="success">{success}</FormControl.Validation>}
    </FormControl>
  );
}

function Input({ size, className, ...rest }: React.ComponentProps<typeof Css.Input>) {
  return <TextInput size={size ? SIZE_TO_PRIMER[size] : undefined} className={className} {...(rest as object)} />;
}

function Select({ size, children, ...rest }: React.ComponentProps<typeof Css.Select>) {
  return <PrimerSelect size={size ? SIZE_TO_PRIMER[size] : undefined} {...(rest as object)}>{children}</PrimerSelect>;
}

function Textarea(props: React.ComponentProps<typeof Css.Textarea>) {
  return <PrimerTextarea {...(props as object)} />;
}

function Check({ type = "checkbox", switch: isSwitch, label, desc, checked, defaultChecked, disabled, onChange }: React.ComponentProps<typeof Css.Check>) {
  if (isSwitch) {
    return (
      <FormControl disabled={disabled}>
        <FormControl.Label>{label}</FormControl.Label>
        {desc !== undefined && <FormControl.Caption>{desc}</FormControl.Caption>}
        <ToggleSwitch checked={checked} defaultChecked={defaultChecked} disabled={disabled} aria-labelledby="" />
      </FormControl>
    );
  }
  const control = type === "radio"
    ? <Radio value={String(label)} checked={checked} disabled={disabled} onChange={onChange} />
    : <Checkbox checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />;
  return (
    <FormControl disabled={disabled}>
      {control}
      <FormControl.Label>{label}</FormControl.Label>
      {desc !== undefined && <FormControl.Caption>{desc}</FormControl.Caption>}
    </FormControl>
  );
}

function CheckGroup({ legend, children }: React.ComponentProps<typeof Css.CheckGroup>) {
  return (
    <CheckboxGroup>
      <CheckboxGroup.Label>{legend}</CheckboxGroup.Label>
      {children}
    </CheckboxGroup>
  );
}
Check.Group = CheckGroup;

/* ── data display ────────────────────────────────────────────────────────── */

function Badge({ tone, children }: React.ComponentProps<typeof Css.Badge>) {
  return <PrimerLabel variant={tone ? TONE_TO_LABEL[tone] : "default"}>{children}</PrimerLabel>;
}

function Counter({ tone, children }: React.ComponentProps<typeof Css.Counter>) {
  return <CounterLabel scheme={tone && tone !== "neutral" ? "primary" : "secondary"}>{children}</CounterLabel>;
}

function Chip({ onRemove, children }: React.ComponentProps<typeof Css.Chip>) {
  return <Token text={textOf(children)} onRemove={onRemove} />;
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

const STATE_TO_PRIMER = {
  open: "issueOpened", closed: "issueClosed", done: "pullMerged",
  draft: "draft", warning: "issueClosedNotPlanned", info: "pullOpened",
} as const;

function StateLabel({ state, children }: React.ComponentProps<typeof Css.StateLabel>) {
  return <PrimerStateLabel status={STATE_TO_PRIMER[state]}>{children}</PrimerStateLabel>;
}

function Avatar(props: React.ComponentProps<typeof Css.Avatar>) {
  const px = { xs: 16, sm: 20, md: 24, lg: 32, xl: 48 } as const;
  if (props.src !== undefined) {
    return <PrimerAvatar src={props.src} alt={props.alt ?? ""} size={props.size ? px[props.size] : undefined} square={props.shape === "square"} />;
  }
  return <Css.Avatar {...props} />; // Primer avatars are image-only; text initials fall back
}
Avatar.Stack = function AvatarStackA({ children }: { children?: ReactNode }) {
  return <PrimerAvatarStack>{children as ReactElement[]}</PrimerAvatarStack>;
};
Avatar.Row = Css.Avatar.Row;

function Timeline({ children }: React.ComponentProps<typeof Css.Timeline>) {
  return <PrimerTimeline>{children}</PrimerTimeline>;
}
Timeline.Item = function TimelineItem({ badge, condensed, children }: React.ComponentProps<typeof Css.Timeline.Item>) {
  return (
    <PrimerTimeline.Item condensed={condensed}>
      <PrimerTimeline.Badge>{badge}</PrimerTimeline.Badge>
      <PrimerTimeline.Body>{children}</PrimerTimeline.Body>
    </PrimerTimeline.Item>
  );
};
Timeline.Break = function TimelineBreak() { return <PrimerTimeline.Break />; };
Timeline.Card = Css.Timeline.Card;

function RelativeTime({ datetime, children }: React.ComponentProps<typeof Css.RelativeTime>) {
  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  return <PrimerRelativeTime date={date}>{children}</PrimerRelativeTime>;
}

function EmptyState({ icon, title, actions, children }: React.ComponentProps<typeof Css.EmptyState>) {
  return (
    <Blankslate>
      {icon !== undefined && <Blankslate.Visual>{iconSlot(icon)}</Blankslate.Visual>}
      <Blankslate.Heading>{title as string}</Blankslate.Heading>
      <Blankslate.Description>{children as string}</Blankslate.Description>
      {actions !== undefined && <Blankslate.PrimaryAction href="#">{textOf(actions) || "Action"}</Blankslate.PrimaryAction>}
    </Blankslate>
  );
}

/* ── feedback ────────────────────────────────────────────────────────────── */

function Tooltip({ tip, at, children }: React.ComponentProps<typeof Css.Tooltip>) {
  return (
    <PrimerTooltip text={tip} direction={at === "bottom" ? "s" : at === "left" ? "w" : at === "right" ? "e" : "n"}>
      {children}
    </PrimerTooltip>
  );
}

function Truncate({ expand, tip, children }: React.ComponentProps<typeof Css.Truncate>) {
  return <PrimerTruncate title={tip ?? textOf(children)} expandable={expand} inline>{children}</PrimerTruncate>;
}

const TONE_TO_BANNER = {
  neutral: "info", info: "info", success: "success", warning: "warning", danger: "critical",
} as const;
// Banner requires a title; Ui.Alert / toasts carry none, so the variant name is the (visually hidden) title.
const BANNER_TITLE = { info: "Information", success: "Success", warning: "Warning", critical: "Error", upsell: "Upsell" } as const;

function Alert({ tone, actions, onDismiss, children }: React.ComponentProps<typeof Css.Alert>) {
  const variant = tone ? TONE_TO_BANNER[tone] ?? "info" : "info";
  return (
    <Banner
      variant={variant}
      title={BANNER_TITLE[variant]}
      hideTitle
      onDismiss={onDismiss}
      description={children}
    >
      {actions}
    </Banner>
  );
}

function Dialog({ open, onClose, title, footer, children }: React.ComponentProps<typeof Css.Dialog>) {
  if (!open) return null;
  return (
    <PrimerDialog
      title={title}
      onClose={() => onClose?.("")}
      footerButtons={undefined}
      renderFooter={footer !== undefined ? () => <PrimerDialog.Footer>{footer}</PrimerDialog.Footer> : undefined}
    >
      {children}
    </PrimerDialog>
  );
}

function Confirm({ open, title = "Are you sure?", label = "Confirm", danger = true, onResult, children }: React.ComponentProps<typeof Css.Confirm>) {
  if (!open) return null;
  return (
    <ConfirmationDialog
      title={title as string}
      confirmButtonContent={label}
      confirmButtonType={danger ? "danger" : "primary"}
      onClose={(gesture) => onResult?.(gesture === "confirm")}
    >
      {children}
    </ConfirmationDialog>
  );
}

function Progress({ value, stacked, tone, size, children }: React.ComponentProps<typeof Css.Progress>) {
  const barSize = size === "sm" ? "small" : size === "lg" ? "large" : "default";
  if (stacked) return <ProgressBar barSize={barSize}>{children}</ProgressBar>;
  return <ProgressBar progress={value} barSize={barSize} bg={tone ? `${toneColor(tone)}.emphasis` : undefined} aria-label="Progress" />;
}

function toneColor(tone: Tone): string {
  return TONE_TO_BANNER[tone as keyof typeof TONE_TO_BANNER] === "critical" ? "danger"
    : tone === "success" ? "success" : tone === "warning" ? "attention" : "accent";
}

Progress.Bar = function ProgressBarItem({ value, tone }: React.ComponentProps<typeof Css.Progress.Bar>) {
  return <ProgressBar.Item progress={value} style={tone ? { backgroundColor: `var(--bgColor-${toneColor(tone)}-emphasis)` } : undefined} />;
};

function Spinner({ size, label }: React.ComponentProps<typeof Css.Spinner>) {
  return <PrimerSpinner size={size ? SIZE_TO_PRIMER[size] : undefined} srText={label ?? null} />;
}

/* ── toasts (Primer has none: a fixed Banner stack) ──────────────────────── */

type ToastEntry = { id: number; tone: "success" | "warning" | "danger" | "info"; message: ReactNode };
type ToastApi = { toast: (tone: ToastEntry["tone"] | "error", message: ReactNode, opts?: { timeout?: number }) => void };
const ToastContext = createContext<ToastApi | null>(null);

export function useToasts(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts() needs a <UiProvider> ancestor (tailor-react/primer)");
  return ctx;
}

let seq = 0;

function UiProvider({ children, sprite }: { children: ReactNode; sprite?: string }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toast = useCallback<ToastApi["toast"]>((tone, message, { timeout = 2500 } = {}) => {
    const id = ++seq;
    setToasts((ts) => [...ts, { id, tone: tone === "error" ? "danger" : tone, message }]);
    if (timeout > 0) setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), timeout);
  }, []);
  return (
    <IconSpriteContext value={sprite ?? ICON_SPRITE}>
    <ToastContext value={{ toast }}>
      {children}
      <div style={{ position: "fixed", bottom: 16, right: 16, display: "grid", gap: 8, zIndex: 100, maxWidth: 420 }}>
        {toasts.map((t) => (
          <Banner key={t.id} variant={TONE_TO_BANNER[t.tone]} title={BANNER_TITLE[TONE_TO_BANNER[t.tone]]} hideTitle description={t.message} onDismiss={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext>
    </IconSpriteContext>
  );
}

/* ── shell ───────────────────────────────────────────────────────────────── */

function AppShell({ nav, side, foot, children }: React.ComponentProps<typeof Css.AppShell>) {
  return (
    <PageLayout containerWidth="full" padding="none">
      {nav !== undefined && <PageLayout.Header>{nav}</PageLayout.Header>}
      {side !== undefined && <PageLayout.Pane position="start">{side}</PageLayout.Pane>}
      <PageLayout.Content>{children}</PageLayout.Content>
      {foot !== undefined && <PageLayout.Footer>{foot}</PageLayout.Footer>}
    </PageLayout>
  );
}

function Navbar({ children }: React.ComponentProps<typeof Css.Navbar>) {
  return <PrimerHeader>{children}</PrimerHeader>;
}
Navbar.Brand = function NavbarBrand({ href, children }: React.ComponentProps<typeof Css.Navbar.Brand>) {
  return <PrimerHeader.Item full={false}><PrimerHeader.Link href={href}>{children}</PrimerHeader.Link></PrimerHeader.Item>;
};
Navbar.Nav = function NavbarNav({ children }: { children?: ReactNode }) {
  return <>{children}</>;
};
Navbar.Link = function NavbarLink({ href, current, children }: React.ComponentProps<typeof Css.Navbar.Link>) {
  return <PrimerHeader.Item><PrimerHeader.Link href={href} aria-current={current ? "page" : undefined}>{children}</PrimerHeader.Link></PrimerHeader.Item>;
};
Navbar.Sep = function NavbarSep() { return <></>; };
Navbar.End = function NavbarEnd({ children }: { children?: ReactNode }) {
  return <PrimerHeader.Item full>{children}</PrimerHeader.Item>;
};

function Sidebar({ label, children }: React.ComponentProps<typeof Css.Sidebar>) {
  return <NavList aria-label={label ?? "Sections"}>{children}</NavList>;
}
Sidebar.Group = function SidebarGroup({ children }: { children?: ReactNode }) {
  return <NavList.GroupHeading>{children}</NavList.GroupHeading>;
};
Sidebar.Item = function SidebarItem({ href, current, icon, trail, children }: React.ComponentProps<typeof Css.Sidebar.Item>) {
  return (
    <NavList.Item href={href} aria-current={current ? "page" : undefined}>
      {icon !== undefined && <NavList.LeadingVisual>{icon}</NavList.LeadingVisual>}
      {children}
      {trail !== undefined && <NavList.TrailingVisual>{trail}</NavList.TrailingVisual>}
    </NavList.Item>
  );
};
Sidebar.Collapsible = function SidebarCollapsible({ icon, label, children }: React.ComponentProps<typeof Css.Sidebar.Collapsible>) {
  return (
    <NavList.Item>
      {icon !== undefined && <NavList.LeadingVisual>{icon}</NavList.LeadingVisual>}
      {label}
      <NavList.SubNav>{children}</NavList.SubNav>
    </NavList.Item>
  );
};
Sidebar.Divider = function SidebarDivider() { return <NavList.Divider />; };

/* ── the adapter surface ─────────────────────────────────────────────────── */

export const Ui = {
  ...Css,            // CSS-path fallbacks for everything not mapped below
  // shell
  AppShell, Navbar, Sidebar,
  // actions & navigation
  Button, ButtonGroup, Segmented, Menu, Tabs, Breadcrumb, List,
  // forms
  Field, Input, Select, Textarea, Check, CheckGroup,
  // data display
  Badge, Counter, Chip, StateLabel, Avatar, Timeline, RelativeTime, EmptyState,
  // feedback
  Tooltip, Truncate, Alert, Dialog, Confirm, Progress, Spinner,
  // provider (Banner-stack toasts; Primer has no toast primitive)
  Provider: UiProvider,
};

export type UiComponents = typeof Ui;
