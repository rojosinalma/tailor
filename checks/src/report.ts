import type { PageProblem } from "./pages";

/** Prints page problems, one line per problem, with the states where it shows. */
export function printProblems(problems: readonly PageProblem[]): void {
  const seen = new Map<string, { problem: PageProblem; states: string[] }>();
  for (const problem of problems) {
    const key = `${problem.page}|${problem.rule}|${problem.message}`;
    const entry = seen.get(key) ?? { problem, states: [] };
    entry.states.push(problem.state);
    seen.set(key, entry);
  }
  for (const { problem, states } of seen.values()) {
    const unique = [...new Set(states)];
    const where =
      unique.length > 3
        ? `${unique.slice(0, 3).join(", ")} and ${unique.length - 3} more`
        : unique.join(", ");
    console.error(`FAIL ${problem.page} [${problem.rule}] ${problem.message}\n     at: ${where}`);
  }
}
