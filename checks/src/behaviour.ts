/**
 * Behaviour tests that run against both kits. A test finds elements by role and name, never by a kit detail,
 * so one test proves that the React kit and the HTML kit behave the same.
 */
import { expect } from "@playwright/test";
import type { Locator, Page } from "playwright";

export type Kit = "react" | "html";

export interface BehaviourContext {
  readonly page: Page;
  readonly kit: Kit;
  /** The body of one example on the page. */
  example(id: string): Locator;
  readonly expect: typeof expect;
}

export type BehaviourTest = (context: BehaviourContext) => Promise<void>;

export interface BehaviourSuite {
  readonly component: string;
  readonly tests: Readonly<Record<string, BehaviourTest>>;
  /** The viewport, when the tests need another one than a desktop. */
  readonly viewport?: { readonly width: number; readonly height: number };
}

export function behaviour(
  component: string,
  tests: Record<string, BehaviourTest>,
  options: { viewport?: { width: number; height: number } } = {},
): BehaviourSuite {
  return { component, tests, ...options };
}

export { expect };
