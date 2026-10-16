// tailor-react — the component API over the tailor markup vocabulary.
// `import { Ui } from "tailor-react"` and render `<Ui.Button>`, `<Ui.Field>`, …
// Default path renders the exact tailor markup (core/components.json); the kit
// adapters under adapters/<kit>/ render the same API through a component kit.
import {
  AppShell, Navbar, Sidebar, Footer, Page, Section, Toolbar,
  Grid, Stack, Cluster, Split,
} from "./shell.tsx";
import {
  Icon, Button, ButtonGroup, Segmented, Menu, Tabs, Breadcrumb, Pagination, List,
} from "./actions.tsx";
import {
  Label, Input, Select, Textarea, InputGroup, InputAddon,
  Field, Check, CheckGroup, DurationInput, Settings, SettingsRow,
} from "./forms.tsx";
import {
  Badge, Counter, Chip, StateLabel, Dot, Avatar, Table, Card, Facts,
  StatLabel, StatValue, StatSub, StatBox, EmptyState, Timeline, RelativeTime,
} from "./data.tsx";
import {
  Tooltip, Help, Code, Truncate, Alert, Toast, ToastRegion, Dialog, Confirm,
  Progress, Spinner, UiProvider,
} from "./feedback.tsx";

export const Ui = {
  // shell & layout
  AppShell, Navbar, Sidebar, Footer, Page, Section, Toolbar, Grid, Stack, Cluster, Split,
  // actions & navigation
  Icon, Button, ButtonGroup, Segmented, Menu, Tabs, Breadcrumb, Pagination, List,
  // forms
  Label, Input, Select, Textarea, InputGroup, InputAddon,
  Field, Check, CheckGroup, DurationInput, Settings, SettingsRow,
  // data display
  Badge, Counter, Chip, StateLabel, Dot, Avatar, Table, Card, Facts,
  StatLabel, StatValue, StatSub, StatBox, EmptyState, Timeline, RelativeTime,
  // feedback
  Tooltip, Help, Code, Truncate, Alert, Toast, ToastRegion, Dialog, Confirm, Progress, Spinner,
  // provider
  Provider: UiProvider,
};

export type UiComponents = typeof Ui;

export { UiProvider };
export { useToasts, useConfirm } from "./feedback.tsx";
export { relativeTime } from "./data.tsx";
export { cx, type Tone, type Size } from "./util.ts";
