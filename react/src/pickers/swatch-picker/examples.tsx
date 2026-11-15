import { Field } from "../../core/field/field";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { type SwatchOption, SwatchPicker } from "./swatch-picker";

const hues: SwatchOption[] = [
  { value: "red", label: "Red", token: "hue-red" },
  { value: "orange", label: "Orange", token: "hue-orange" },
  { value: "yellow", label: "Yellow", token: "hue-yellow" },
  { value: "green", label: "Green", token: "hue-green" },
  { value: "cyan", label: "Cyan", token: "hue-cyan" },
  { value: "blue", label: "Blue", token: "hue-blue" },
  { value: "purple", label: "Purple", token: "hue-purple" },
  { value: "pink", label: "Pink", token: "hue-pink" },
];

export default defineExamples("swatch-picker", [
  {
    id: "default",
    title: "The hues of the palette",
    note: "Token swatches follow the palette.",
    render: () => <SwatchPicker options={hues} name="tag" defaultValue="green" label="Tag colour" />,
  },
  {
    id: "free",
    title: "Free colours, in three sizes",
    render: () => (
      <Stack>
        {(["sm", "md", "lg"] as const).map((size) => (
          <SwatchPicker
            key={size}
            size={size}
            name={`chart-${size}`}
            defaultValue="sand"
            label={`Chart colour, ${size}`}
            options={[
              { value: "white", label: "White", color: "#ffffff" },
              { value: "sand", label: "Sand", color: "#e9c46a" },
              { value: "teal", label: "Teal", color: "#2a9d8f" },
              { value: "ink", label: "Ink", color: "#111111" },
            ]}
          />
        ))}
      </Stack>
    ),
  },
  {
    id: "empty",
    title: "Nothing picked yet",
    render: () => <SwatchPicker options={hues.slice(0, 4)} name="status" label="Status colour" />,
  },
  {
    id: "disabled",
    title: "Disabled",
    render: () => (
      <SwatchPicker
        options={hues.slice(0, 4)}
        name="locked"
        defaultValue="red"
        disabled
        label="Locked colour"
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <SwatchPicker options={hues} name="narrow" defaultValue="blue" label="Folder colour" />,
  },
  {
    id: "field",
    title: "Inside a Field, with help and an error",
    render: () => (
      <Field
        label="Tag colour"
        help="The colour of the tag in lists."
        error="Pick another colour: red is taken."
        required
      >
        <SwatchPicker options={hues} name="tag-field" defaultValue="red" />
      </Field>
    ),
  },
]);
