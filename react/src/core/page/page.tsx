import { more } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/page/spec";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";
import { Button, ButtonLink } from "../button/button";
import { Menu, type MenuActionItem, type MenuSeparatorItem } from "../menu/menu";

export type PageAction = MenuActionItem | MenuSeparatorItem;

export interface PageProps {
  /** The one h1 of the page. */
  title: string;
  description?: ReactNode;
  /** A breadcrumb, shown above the title. */
  breadcrumb?: ReactNode;
  /** Free page actions, at the end of the header. For a main action and others, use primaryAction and moreActions. */
  actions?: ReactNode;
  /** The main action, usually a primary Button. It always shows. */
  primaryAction?: ReactNode;
  /** The other actions: buttons in a wide page, one "more" menu in a narrow page. */
  moreActions?: readonly PageAction[];
  /** "scroll": the body scrolls. "fill": the body takes the free height and its children scroll alone. */
  mode?: (typeof spec.props.mode)[number];
  /** "readable": the content keeps a width that reads well. */
  width?: (typeof spec.props.width)[number];
  children?: ReactNode;
}

function ActionButton({ item }: { item: MenuActionItem }) {
  const look = { variant: item.tone === "danger" ? ("danger" as const) : undefined, icon: item.icon };
  if (item.to !== undefined && !item.disabled) {
    return (
      <ButtonLink to={item.to} data-id={item.id} {...look}>
        {item.label}
      </ButtonLink>
    );
  }
  return (
    <Button data-id={item.id} disabled={item.disabled} onClick={item.onSelect} {...look}>
      {item.label}
    </Button>
  );
}

function MoreActions({ items }: { items: readonly PageAction[] }) {
  return (
    <>
      <div className="t-page-secondary">
        {items.map((item) => (item.type === "separator" ? null : <ActionButton key={item.id} item={item} />))}
      </div>
      <div className="t-page-more">
        <Menu
          trigger={<Button icon={<Glyph body={more} />} label={t("more")} />}
          label={t("more")}
          items={items}
        />
      </div>
    </>
  );
}

/** The container that fills a shell's content region. Its header stays; its body scrolls or fills. */
export function Page({
  title,
  description,
  breadcrumb,
  actions,
  primaryAction,
  moreActions,
  mode = "scroll",
  width = "full",
  children,
}: PageProps) {
  const hasMore = moreActions !== undefined && moreActions.length > 0;
  return (
    <div
      className="t-page"
      data-mode={mode === "scroll" ? undefined : mode}
      data-width={width === "full" ? undefined : width}
    >
      <header className="t-page-header">
        {breadcrumb ? <div className="t-page-breadcrumb">{breadcrumb}</div> : null}
        <div className="t-page-heading">
          <h1 className="t-page-title">{title}</h1>
          {description ? <p className="t-page-description">{description}</p> : null}
        </div>
        {actions || primaryAction || hasMore ? (
          <div className="t-page-actions">
            {actions}
            {hasMore ? <MoreActions items={moreActions} /> : null}
            {primaryAction}
          </div>
        ) : null}
      </header>
      <div className="t-page-body">{children}</div>
    </div>
  );
}
