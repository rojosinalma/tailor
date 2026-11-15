import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { OtpField } from "./otp";

export default defineExamples("otp", [
  {
    id: "default",
    title: "Six digits",
    render: () => <OtpField name="code" label="Verification code" />,
  },
  {
    id: "value",
    title: "With a value, in three sizes",
    render: () => (
      <Stack>
        <OtpField name="code-sm" defaultValue="482913" size="sm" label="Small code" />
        <OtpField name="code-md" defaultValue="482913" label="Medium code" />
        <OtpField name="code-lg" defaultValue="482913" size="lg" label="Large code" />
      </Stack>
    ),
  },
  {
    id: "letters",
    title: "Four letters or digits",
    render: () => <OtpField name="pair" length={4} numeric={false} label="Pairing code" />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => <OtpField name="locked" defaultValue="1234" length={4} disabled label="Locked code" />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <OtpField name="narrow" defaultValue="12" label="Backup code" />,
  },
]);
