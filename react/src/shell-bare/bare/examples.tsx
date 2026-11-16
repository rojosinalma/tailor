import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Field } from "../../core/field/field";
import { Grid } from "../../core/grid/grid";
import { Icon } from "../../core/icon/icon";
import { Input } from "../../core/input/input";
import { Page } from "../../core/page/page";
import { BRAND, FOOTER } from "../../core/shell-base/sample";
import { Stack } from "../../core/stack/stack";
import { Stat } from "../../core/stat/stat";
import { defineExamples } from "../../examples";
import { BareShell } from "./bare";

const signIn = (
  <Card title="Sign in" footer={<Button variant="primary">Sign in</Button>}>
    <Stack>
      <Field label="User name">
        <Input autoComplete="username" />
      </Field>
      <Field label="Password">
        <Input type="password" autoComplete="current-password" />
      </Field>
    </Stack>
  </Card>
);

const HOSTS = ["web-1", "web-2", "nas", "db-1", "cache-1", "proxy"];

export default defineExamples("bare", [
  {
    id: "sign-in",
    title: "Center: a sign-in card under the brand, the footer facts in one line",
    display: "frame",
    render: () => (
      <BareShell brand={BRAND} footer={FOOTER} align="center" contained>
        {signIn}
      </BareShell>
    ),
  },
  {
    id: "error",
    title: "Center: an error page with the theme controls",
    display: "frame",
    render: () => (
      <BareShell brand={BRAND} footer={FOOTER} theme={["mode"]} align="center" contained>
        <EmptyState
          icon={<Icon name="bi:wifi-off" />}
          title="No connection"
          text="The console needs a network connection."
          actions={<Button>Try again</Button>}
        />
      </BareShell>
    ),
  },
  {
    id: "wall",
    title: "Start: a full-screen view, a Page in fill mode",
    display: "frame",
    render: () => (
      <BareShell brand={BRAND} align="start" contained>
        <Page title="Hosts" mode="fill">
          <Grid min="2xs">
            {HOSTS.map((host, i) => (
              <Stat
                key={host}
                label={host}
                value={`${20 + i * 7}%`}
                sub="CPU"
                tone={i === 2 ? "warning" : undefined}
              />
            ))}
          </Grid>
        </Page>
      </BareShell>
    ),
  },
  {
    id: "narrow",
    title: "Narrow: the sign-in card on a phone",
    display: "frame",
    width: "sm",
    render: () => (
      <BareShell brand={BRAND} footer={FOOTER} align="center" contained>
        {signIn}
      </BareShell>
    ),
  },
]);
