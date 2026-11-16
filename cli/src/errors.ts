/** Wrong use of the command: exit code 2. */
export class UsageError extends Error {
  override readonly name = "UsageError";
}

/** A problem the user can fix: exit code 1. The message says what is wrong, `fix` says what to do. */
export class Problem extends Error {
  override readonly name = "Problem";
  constructor(
    message: string,
    readonly fix?: string,
  ) {
    super(message);
  }
}
