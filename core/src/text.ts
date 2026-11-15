/** The built-in texts. A project replaces any of them with setTexts() to translate the UI. */

const defaults = {
  close: "Close",
  cancel: "Cancel",
  confirm: "Confirm",
  ok: "OK",
  more: "More",
  menu: "Menu",
  back: "Back",
  search: "Search",
  clear: "Clear",
  loading: "Loading",
  retry: "Try again",
  noResults: "No results",
  nothingSelected: "Select…",
  selected: "selected",
  show: "Show",
  hide: "Hide",
  copy: "Copy",
  copied: "Copied",
  previous: "Previous",
  next: "Next",
  today: "Today",
  sortBy: "Sort by",
  filter: "Filter",
  rowsPerPage: "Rows per page",
  of: "of",
  skin: "Skin",
  palette: "Palette",
  darkMode: "Dark mode",
  lightMode: "Light mode",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  navigation: "Navigation",
  required: "Required",
  invalid: "This value is not valid",
  areYouSure: "Are you sure?",
  offline: "You are offline",
  newVersion: "A new version is ready",
  reload: "Reload",
  installApp: "Install app",
  notFoundTitle: "Page not found",
  notFoundText: "The address does not match a page.",
  errorTitle: "Something went wrong",
  errorText: "The page could not load.",
  offlineTitle: "No connection",
  offlineText: "The page needs a network connection.",
  signIn: "Sign in",
  home: "Home",
} as const;

export type TextKey = keyof typeof defaults;

const texts: Record<TextKey, string> = { ...defaults };

export function setTexts(change: Partial<Record<TextKey, string>>): void {
  Object.assign(texts, change);
}

export function t(key: TextKey): string {
  return texts[key];
}
