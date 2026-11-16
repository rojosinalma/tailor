import { Dialog as Base } from "@base-ui/react/dialog";
import { close, menu } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { type MouseEvent, type PointerEvent, type ReactNode, useId, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { Button } from "../button/button";
import {
  type FooterFact,
  FooterFacts,
  type NavGroup,
  type NavItem,
  NavLists,
  ShellActions,
  type ShellBrand,
  ShellBrandLink,
  ShellTheme,
  type ShellThemePart,
  useCurrentPath,
} from "../shell-base/shell-base";

/** The open state of a drawer that more than one control opens: the menu button and a bottom bar's "More". */
export interface NavDrawerControl {
  readonly id: string;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
}

export function useNavDrawer(): NavDrawerControl {
  const id = useId();
  const [open, setOpen] = useState(false);
  return { id, open, setOpen };
}

export interface NavDrawerProps {
  brand: ShellBrand;
  nav: readonly NavItem[] | readonly NavGroup[];
  /** Global actions, under the links. A shell that keeps them in its top bar leaves this out. */
  actions?: ReactNode;
  footer?: readonly FooterFact[];
  /** The theme controls at the bottom. Default ["mode"]. */
  theme?: readonly ShellThemePart[] | false;
  /** Shares the open state with a BottomBar, from useNavDrawer(). */
  control?: NavDrawerControl;
  /** Draws the menu button in place. Leave it on unless a bottom bar opens the drawer. Default true. */
  button?: boolean;
}

/** A swipe toward the start edge closes the drawer. */
const SWIPE = 48;

function useSwipeClose(onClose: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>): void => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLElement>): void => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const dx = (event.clientX - from.x) * (rtl ? -1 : 1);
      if (dx < -SWIPE && Math.abs(dx) > Math.abs(event.clientY - from.y)) onClose();
    },
  };
}

function MenuButton({ control }: { control: NavDrawerControl }) {
  if (useIsStatic())
    return (
      <a
        className="t-btn t-shell-menu-button"
        data-variant="ghost"
        data-icon-only=""
        href={`#${control.id}`}
        data-t-open={control.id}
        aria-label={t("menu")}
        aria-controls={control.id}
        aria-expanded="false"
      >
        <Glyph body={menu} />
      </a>
    );
  return (
    <Button
      className="t-shell-menu-button"
      variant="ghost"
      icon={<Glyph body={menu} />}
      label={t("menu")}
      aria-expanded={control.open}
      aria-controls={control.open ? control.id : undefined}
      onClick={() => control.setOpen(true)}
    />
  );
}

/** The navigation of a shell on a phone: a drawer from the start edge, opened by the menu button. */
export function NavDrawer({ control, button = true, ...content }: NavDrawerProps) {
  const own = useNavDrawer();
  const shared = control ?? own;
  if (content.nav.length === 0) return null;
  return (
    <>
      {button ? <MenuButton control={shared} /> : null}
      <DrawerPanel control={shared} {...content} />
    </>
  );
}

type PanelProps = Omit<NavDrawerProps, "control" | "button"> & { control: NavDrawerControl };

function PanelContent({
  brand,
  nav,
  actions,
  footer = [],
  theme,
  closeButton,
}: PanelProps & { closeButton: ReactNode }) {
  const path = useCurrentPath();
  const hasTheme = theme !== false && (theme === undefined || theme.length > 0);
  return (
    <>
      <header className="t-drawer-header">
        <ShellBrandLink brand={brand} />
        {closeButton}
      </header>
      <div className="t-drawer-body t-nav-drawer-body">
        <NavLists nav={nav} path={path} label={t("mainNavigation")} />
        <ShellActions>{actions}</ShellActions>
      </div>
      {footer.length > 0 || hasTheme ? (
        <div className="t-nav-drawer-footer">
          <FooterFacts facts={footer} />
          <ShellTheme parts={theme} />
        </div>
      ) : null}
    </>
  );
}

function DrawerPanel(props: PanelProps) {
  const { control } = props;
  const isStatic = useIsStatic();
  const popup = useRef<HTMLDivElement>(null);
  const swipe = useSwipeClose(() => control.setOpen(false));

  if (isStatic) {
    return (
      <dialog
        className="t-drawer t-nav-drawer"
        id={control.id}
        data-t="dialog nav-drawer"
        data-side="start"
        aria-label={t("menu")}
      >
        <PanelContent
          {...props}
          closeButton={
            <button type="button" className="t-drawer-close" aria-label={t("close")} data-t-close="">
              <Glyph body={close} />
            </button>
          }
        />
      </dialog>
    );
  }

  // Choosing a link closes the drawer.
  const onClick = (event: MouseEvent<HTMLElement>): void => {
    if (event.target instanceof Element && event.target.closest("a[href]")) control.setOpen(false);
  };

  return (
    <Base.Root open={control.open} onOpenChange={control.setOpen}>
      <Base.Portal>
        <Base.Backdrop className="t-drawer-backdrop" />
        <Base.Popup
          ref={popup}
          className="t-drawer t-nav-drawer"
          id={control.id}
          data-side="start"
          aria-label={t("menu")}
          initialFocus={() => popup.current?.querySelector<HTMLElement>(".t-shell-nav a[href]") ?? true}
          onClick={onClick}
          {...swipe}
        >
          <PanelContent
            {...props}
            closeButton={
              <Base.Close className="t-drawer-close" aria-label={t("close")}>
                <Glyph body={close} />
              </Base.Close>
            }
          />
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}
