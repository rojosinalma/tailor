import { useState } from "react";
import { defineExamples } from "../../examples";
import { AppLink } from "../../link";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";
import { SignInPage, type SignInValues } from "./sign-in";

/** A server that takes a moment and knows one account: alice / correct-horse. */
function Demo() {
  const [error, setError] = useState<string>();
  const submit = ({ identifier, password }: SignInValues) =>
    new Promise<void>((done) => setTimeout(done, 400)).then(() => {
      const ok = identifier === "alice" && password === "correct-horse";
      setError(ok ? undefined : "Wrong name or password.");
    });
  return <SignInPage identifier="username" remember action="/sign-in" onSubmit={submit} error={error} />;
}

const footer = (
  <>
    <AppLink to="#forgot">Forgot password</AppLink> · <AppLink to="#register">Create account</AppLink>
  </>
);

export default defineExamples("sign-in", [
  {
    id: "default",
    title: "Default",
    note: "Try alice and correct-horse. Empty fields show an error and take the focus.",
    display: "frame",
    render: () => <Demo />,
  },
  {
    id: "error",
    title: "With the server's error",
    display: "frame",
    render: () => <SignInPage action="/sign-in" error="Wrong email or password." footer={footer} />,
  },
  {
    id: "brand",
    title: "With a brand and links",
    display: "frame",
    render: () => (
      <SignInPage
        action="/sign-in"
        brand={
          <>
            <Icon name="bi:hdd-network" />
            <span>Example Ops</span>
          </>
        }
        footer={footer}
      />
    ),
  },
  {
    id: "alternatives",
    title: "Other ways to sign in",
    display: "frame",
    render: () => (
      <SignInPage
        action="/sign-in"
        alternatives={
          <>
            <Button icon={<Icon name="bi:fingerprint" />}>Sign in with a passkey</Button>
            <Button icon={<Icon name="bi:building" />}>Single sign-on</Button>
          </>
        }
      />
    ),
  },
  {
    id: "narrow",
    title: "Narrow",
    display: "frame",
    width: "sm",
    render: () => <SignInPage action="/sign-in" error="Wrong email or password." footer={footer} />,
  },
]);
