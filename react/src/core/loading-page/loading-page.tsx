import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/loading-page/spec";
import { Skeleton } from "../skeleton/skeleton";

type Delay = (typeof spec.props.delay)[number] extends infer D
  ? D extends `${infer N extends number}`
    ? N
    : never
  : never;

export interface LoadingPageProps {
  /** "spinner": a centred spinner with a text. "skeleton": the placeholder of a typical page. */
  variant?: (typeof spec.props.variant)[number];
  /** Milliseconds before the page shows, so a fast load never flashes. */
  delay?: Delay;
  /** Replaces "Loading". */
  label?: string;
}

/** The pending state of a page. It fills its parent and shows only after `delay`. */
export function LoadingPage({ variant = "spinner", delay = 150, label = t("loading") }: LoadingPageProps) {
  return (
    <div
      className="t-status-page t-loading-page"
      role="status"
      aria-busy="true"
      data-delay={delay === 150 ? undefined : String(delay)}
    >
      {variant === "spinner" ? (
        <div className="t-loading-page-spinner">
          <span className="t-spinner" data-size="lg" aria-hidden="true" />
          <h1 className="t-loading-page-label">{label}</h1>
        </div>
      ) : (
        <div className="t-loading-page-skeleton">
          <Skeleton />
          <Skeleton />
          <Skeleton lines={6} />
          <h1 className="t-sr-only">{label}</h1>
        </div>
      )}
    </div>
  );
}

/** The loading page as a router's `pendingComponent`. */
export const routePendingComponent = () => <LoadingPage />;
