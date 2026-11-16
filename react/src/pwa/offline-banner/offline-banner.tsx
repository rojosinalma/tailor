import { offline as offlineGlyph } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { cloneElement, type MouseEvent, type ReactElement, useId, useState } from "react";
import { Notice } from "../pwa/notice";
import { usePwa, useScriptHook } from "../pwa/provider";

/** "You are offline" while the device has no network; the return is announced too. */
export function OfflineBanner() {
  const { offline } = usePwa();
  const hook = useScriptHook();
  const [wasOffline, setWasOffline] = useState(false);
  if (offline && !wasOffline) setWasOffline(true);
  if (hook) return <div className="t-offline-banner" data-t="offline-banner" role="status" />;
  return (
    <div className="t-offline-banner" role="status">
      {offline ? (
        <Notice tone="warning" glyph={offlineGlyph}>
          {t("offline")}
        </Notice>
      ) : wasOffline ? (
        <span className="t-sr-only">{t("backOnline")}</span>
      ) : null}
    </div>
  );
}

/** True while the device has a network. Needs a <PwaProvider>. */
export function useOnline(): boolean {
  return !usePwa().offline;
}

const block = (event: MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();
};

interface NetworkChildProps {
  "aria-describedby"?: string;
}

/**
 * Disables its child, a button or a link, while offline: aria-disabled, a note for screen readers, and
 * clicks do nothing. The action is never queued for later.
 */
export function NeedsNetwork({ children }: { children: ReactElement<NetworkChildProps> }) {
  const { offline } = usePwa();
  const hook = useScriptHook();
  const id = useId();
  if (hook) return cloneElement(children, { "data-t": "needs-network" } as Record<string, unknown>);
  if (!offline) return children;
  const described = [children.props["aria-describedby"], id].filter(Boolean).join(" ");
  return (
    <>
      {cloneElement(children, {
        "aria-disabled": "true",
        "aria-describedby": described,
        onClick: block,
      } as Record<string, unknown>)}
      <span id={id} hidden>
        {t("needsNetwork")}
      </span>
    </>
  );
}
