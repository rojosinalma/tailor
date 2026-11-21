/** What a page of a sample app needs from the kit around it. */
export interface AppContext {
  /** The address of a page of the same app: a router path in the React kit, a file name in the HTML kit. */
  readonly href: (page: string) => string;
  /** The page shown: a link stands for the pages of its kind (Services for services-many). */
  readonly current?: string;
  /** Goes to a page of the same app (React kit). The HTML kit follows a link or a form action instead. */
  readonly go?: (page: string) => void;
}
