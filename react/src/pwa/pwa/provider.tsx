/** The PWA store for the React kit: one provider at the app root, read with usePwa(). */
import { t } from "@tailor/core/text";
import { createPwa, fixedPwa, type PwaStore } from "@tailor/packs/pwa/pwa/client";
import type { InstallSteps, PwaState } from "@tailor/packs/pwa/pwa/logic";
import { createContext, type ReactElement, type ReactNode, use, useState, useSyncExternalStore } from "react";
import { Button } from "../../core/button/button";
import { Dialog, DialogClose } from "../../core/dialog/dialog";
import { useIsStatic } from "../../kit";

interface PwaContextValue {
  readonly store: PwaStore;
  /** The store was given (examples, tests): the static mode draws its state instead of the script hooks. */
  readonly fixed: boolean;
  readonly showSteps: () => void;
}

const PwaContext = createContext<PwaContextValue | null>(null);

/** The server render has no browser: a store that knows nothing until the page takes over. */
const SERVER = fixedPwa({ supported: false });

export interface PwaProviderProps {
  /** The address of the app's worker file, for example "/sw.js". Leave out for install and network only. */
  worker?: string;
  /** The scope of the worker. Defaults to the folder of the worker file. */
  scope?: string;
  /** A ready-made store, such as fixedPwa({ updateReady: true }) in examples and tests. */
  store?: PwaStore;
  children: ReactNode;
}

const STEP_TEXT = {
  ios: "installStepsIos",
  mac: "installStepsMac",
  "firefox-android": "installStepsFirefox",
} as const;

/** The manual install steps of a browser with no install prompt. */
export function InstallStepsDialog({
  steps,
  trigger,
  open,
  onOpenChange,
}: {
  steps: InstallSteps;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog
      title={t("installStepsTitle")}
      size="sm"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <DialogClose>
          <Button variant="primary">{t("ok")}</Button>
        </DialogClose>
      }
    >
      <p>{t(STEP_TEXT[steps])}</p>
    </Dialog>
  );
}

export function PwaProvider({ worker, scope, store, children }: PwaProviderProps) {
  const isStatic = useIsStatic();
  const [own] = useState(
    () => store ?? (isStatic || typeof window === "undefined" ? SERVER : createPwa({ worker, scope })),
  );
  const [stepsOpen, setStepsOpen] = useState(false);
  const steps = useSyncExternalStore(
    own.subscribe,
    () => own.get().steps,
    () => null,
  );
  return (
    <PwaContext value={{ store: own, fixed: store !== undefined, showSteps: () => setStepsOpen(true) }}>
      {children}
      {!isStatic && steps ? (
        <InstallStepsDialog steps={steps} open={stepsOpen} onOpenChange={setStepsOpen} />
      ) : null}
    </PwaContext>
  );
}

export interface Pwa extends PwaState {
  /** Opens the browser's install prompt, or the dialog with the manual steps. */
  install(): void;
  /** Starts the waiting version and reloads the page. */
  applyUpdate(): void;
  checkForUpdate(): void;
}

function usePwaContext(): PwaContextValue {
  const context = use(PwaContext);
  if (!context) throw new Error("tailor: usePwa() needs a <PwaProvider> at the app root");
  return context;
}

/** The state of install, update and network, and the actions. Needs a <PwaProvider>. */
export function usePwa(): Pwa {
  const { store, showSteps } = usePwaContext();
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  return {
    ...state,
    install: () => {
      if (state.installable) void store.install();
      else if (state.steps) showSteps();
    },
    applyUpdate: store.applyUpdate,
    checkForUpdate: () => void store.checkForUpdate(),
  };
}

/** True in the static mode with a store from the page: the component renders the HTML kit's hook only. */
export function useScriptHook(): boolean {
  const { fixed } = usePwaContext();
  return useIsStatic() && !fixed;
}
