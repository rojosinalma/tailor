import { describe, expect, test } from "bun:test";
import { isEmpty, messageFor, problemOf, readResult, type ValidityLike } from "./logic";

const valid: ValidityLike = {
  valueMissing: false,
  typeMismatch: false,
  badInput: false,
  patternMismatch: false,
  rangeUnderflow: false,
  rangeOverflow: false,
  tooShort: false,
  tooLong: false,
  stepMismatch: false,
};

describe("problemOf", () => {
  test("a valid value has no problem", () => expect(problemOf(valid)).toBeNull());
  test("a missing value comes first", () =>
    expect(problemOf({ ...valid, valueMissing: true, patternMismatch: true })).toBe("required"));
  test("each check", () => {
    expect(problemOf({ ...valid, typeMismatch: true })).toBe("type");
    expect(problemOf({ ...valid, badInput: true })).toBe("type");
    expect(problemOf({ ...valid, rangeUnderflow: true })).toBe("min");
    expect(problemOf({ ...valid, rangeOverflow: true })).toBe("max");
    expect(problemOf({ ...valid, tooShort: true })).toBe("minlength");
    expect(problemOf({ ...valid, tooLong: true })).toBe("maxlength");
    expect(problemOf({ ...valid, patternMismatch: true })).toBe("pattern");
    expect(problemOf({ ...valid, stepMismatch: true })).toBe("step");
  });
});

describe("messageFor", () => {
  test("names the limits", () => {
    expect(messageFor("required")).toBe("This field is required");
    expect(messageFor("min", { min: "1" })).toBe("Enter 1 or more");
    expect(messageFor("max", { max: "65535" })).toBe("Enter 65535 or less");
    expect(messageFor("minlength", { minLength: 3 })).toBe("Enter at least 3 characters");
  });
  test("the type message follows the type", () => {
    expect(messageFor("type", { type: "email" })).toBe("Enter an email address");
    expect(messageFor("type", { type: "url" })).toBe("Enter a web address");
    expect(messageFor("type", { type: "number" })).toBe("Enter a number");
    expect(messageFor("type", { type: "date" })).toBe("This value is not valid");
  });
});

describe("values and results", () => {
  test("empty values", () => {
    for (const value of ["", "  ", null, undefined, false, []]) expect(isEmpty(value)).toBe(true);
    for (const value of ["a", 0, true, ["a"]]) expect(isEmpty(value)).toBe(false);
  });
  test("reads a server answer", () => {
    expect(readResult({ ok: true, message: "Added." })).toEqual({
      ok: true,
      message: "Added.",
      errors: undefined,
    });
    expect(readResult({ ok: false, errors: { name: "Taken.", port: 5 } })).toEqual({
      ok: false,
      message: undefined,
      errors: { name: "Taken." },
    });
    expect(readResult("nope")).toEqual({ ok: false });
    expect(readResult(null)).toEqual({ ok: false });
  });
});
