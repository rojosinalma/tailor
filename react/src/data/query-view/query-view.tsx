import { t } from "@tailor/core/text";
import type { ReactNode } from "react";
import { Alert } from "../../core/alert/alert";
import { Button } from "../../core/button/button";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Skeleton } from "../../core/skeleton/skeleton";

/** What the view reads of a query: the shape of TanStack Query's result, without depending on a version. */
export interface QueryLike<T> {
  readonly status: "pending" | "error" | "success";
  readonly data: T | undefined;
  readonly error: unknown;
  readonly isFetching: boolean;
  readonly refetch: () => unknown;
}

export interface QueryViewProps<T> {
  query: QueryLike<T>;
  /** Placeholders shaped like the content, such as skeletons; by default three lines. */
  loading?: ReactNode;
  /** Shown when the data is empty; by default an empty state that says no results. */
  empty?: ReactNode;
  /** True when the data counts as empty; by default null, undefined or an empty array. */
  isEmpty?: (data: T) => boolean;
  /** The content, from the data. */
  children: (data: T) => ReactNode;
}

const emptyByDefault = (data: unknown): boolean =>
  data === null || data === undefined || (Array.isArray(data) && data.length === 0);

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : typeof error === "string" && error ? error : t("errorText");

/** The states of loaded data: loading, error with Try again, empty, or the content. */
export function QueryView<T>({
  query,
  loading,
  empty,
  isEmpty = emptyByDefault,
  children,
}: QueryViewProps<T>) {
  const pending = query.status === "pending";
  if (pending)
    return (
      <div className="t-query" data-state="loading" aria-busy="true">
        {loading ?? <Skeleton lines={3} />}
      </div>
    );
  if (query.status === "error")
    return (
      <div className="t-query" data-state="error">
        <Alert
          tone="danger"
          title={t("errorTitle")}
          actions={
            <Button size="sm" loading={query.isFetching} onClick={() => query.refetch()}>
              {t("retry")}
            </Button>
          }
        >
          {messageOf(query.error)}
        </Alert>
      </div>
    );
  const data = query.data;
  if (data === undefined || isEmpty(data))
    return (
      <div className="t-query" data-state="empty">
        {empty ?? <EmptyState title={t("noResults")} />}
      </div>
    );
  return (
    <div className="t-query" aria-busy={query.isFetching ? true : undefined}>
      {query.isFetching ? <div className="t-query-progress" aria-hidden="true" /> : null}
      {children(data)}
    </div>
  );
}
