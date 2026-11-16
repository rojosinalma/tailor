import { describe, expect, test } from "bun:test";
import { duplicateKeys, isSecretKey, joinPairs, parsePairs, pastedPairs } from "./logic";

describe("pairs as text", () => {
  test("parses KEY=value lines", () => {
    expect(parsePairs("PORT=8080\n# a comment\n\nHOST = web-1\nURL=https://example.com/?a=b\nDEBUG")).toEqual(
      [
        { key: "PORT", value: "8080" },
        { key: "HOST", value: "web-1" },
        { key: "URL", value: "https://example.com/?a=b" },
        { key: "DEBUG", value: "" },
      ],
    );
  });
  test("joins pairs with a key", () => {
    expect(
      joinPairs([
        { key: " PORT ", value: "80" },
        { key: "", value: "lost" },
        { key: "EMPTY", value: "" },
      ]),
    ).toBe("PORT=80\nEMPTY=");
  });
});

describe("checks", () => {
  test("finds the keys used twice", () => {
    const twice = duplicateKeys([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
      { key: "A ", value: "3" },
      { key: "", value: "" },
      { key: "", value: "" },
    ]);
    expect([...twice]).toEqual(["A"]);
  });
  test("secret keys", () => {
    expect(isSecretKey("DB_PASSWORD", ["password", "token"])).toBe(true);
    expect(isSecretKey("api_token", ["PASSWORD", "TOKEN"])).toBe(true);
    expect(isSecretKey("PORT", ["PASSWORD"])).toBe(false);
    expect(isSecretKey("PORT", undefined)).toBe(false);
  });
  test("a paste of lines gives pairs, plain text gives null", () => {
    expect(pastedPairs("A=1\nB=2")).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
    ]);
    expect(pastedPairs("HOST")).toBeNull();
  });
});
