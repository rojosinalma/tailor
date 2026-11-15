import { describe, expect, test } from "bun:test";
import {
  clampTime,
  formatTime,
  matchTyped,
  moveOption,
  parseTime,
  periodNames,
  printTime,
  setPart,
  startTime,
  type TimeSettings,
  timeColumns,
  uses12Hour,
} from "./logic";

const h24: TimeSettings = { step: 5, seconds: false, hour12: false };
const h12: TimeSettings = { ...h24, hour12: true, locale: "en-US" };
const at = (text: string) => {
  const time = parseTime(text);
  if (!time) throw new Error(text);
  return time;
};

describe("parse and print", () => {
  test("parses times with and without seconds", () => {
    expect(parseTime("09:05")).toEqual({ hour: 9, minute: 5, second: 0 });
    expect(parseTime("23:59:30")).toEqual({ hour: 23, minute: 59, second: 30 });
  });

  test("rejects text that is not a time of day", () => {
    for (const bad of ["", "24:00", "12:60", "9:05", "12:00:60", "noon", null, undefined]) {
      expect(parseTime(bad)).toBeNull();
    }
  });

  test("prints 24-hour values", () => {
    expect(printTime(at("07:30"), false)).toBe("07:30");
    expect(printTime(at("07:30:15"), true)).toBe("07:30:15");
  });

  test("formats for the locale", () => {
    expect(formatTime(at("14:30"), true, false, "en-US")).toBe("2:30 PM");
    expect(formatTime(at("00:05"), true, false, "en-US")).toBe("12:05 AM");
    expect(formatTime(at("14:30"), false, false, "de-DE")).toBe("14:30");
    expect(formatTime(at("00:05:09"), false, true, "en-GB")).toBe("00:05:09");
  });

  test("knows the clock of a locale", () => {
    expect(uses12Hour("en-US")).toBe(true);
    expect(uses12Hour("de-DE")).toBe(false);
    expect(uses12Hour("en-US", false)).toBe(false);
    expect(periodNames("en-US")).toEqual(["AM", "PM"]);
  });
});

describe("columns", () => {
  test("24-hour: hours and minutes in steps", () => {
    const [hours, minutes, ...rest] = timeColumns(at("14:30"), h24);
    expect(rest).toHaveLength(0);
    expect(hours?.options).toHaveLength(24);
    expect(hours?.options.find((o) => o.selected)?.text).toBe("14");
    expect(minutes?.options.map((o) => o.text).slice(0, 3)).toEqual(["00", "05", "10"]);
    expect(minutes?.options).toHaveLength(12);
  });

  test("a minute off the step still shows", () => {
    const minutes = timeColumns(at("10:07"), h24)[1]?.options ?? [];
    expect(minutes).toHaveLength(13);
    expect(minutes.find((o) => o.selected)?.text).toBe("07");
  });

  test("12-hour: 12 first, and an AM/PM column", () => {
    const columns = timeColumns(at("14:30"), h12);
    expect(columns.map((c) => c.key)).toEqual(["hour", "minute", "period"]);
    expect(columns[0]?.options[0]?.text).toBe("12");
    expect(columns[0]?.options.find((o) => o.selected)?.text).toBe("2");
    expect(columns[2]?.options.find((o) => o.selected)?.text).toBe("PM");
  });

  test("a seconds column when asked", () => {
    const columns = timeColumns(at("10:00:15"), { ...h24, seconds: true, step: 1 });
    expect(columns.map((c) => c.key)).toEqual(["hour", "minute", "second"]);
    expect(columns[1]?.options).toHaveLength(60);
    expect(columns[2]?.options.find((o) => o.selected)?.value).toBe(15);
  });

  test("disables what lies outside min and max", () => {
    const settings = { ...h24, min: "09:30", max: "17:00" };
    const [hours, minutes] = timeColumns(at("09:30"), settings);
    expect(hours?.options[8]?.disabled).toBe(true);
    expect(hours?.options[9]?.disabled).toBe(false);
    expect(hours?.options[17]?.disabled).toBe(false);
    expect(hours?.options[18]?.disabled).toBe(true);
    expect(minutes?.options[5]?.disabled).toBe(true);
    expect(minutes?.options[6]?.disabled).toBe(false);
    const period = timeColumns(at("09:30"), { ...h12, max: "11:00" })[2];
    expect(period?.options.map((o) => o.disabled)).toEqual([false, true]);
  });
});

describe("picks", () => {
  test("sets one part", () => {
    expect(setPart(at("14:30"), "hour", 9, h24)).toEqual(at("09:30"));
    expect(setPart(at("14:30"), "minute", 45, h24)).toEqual(at("14:45"));
    expect(setPart(at("14:30"), "hour", 9, h12)).toEqual(at("21:30"));
    expect(setPart(at("14:30"), "hour", 0, h12)).toEqual(at("12:30"));
    expect(setPart(at("14:30"), "period", 0, h12)).toEqual(at("02:30"));
    expect(setPart(at("02:30"), "period", 1, h12)).toEqual(at("14:30"));
  });

  test("keeps the result inside min and max", () => {
    expect(setPart(at("10:00"), "hour", 9, { ...h24, min: "09:30" })).toEqual(at("09:30"));
    expect(clampTime(at("18:00"), null, "17:00")).toEqual(at("17:00"));
    expect(startTime(h24)).toEqual(at("12:00"));
    expect(startTime({ ...h24, max: "08:00" })).toEqual(at("08:00"));
  });

  test("moves past disabled options", () => {
    const options = timeColumns(at("10:00"), { ...h24, min: "09:00", max: "11:00" })[0]?.options ?? [];
    expect(moveOption(options, 10, "ArrowDown")).toBe(11);
    expect(moveOption(options, 11, "ArrowDown")).toBe(11);
    expect(moveOption(options, 10, "Home")).toBe(9);
    expect(moveOption(options, 10, "End")).toBe(11);
    expect(moveOption(options, 10, "x")).toBeNull();
  });

  test("finds typed numbers and periods", () => {
    const [hours, minutes, period] = timeColumns(at("10:00"), h12);
    expect(matchTyped(hours?.options ?? [], "12")).toBe(0);
    expect(matchTyped(hours?.options ?? [], "7")).toBe(7);
    expect(matchTyped(minutes?.options ?? [], "15")).toBe(3);
    expect(matchTyped(minutes?.options ?? [], "05")).toBe(1);
    expect(matchTyped(minutes?.options ?? [], "7")).toBe(-1);
    expect(matchTyped(period?.options ?? [], "p")).toBe(1);
  });
});
