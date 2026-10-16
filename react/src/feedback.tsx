// Feedback: tooltip, help-popover, code-block, truncate, alert, toast, dialog,
// confirm, progress, spinner — markup per core/components.json. The tailor.js
// behaviours (tooltips, help, copy, dismiss, toast, dialogs, confirm) are
// reimplemented as React state; UiProvider hosts the shared layers.
import {
  cloneElement, createContext, isValidElement, useCallback, useContext, useEffect,
  useRef, useState,
  type ButtonHTMLAttributes, type DialogHTMLAttributes, type HTMLAttributes,
  type MouseEvent, type ReactElement, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx, dataAttr, type Tone } from "./util.ts";

/* ── tooltip ─────────────────────────────────────────────────────────────── */

/**
 * Adds `data-tip`/`data-tip-at` to its single child element. The visible
 * tooltip is the shared `.t-tooltip` layer mounted by `UiProvider`.
 */
export function Tooltip({ tip, at, children }: { tip: string; at?: "top" | "bottom" | "left" | "right"; children: ReactElement }) {
  if (!isValidElement(children)) return children;
  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    "data-tip": tip,
    "data-tip-at": at,
  });
}

/** Shared tooltip layer: one `.t-tooltip[role=tooltip]` for every `[data-tip]`. */
function TooltipLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tipEl = ref.current;
    if (!tipEl) return;
    let anchor: HTMLElement | null = null;
    const show = (e: Event) => {
      const t = (e.target as HTMLElement).closest?.("[data-tip]") as HTMLElement | null;
      if (!t || t === anchor) return;
      anchor = t;
      tipEl.textContent = t.getAttribute("data-tip");
      tipEl.dataset.at = t.getAttribute("data-tip-at") ?? "top";
      const r = t.getBoundingClientRect();
      tipEl.hidden = false;
      const tr = tipEl.getBoundingClientRect();
      const at = tipEl.dataset.at;
      let top = r.top - tr.height - 6, left = r.left + r.width / 2 - tr.width / 2;
      if (at === "bottom") top = r.bottom + 6;
      if (at === "left") { top = r.top + r.height / 2 - tr.height / 2; left = r.left - tr.width - 6; }
      if (at === "right") { top = r.top + r.height / 2 - tr.height / 2; left = r.right + 6; }
      tipEl.style.top = `${Math.max(4, top + window.scrollY)}px`;
      tipEl.style.left = `${Math.max(4, left + window.scrollX)}px`;
    };
    const hide = (e: Event) => {
      if (!anchor) return;
      if (e.type === "mouseout" && anchor.contains((e as unknown as { relatedTarget: Node }).relatedTarget)) return;
      anchor = null;
      tipEl.hidden = true;
    };
    document.addEventListener("mouseover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("mouseout", hide);
    document.addEventListener("focusout", hide);
    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("focusin", show);
      document.removeEventListener("mouseout", hide);
      document.removeEventListener("focusout", hide);
    };
  }, []);
  return <div ref={ref} className="t-tooltip" role="tooltip" hidden style={{ position: "absolute" }}></div>;
}

/* ── help popover ────────────────────────────────────────────────────────── */

export type HelpProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "accent" | "info" | "danger";
  /** Accessible label of the trigger ("About heartbeat"). */
  label?: string;
  /** Trigger glyph. */
  glyph?: ReactNode;
};

export function Help({ tone, label, glyph = "i", className, children, ...rest }: HelpProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof window.KeyboardEvent) {
        if (e.key === "Escape") { setOpen(false); setPinned(false); }
      } else if (e.target instanceof Node && !ref.current?.contains(e.target)) {
        setOpen(false); setPinned(false);
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", close); };
  }, [open]);
  return (
    <span
      ref={ref}
      className={cx("t-help", className)}
      data-tone={dataAttr(tone)}
      onMouseEnter={() => { hoverTimer.current = setTimeout(() => setOpen(true), 1000); }}
      onMouseLeave={() => { clearTimeout(hoverTimer.current); if (!pinned) setOpen(false); }}
      {...rest}
    >
      <button
        className="t-help-btn"
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => { setPinned(!pinned || !open); setOpen(!pinned || !open); }}
      >
        {glyph}
      </button>
      <div className="t-help-box" hidden={!open} data-pinned={pinned && open ? "" : undefined}>{children}</div>
    </span>
  );
}

/* ── code block ──────────────────────────────────────────────────────────── */

type CodeProps = HTMLAttributes<HTMLDivElement> & {
  /** Tab labels; shows one `Code.Pre` child per tab. */
  tabs?: ReactNode[];
  defaultTab?: number;
};

export function Code({ tabs, defaultTab = 0, className, children, ...rest }: CodeProps) {
  const [active, setActive] = useState(defaultTab);
  const kids = Array.isArray(children) ? children : [children];
  return (
    <div className={cx("t-code", className)} {...rest}>
      {tabs && (
        <div className="t-code-tabs" role="tablist">
          {tabs.map((t, i) => (
            <button key={i} role="tab" aria-selected={i === active} onClick={() => setActive(i)}>{t}</button>
          ))}
        </div>
      )}
      {tabs ? kids[active] : children}
    </div>
  );
}

type CodePreProps = HTMLAttributes<HTMLPreElement> & {
  variant?: "shell" | "json";
  /** Render the corner copy button (the React Tailor.copy). */
  copy?: boolean;
  copyLabel?: string;
};

function CodePre({ variant, copy, copyLabel = "Copy", className, children, ...rest }: CodePreProps) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    const pre = ref.current;
    if (!pre) return;
    const clone = pre.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".t-code-copy, .t-tok-prompt").forEach((n) => n.remove());
    const txt = (clone.textContent ?? "").replace(/\\\n\s*/g, " ").trim();
    navigator.clipboard?.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <pre ref={ref} className={cx("t-code-pre", className)} data-variant={dataAttr(variant)} {...rest}>
      {copy && (
        <button
          className="t-code-copy"
          type="button"
          aria-label={copyLabel}
          data-copied={copied ? "" : undefined}
          onClick={doCopy}
        >
          ⧉
        </button>
      )}
      {children}
    </pre>
  );
}

/** Syntax token (`t-tok-<kind>`). */
function Tok({ t, className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & {
  t: "prompt" | "cmd" | "flag" | "str" | "url" | "key" | "num" | "bool";
}) {
  return <span className={cx(`t-tok-${t}`, className)} {...rest}>{children}</span>;
}

Code.Pre = CodePre;
Code.Tok = Tok;

/* ── truncate ────────────────────────────────────────────────────────────── */

type TruncateProps = HTMLAttributes<HTMLSpanElement> & {
  /** Click-to-expand (`data-expand` + aria-expanded toggle). */
  expand?: boolean;
};

export function Truncate({ expand, className, title, children, ...rest }: TruncateProps) {
  const [expanded, setExpanded] = useState(false);
  if (!expand) {
    return <span className={cx("t-truncate", className)} title={title} {...rest}>{children}</span>;
  }
  return (
    <span
      className={cx("t-truncate", className)}
      data-expand=""
      title={title}
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ── alert ───────────────────────────────────────────────────────────────── */

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  size?: "sm";
  icon?: ReactNode;
  actions?: ReactNode;
  /** Renders the dismiss button; called when the alert is dismissed. */
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function Alert({ tone, size, icon, actions, onDismiss, dismissLabel = "Dismiss", className, children, ...rest }: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className={cx("t-alert", className)} data-tone={dataAttr(tone)} data-size={dataAttr(size)} role="alert" {...rest}>
      {icon !== undefined && <span className="t-icon t-alert-icon">{icon}</span>}
      <div className="t-alert-body">{children}</div>
      {actions !== undefined && <div className="t-alert-actions">{actions}</div>}
      {onDismiss && (
        <button
          className="t-alert-close"
          aria-label={dismissLabel}
          data-dismiss=""
          onClick={() => { setDismissed(true); onDismiss(); }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ── toast ───────────────────────────────────────────────────────────────── */

const TOAST_ICONS: Record<string, string> = { success: "✓", warning: "▲", danger: "✕", info: "ⓘ" };

export type ToastTone = "success" | "warning" | "danger" | "info";

type ToastProps = HTMLAttributes<HTMLDivElement> & {
  tone: ToastTone;
  leaving?: boolean;
};

/** One toast (presentational). Normally created via `useToasts()`. */
export function Toast({ tone, leaving, className, children, ...rest }: ToastProps) {
  return (
    <div className={cx("t-toast", className)} data-tone={tone} data-leaving={leaving ? "" : undefined} role="status" {...rest}>
      <span className="t-icon t-toast-icon">{TOAST_ICONS[tone] ?? ""}</span>
      <span className="t-toast-body">{children}</span>
    </div>
  );
}

/** The fixed stack region (one per page, `#t-toasts`). */
export function ToastRegion({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("t-toasts", className)} id="t-toasts" aria-live="polite" aria-atomic="false" {...rest}>
      {children}
    </div>
  );
}

Toast.Region = ToastRegion;

type ToastEntry = { id: number; tone: ToastTone; message: ReactNode; leaving: boolean };

type ToastApi = {
  /** `toast(tone, message, {timeout})` — the React Tailor.toast. */
  toast: (tone: ToastTone | "error", message: ReactNode, opts?: { timeout?: number }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToasts(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts() needs a <UiProvider> ancestor");
  return ctx;
}

/* ── dialog ──────────────────────────────────────────────────────────────── */

export type DialogProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "title"> & {
  open?: boolean;
  onClose?: (returnValue: string) => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "danger";
  footer?: ReactNode;
  /** Render as a drawer (`.t-drawer`) instead of a dialog. */
  drawer?: boolean;
  closeLabel?: string;
};

/**
 * Modal dialog over `<dialog class="t-dialog">`: `open` drives
 * showModal()/close(), backdrop click and Esc call `onClose` — the React
 * Tailor.dialogs. Footer buttons close by calling `onClose` themselves.
 */
export function Dialog({
  open, onClose, title, size, tone, footer, drawer, closeLabel = "Close",
  className, children, id, ...rest
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = id ? `${id}-title` : undefined;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);
  const onNativeClose = () => { if (open) onClose?.(ref.current?.returnValue ?? ""); };
  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) { ref.current?.close(); }
  };
  return (
    <dialog
      ref={ref}
      className={cx(drawer ? "t-drawer" : "t-dialog", className)}
      id={id}
      data-size={dataAttr(size, "md")}
      data-tone={dataAttr(tone)}
      aria-labelledby={titleId}
      onClose={onNativeClose}
      onClick={onBackdrop}
      {...rest}
    >
      {title !== undefined && (
        <div className="t-dialog-header">
          <h2 className="t-dialog-title" id={titleId}>{title}</h2>
          <button className="t-dialog-close" aria-label={closeLabel} data-dialog-close="" onClick={() => ref.current?.close()}>×</button>
        </div>
      )}
      <div className="t-dialog-body">{children}</div>
      {footer !== undefined && <div className="t-dialog-footer">{footer}</div>}
    </dialog>
  );
}

/* ── confirm ─────────────────────────────────────────────────────────────── */

type ConfirmState = {
  open: boolean;
  title: ReactNode;
  body: ReactNode;
  label: ReactNode;
  danger: boolean;
  resolve?: (ok: boolean) => void;
};

type ConfirmApi = {
  /** `confirm(title, body, {label, danger})` → Promise<boolean> — the React Tailor.confirm. */
  confirm: (title: ReactNode, body?: ReactNode, opts?: { label?: ReactNode; danger?: boolean }) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmApi | null>(null);

export function useConfirm(): ConfirmApi["confirm"] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm() needs a <UiProvider> ancestor");
  return ctx.confirm;
}

/** The tailor confirm dialog (presentational; `useConfirm()` drives it). */
export function Confirm({
  open, title = "Are you sure?", label = "Confirm", danger = true, onResult, children,
}: {
  open?: boolean;
  title?: ReactNode;
  label?: ReactNode;
  danger?: boolean;
  onResult?: (ok: boolean) => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const result = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) { result.current = false; el.showModal(); }
    else if (!open && el.open) el.close();
  }, [open]);
  const close = (ok: boolean) => { result.current = ok; ref.current?.close(); };
  return (
    <dialog
      ref={ref}
      className="t-dialog"
      id="t-confirm"
      data-variant="confirm"
      data-tone={danger ? "danger" : "neutral"}
      aria-labelledby="t-confirm-title"
      onClose={() => { if (open) onResult?.(result.current); }}
      onClick={(e) => { if (e.target === ref.current) close(false); }}
    >
      <div className="t-dialog-header">
        <h2 className="t-dialog-title" id="t-confirm-title"><span className="t-icon">▲</span><span>{title}</span></h2>
        <button className="t-dialog-close" aria-label="Close" data-dialog-close="" onClick={() => close(false)}>×</button>
      </div>
      <div className="t-dialog-body" id="t-confirm-body">{children}</div>
      <div className="t-dialog-footer">
        <button className="t-btn" data-dialog-close="" onClick={() => close(false)}>Cancel</button>
        <button className="t-btn" data-variant={danger ? "danger" : "primary"} id="t-confirm-ok" onClick={() => close(true)}>
          {label}
        </button>
      </div>
    </dialog>
  );
}

/* ── progress / spinner ──────────────────────────────────────────────────── */

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  /** 0–100; renders the single bar + progressbar aria. Omit for stacked bars. */
  value?: number;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
  tone?: Tone;
};

export function Progress({ value, min = 0, max = 100, size, stacked, tone, className, children, ...rest }: ProgressProps) {
  return (
    <div
      className={cx("t-progress", className)}
      data-variant={stacked ? "stacked" : undefined}
      data-size={dataAttr(size, "md")}
      role={value !== undefined ? "progressbar" : undefined}
      aria-valuenow={value}
      aria-valuemin={value !== undefined ? min : undefined}
      aria-valuemax={value !== undefined ? max : undefined}
      {...rest}
    >
      {value !== undefined && (
        <div className="t-progress-bar" data-tone={dataAttr(tone)} style={{ "--t-value": `${value}%` } as never}></div>
      )}
      {children}
    </div>
  );
}

type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  tone?: Tone;
  tip?: string;
};

function ProgressBar({ value, tone, tip, className, ...rest }: ProgressBarProps) {
  return (
    <div
      className={cx("t-progress-bar", className)}
      data-tone={dataAttr(tone)}
      data-tip={tip}
      style={{ "--t-value": `${value}%` } as never}
      {...rest}
    ></div>
  );
}

Progress.Bar = ProgressBar;

type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: "sm" | "md" | "lg";
  tone?: Tone;
  /** aria-label; pass `null` when adjacent text already labels it. */
  label?: string | null;
};

export function Spinner({ size, tone, label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span
      className={cx("t-spinner", className)}
      data-size={dataAttr(size, "md")}
      data-tone={dataAttr(tone)}
      role="status"
      aria-label={label ?? undefined}
      {...rest}
    ></span>
  );
}

/* ── UiProvider ──────────────────────────────────────────────────────────── */

let toastSeq = 0;

/**
 * Mounts the shared layers (toast region, tooltip layer, confirm dialog) and
 * provides `useToasts()` / `useConfirm()`. Wrap the app once; no tailor.js.
 */
export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false, title: "", body: "", label: "Confirm", danger: true,
  });

  const leave = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 600);
  }, []);

  const toast = useCallback<ToastApi["toast"]>((tone, message, { timeout = 2500 } = {}) => {
    const id = ++toastSeq;
    setToasts((ts) => [...ts, { id, tone: tone === "error" ? "danger" : tone, message, leaving: false }]);
    if (timeout > 0) setTimeout(() => leave(id), timeout);
  }, [leave]);

  const confirm = useCallback<ConfirmApi["confirm"]>((title, body, { label = "Confirm", danger = true } = {}) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ open: true, title, body, label, danger, resolve });
    });
  }, []);

  return (
    <ToastContext value={{ toast }}>
      <ConfirmContext value={{ confirm }}>
        {children}
        {typeof document !== "undefined" && createPortal(
          <>
            <ToastRegion>
              {toasts.map((t) => (
                <Toast key={t.id} tone={t.tone} leaving={t.leaving} onClick={() => leave(t.id)}>
                  {t.message}
                </Toast>
              ))}
            </ToastRegion>
            <TooltipLayer />
            <Confirm
              open={confirmState.open}
              title={confirmState.title}
              label={confirmState.label}
              danger={confirmState.danger}
              onResult={(ok) => {
                confirmState.resolve?.(ok);
                setConfirmState((s) => ({ ...s, open: false, resolve: undefined }));
              }}
            >
              {confirmState.body}
            </Confirm>
          </>,
          document.body,
        )}
      </ConfirmContext>
    </ToastContext>
  );
}

export type { ButtonHTMLAttributes };
