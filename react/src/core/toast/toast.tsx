import { Toast as Base } from "@base-ui/react/toast";
import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import spec from "@tailor/packs/core/toast/spec";
import { useCallback } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { TONE_GLYPH } from "../alert/alert";

export type ToastTone = (typeof spec.props.tone)[number];

export interface ToastOptions {
  title?: string;
  /** One button in the toast. A click runs onClick and closes the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before the toast leaves. Default 4000. A danger toast stays until it is closed. */
  duration?: number;
}

const LIMIT = 4;
const DURATION = 4000;
const manager = Base.createToastManager();

const isTone = (value: string | undefined): value is ToastTone =>
  spec.props.tone.some((tone) => tone === value);

function ToastList() {
  const { toasts } = Base.useToastManager();
  return toasts.map((toast) => {
    const tone = isTone(toast.type) ? toast.type : "info";
    return (
      <Base.Root key={toast.id} toast={toast} className="t-toast" data-tone={tone}>
        <span className="t-toast-icon">
          <Glyph body={TONE_GLYPH[tone]} />
        </span>
        <Base.Content className="t-toast-content">
          {toast.title ? <Base.Title className="t-toast-title" /> : null}
          <Base.Description className="t-toast-text" />
        </Base.Content>
        {toast.actionProps ? <Base.Action className="t-btn t-toast-action" data-size="sm" /> : null}
        <Base.Close className="t-toast-close" aria-label={t("close")}>
          <Glyph body={close} />
        </Base.Close>
      </Base.Root>
    );
  });
}

/** The region that shows the toasts. Render it once, near the root of the app. */
export function ToastRegion() {
  const isStatic = useIsStatic();
  // The HTML kit's script makes the region on the first toast.
  if (isStatic) return null;
  return (
    <Base.Provider toastManager={manager} limit={LIMIT} timeout={DURATION}>
      <Base.Portal>
        <Base.Viewport className="t-toasts" aria-label={t("notifications")}>
          <ToastList />
        </Base.Viewport>
      </Base.Portal>
    </Base.Provider>
  );
}

/** Returns toast(tone, message, options), which shows a toast in the ToastRegion. */
export function useToast() {
  return useCallback((tone: ToastTone, message: string, options: ToastOptions = {}): void => {
    const { title, action, duration = DURATION } = options;
    let id = "";
    id = manager.add({
      type: tone,
      title,
      description: message,
      timeout: tone === "danger" ? 0 : duration,
      actionProps: action
        ? {
            children: action.label,
            onClick: () => {
              action.onClick();
              manager.close(id);
            },
          }
        : undefined,
    });
  }, []);
}
