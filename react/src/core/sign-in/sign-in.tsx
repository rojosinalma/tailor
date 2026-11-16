import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/sign-in/spec";
import { type FormEvent, type ReactNode, useState } from "react";
import { Alert } from "../alert/alert";
import { Button } from "../button/button";
import { Card } from "../card/card";
import { Check } from "../check/check";
import { Field } from "../field/field";
import { Input } from "../input/input";
import { Secret } from "../secret/secret";
import { Separator } from "../separator/separator";
import { Stack } from "../stack/stack";

export interface SignInValues {
  identifier: string;
  password: string;
  remember: boolean;
}

export interface SignInPageProps {
  /** Runs when both fields are filled. While the promise it returns is open, the button shows that it works. */
  onSubmit?: (values: SignInValues) => unknown;
  /** Where the form posts in the HTML kit, or in React when there is no onSubmit. */
  action?: string;
  /** What the person signs in with. Both fill the password manager's user name. */
  identifier?: (typeof spec.props.identifier)[number];
  /** Shows the "Keep me signed in" check. */
  remember?: boolean;
  /** The server's message, such as "Wrong name or password". It shows above the form and is announced. */
  error?: string;
  /** Replaces "Sign in". */
  title?: string;
  /** The logo and the app name above the title. */
  brand?: ReactNode;
  /** Other ways to sign in, such as a passkey button, under an "or" line. */
  alternatives?: ReactNode;
  /** Links under the form, such as "Forgot password" and "Create account". */
  footer?: ReactNode;
}

type Missing = Partial<Record<"identifier" | "password", string>>;

/** A centred sign-in card with a form that password managers fill. It fills its parent. */
export function SignInPage({
  onSubmit,
  action,
  identifier = "email",
  remember = false,
  error,
  title = t("signIn"),
  brand,
  alternatives,
  footer,
}: SignInPageProps) {
  const [missing, setMissing] = useState<Missing>({});
  const [pending, setPending] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    const data = new FormData(event.currentTarget);
    const values: SignInValues = {
      identifier: String(data.get(identifier) ?? ""),
      password: String(data.get("password") ?? ""),
      remember: data.get("remember") !== null,
    };
    const next: Missing = {
      identifier: values.identifier.trim() ? undefined : t("fillInField"),
      password: values.password ? undefined : t("fillInField"),
    };
    setMissing(next);
    const first = next.identifier ? identifier : next.password ? "password" : undefined;
    if (first) {
      event.preventDefault();
      const control = event.currentTarget.elements.namedItem(first);
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    if (!onSubmit) return;
    event.preventDefault();
    if (pending) return;
    const result = onSubmit(values);
    if (result instanceof Promise) {
      setPending(true);
      result.finally(() => setPending(false)).catch(() => undefined);
    }
  };

  return (
    <div className="t-status-page t-sign-in">
      <div className="t-sign-in-box">
        <Card>
          <Stack gap="4">
            <div className="t-sign-in-head">
              {brand ? <div className="t-sign-in-brand">{brand}</div> : null}
              <h1 className="t-status-page-title">{title}</h1>
            </div>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <form method="post" action={action} noValidate onSubmit={submit}>
              <Stack gap="3">
                <Field label={t(identifier)} error={missing.identifier}>
                  <Input
                    type={identifier === "email" ? "email" : "text"}
                    name={identifier}
                    autoComplete="username"
                    onValueChange={() => setMissing((m) => ({ ...m, identifier: undefined }))}
                  />
                </Field>
                <Field label={t("password")} error={missing.password}>
                  <Secret
                    name="password"
                    autoComplete="current-password"
                    onValueChange={() => setMissing((m) => ({ ...m, password: undefined }))}
                  />
                </Field>
                {remember ? <Check label={t("keepSignedIn")} name="remember" value="1" /> : null}
                <Button type="submit" variant="primary" loading={pending}>
                  {title}
                </Button>
              </Stack>
            </form>
            {alternatives ? (
              <Stack gap="4">
                <Separator label={t("or")} />
                <Stack gap="2">{alternatives}</Stack>
              </Stack>
            ) : null}
            {footer ? <p className="t-sign-in-footer">{footer}</p> : null}
          </Stack>
        </Card>
      </div>
    </div>
  );
}
