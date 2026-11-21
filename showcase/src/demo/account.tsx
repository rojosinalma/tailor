/** The pages of the bare shell: before the app (sign-in, first run) and outside it (error, offline). */
import { Cluster } from "@tailor/react/core/cluster/cluster";
import { ErrorPage } from "@tailor/react/core/error-page/error-page";
import { Icon } from "@tailor/react/core/icon/icon";
import { OfflinePage } from "@tailor/react/core/offline-page/offline-page";
import { SignInPage } from "@tailor/react/core/sign-in/sign-in";
import { FirstRunPageLayout } from "@tailor/react/layouts/first-run-page/first-run-page";
import { BareShell } from "@tailor/react/shell-bare/bare/bare";
import type { AppContext } from "./app-context";
import { FOOTER } from "./console";
import { ERROR_DETAILS } from "./stress";

const THEME = ["skin", "palette", "mode"] as const;

export function BarePage({ id, context }: { id: string; context: AppContext }) {
  const { href, go } = context;
  const brand = { name: "Console", icon: "bi:box-seam" as const, to: href("sign-in") };
  switch (id) {
    case "first-run":
      return (
        <BareShell brand={brand} align="start" theme={THEME} footer={FOOTER}>
          <FirstRunPageLayout />
        </BareShell>
      );
    case "error":
      return (
        <BareShell align="center" theme={THEME}>
          <ErrorPage homeTo={href("sign-in")} />
        </BareShell>
      );
    case "error-long":
    case "error-details":
      return (
        <BareShell align="center" theme={THEME}>
          <ErrorPage
            detailsOpen={id === "error-details"}
            title="The console could not start"
            text="The settings service did not answer in time. The details below help the person who runs the console."
            details={ERROR_DETAILS}
            homeTo={href("sign-in")}
          />
        </BareShell>
      );
    case "offline":
      return (
        <BareShell align="center" theme={THEME}>
          <OfflinePage />
        </BareShell>
      );
    default:
      return (
        <BareShell align="start" theme={THEME} footer={FOOTER}>
          <SignInPage
            // The HTML kit sends the form to the next page; the React kit goes there in its router.
            action={go ? undefined : href("first-run")}
            onSubmit={go ? () => go("first-run") : undefined}
            remember
            brand={
              <Cluster gap="2" align="center">
                <Icon name="bi:box-seam" />
                Console
              </Cluster>
            }
          />
        </BareShell>
      );
  }
}
