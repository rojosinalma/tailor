import { describe, expect, test } from "bun:test";
import { formatFull, formatRelative, nextUpdate, relative, subscribe, tickerState, toDate } from "./logic";

const now = new Date("2026-11-15T12:00:00Z");
const at = (ms: number): Date => new Date(now.getTime() + ms);
const S = 1000;
const M = 60 * S;
const H = 60 * M;
const D = 24 * H;

describe("unit and value", () => {
  test("less than a minute is just now, both ways", () => {
    expect(relative(at(-59 * S), now)).toEqual({ unit: null, value: 0 });
    expect(relative(at(30 * S), now)).toEqual({ unit: null, value: 0 });
  });

  test("picks the largest unit and whole values", () => {
    expect(relative(at(-2 * H - 10 * M), now)).toEqual({ unit: "hour", value: -2 });
    expect(relative(at(3 * D + H), now)).toEqual({ unit: "day", value: 3 });
    expect(relative(at(-90 * S), now)).toEqual({ unit: "minute", value: -1 });
    expect(relative(at(-10 * D), now)).toEqual({ unit: "week", value: -1 });
    expect(relative(at(-45 * D), now)).toEqual({ unit: "month", value: -1 });
    expect(relative(at(-800 * D), now)).toEqual({ unit: "year", value: -2 });
  });
});

describe("text", () => {
  test("past, future and just now", () => {
    expect(formatRelative(at(-2 * H), now, "just now", "en-US")).toBe("2 hours ago");
    expect(formatRelative(at(3 * D), now, "just now", "en-US")).toBe("in 3 days");
    expect(formatRelative(at(-1 * D), now, "just now", "en-US")).toBe("1 day ago");
    expect(formatRelative(at(-10 * S), now, "just now", "en-US")).toBe("just now");
  });

  test("follows the locale", () => {
    expect(formatRelative(at(-2 * H), now, "gerade eben", "de")).toBe("vor 2 Stunden");
  });

  test("the full date names the day and the time", () => {
    const text = formatFull(now, "en-US");
    expect(text).toContain("November");
    expect(text).toContain("2026");
  });

  test("parses ISO text and rejects junk", () => {
    expect(toDate("2026-11-15T12:00:00Z")?.getTime()).toBe(now.getTime());
    expect(toDate("not a date")).toBeNull();
    expect(toDate(now)).toBe(now);
  });
});

describe("next update", () => {
  test("in the past: at the next whole unit", () => {
    expect(nextUpdate(at(-30 * S), now)).toBe(30 * S);
    expect(nextUpdate(at(-5 * M - 20 * S), now)).toBe(40 * S);
  });

  test("in the past: at the next unit threshold when it comes first", () => {
    // 29 days ago shows "4 weeks ago"; at 30 days it becomes "1 month ago".
    expect(nextUpdate(at(-30 * D + 30 * S), now)).toBe(30 * S);
  });

  test("in the future: when the value drops", () => {
    expect(nextUpdate(at(90 * M), now)).toBe(30 * M + 1);
    expect(nextUpdate(at(2 * M + 10 * S), now)).toBe(10 * S + 1);
  });

  test("never sooner than a second, never later than an hour", () => {
    expect(nextUpdate(at(-59 * M - 59.9 * S), now)).toBe(S);
    expect(nextUpdate(at(-10 * D), now)).toBe(H);
    expect(nextUpdate(at(20 * S), now)).toBe(80 * S);
  });
});

describe("shared timer", () => {
  test("one timer runs every update when due and stops with the last one", async () => {
    const calls: string[] = [];
    const stopA = subscribe(() => {
      calls.push("a");
      return 10;
    }, 10);
    const stopB = subscribe(() => {
      calls.push("b");
      return 1000;
    }, 30);
    expect(tickerState()).toEqual({ count: 2, running: true });
    await Bun.sleep(60);
    expect(calls.filter((c) => c === "a").length).toBeGreaterThanOrEqual(2);
    expect(calls.filter((c) => c === "b")).toEqual(["b"]);
    stopA();
    expect(tickerState()).toEqual({ count: 1, running: true });
    stopB();
    expect(tickerState()).toEqual({ count: 0, running: false });
  });
});
