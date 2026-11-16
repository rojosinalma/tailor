import { describe, expect, test } from "bun:test";
import { orderUnits, pickUnit, toAmount, toSeconds, unitBounds } from "./logic";

const all = orderUnits(undefined);

describe("pickUnit", () => {
  test("takes the largest unit with a whole number", () => {
    expect(pickUnit(90, all)).toBe("seconds");
    expect(pickUnit(300, all)).toBe("minutes");
    expect(pickUnit(7200, all)).toBe("hours");
    expect(pickUnit(172800, all)).toBe("days");
    expect(pickUnit(5400, all)).toBe("minutes");
  });
  test("takes the smallest unit for no value and zero", () => {
    expect(pickUnit(null, all)).toBe("seconds");
    expect(pickUnit(0, ["minutes", "hours"])).toBe("minutes");
  });
  test("keeps to the given units", () => {
    expect(pickUnit(86400, ["minutes", "hours"])).toBe("hours");
    expect(pickUnit(90, ["minutes", "hours"])).toBe("minutes");
  });
});

describe("conversions", () => {
  test("amount and seconds", () => {
    expect(toAmount(7200, "hours")).toBe(2);
    expect(toAmount(90, "minutes")).toBe(1.5);
    expect(toAmount(null, "hours")).toBeNull();
    expect(toSeconds(5, "minutes")).toBe(300);
    expect(toSeconds(1.5, "hours")).toBe(5400);
    expect(toSeconds(null, "days")).toBeNull();
  });
  test("bounds in the unit stay inside the limits", () => {
    expect(unitBounds("minutes", 30, 3600)).toEqual({ min: 1, max: 60 });
    expect(unitBounds("hours", undefined, 5400)).toEqual({ min: undefined, max: 1 });
  });
  test("orders and filters the units", () => {
    expect(orderUnits(["days", "minutes", "weeks"])).toEqual(["minutes", "days"]);
    expect(orderUnits([])).toEqual(["seconds", "minutes", "hours", "days"]);
  });
});
