import { describe, expect, test } from "bun:test";
import { codeKey, normalizeCode, removeCode, replaceCode, slotFor } from "./logic";

describe("normalize", () => {
  test("keeps digits, or letters and digits", () => {
    expect(normalizeCode(" 12 34-56 ", 6, true)).toBe("123456");
    expect(normalizeCode("1234567", 6, true)).toBe("123456");
    expect(normalizeCode("ab-12", 6, true)).toBe("12");
    expect(normalizeCode("ab-12", 6, false)).toBe("ab12");
  });
});

describe("edit", () => {
  test("types and pastes over the code from a slot", () => {
    expect(replaceCode("12", 2, "3", 6, true)).toBe("123");
    expect(replaceCode("123456", 1, "9", 6, true)).toBe("193456");
    expect(replaceCode("", 0, "123 456", 6, true)).toBe("123456");
    expect(replaceCode("12", 1, "98765", 6, true)).toBe("198765");
    expect(replaceCode("12", 2, "x", 6, true)).toBe("12");
  });

  test("removes without leaving a gap", () => {
    expect(removeCode("1234", 1)).toBe("134");
    expect(removeCode("1234", 9)).toBe("1234");
  });

  test("the focus stops at the first empty slot", () => {
    expect(slotFor("12", 5, 6)).toBe(2);
    expect(slotFor("123456", 9, 6)).toBe(5);
    expect(slotFor("", -1, 6)).toBe(0);
  });
});

describe("keys", () => {
  test("arrows, Home and End move", () => {
    expect(codeKey("123", 1, "ArrowLeft", 6)).toEqual({ code: "123", focus: 0 });
    expect(codeKey("123", 3, "ArrowRight", 6)).toEqual({ code: "123", focus: 3 });
    expect(codeKey("123", 2, "Home", 6)).toEqual({ code: "123", focus: 0 });
    expect(codeKey("123456", 0, "End", 6)).toEqual({ code: "123456", focus: 5 });
  });

  test("Backspace clears the slot, or the one before an empty slot", () => {
    expect(codeKey("123", 3, "Backspace", 6)).toEqual({ code: "12", focus: 2 });
    expect(codeKey("123", 1, "Backspace", 6)).toEqual({ code: "13", focus: 0 });
    expect(codeKey("", 0, "Backspace", 6)).toEqual({ code: "", focus: 0 });
    expect(codeKey("123", 1, "Delete", 6)).toEqual({ code: "13", focus: 1 });
    expect(codeKey("123", 1, "a", 6)).toBeNull();
  });
});
