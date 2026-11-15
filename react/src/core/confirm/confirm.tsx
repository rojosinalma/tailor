import { AlertDialog as Base } from "@base-ui/react/alert-dialog";
import { t } from "@tailor/core/text";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIsStatic } from "../../kit";
import { Button } from "../button/button";

export interface ConfirmOptions {
  /** The question, such as "Delete web-1?". */
  title: string;
  /** The consequence, in one paragraph. */
  text?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** The action destroys something: the confirm button is a danger button. */
  danger?: boolean;
}

interface Request {
  readonly options: ConfirmOptions;
  readonly resolve: (confirmed: boolean) => void;
}

let show: ((request: Request) => void) | null = null;

/** The one dialog that asks the confirm questions. Render it once, near the root of the app. */
export function ConfirmRegion() {
  const isStatic = useIsStatic();
  const [request, setRequest] = useState<Request | null>(null);
  const [open, setOpen] = useState(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const pending = useRef<Request | null>(null);

  const finish = useCallback((confirmed: boolean): void => {
    pending.current?.resolve(confirmed);
    pending.current = null;
    setOpen(false);
  }, []);

  useEffect(() => {
    show = (next) => {
      pending.current?.resolve(false);
      pending.current = next;
      setRequest(next);
      setOpen(true);
    };
    return () => {
      show = null;
    };
  }, []);

  // The HTML kit's script builds the dialog on the first question.
  if (isStatic || !request) return null;
  const { title, text, confirmLabel = t("confirm"), cancelLabel = t("cancel"), danger } = request.options;

  return (
    <Base.Root open={open} onOpenChange={(next) => (next ? undefined : finish(false))}>
      <Base.Portal>
        <Base.Backdrop className="t-dialog-backdrop" onClick={() => finish(false)} />
        <Base.Popup className="t-dialog" data-variant="confirm" initialFocus={cancel}>
          <header className="t-dialog-header">
            <Base.Title className="t-dialog-title">{title}</Base.Title>
          </header>
          {text ? (
            <div className="t-dialog-body">
              <Base.Description>{text}</Base.Description>
            </div>
          ) : null}
          <footer className="t-dialog-footer">
            <Button ref={cancel} onClick={() => finish(false)}>
              {cancelLabel}
            </Button>
            <Button variant={danger ? "danger" : "primary"} onClick={() => finish(true)}>
              {confirmLabel}
            </Button>
          </footer>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}

/** Returns confirm(options), which asks in the ConfirmRegion and resolves true when the user confirms. */
export function useConfirm() {
  return useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise((resolve) => {
        if (!show) throw new Error("useConfirm: render <ConfirmRegion /> once near the root of the app");
        show({ options, resolve });
      }),
    [],
  );
}
