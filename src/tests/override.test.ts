import { describe, expect, it } from "./test-api.ts";
import { applyOverride, generateSubjectCount, joinPromptSections } from "../index.ts";

describe("prompt utilities", () => {
  it.each([
    [1, ["1woman", "1man", "2people"]],
    [2, ["1woman", "2men", "3people"]],
    [3, ["1woman", "3men", "4people"]],
  ])("generates subject count for %i males", (maleCount, expected) => {
    expect(generateSubjectCount({ femaleCount: 1, maleCount })).toEqual(expected);
  });

  it("applies replace, append, then remove without mutating the base", () => {
    const base = ["a", "b"];
    expect(applyOverride(base, { replace: ["c"], append: ["d"], remove: ["c"] })).toEqual(["d"]);
    expect(base).toEqual(["a", "b"]);
  });

  it("flattens nested arrays, removes blanks, and deduplicates stably", () => {
    expect(joinPromptSections([[" a ", ["", "b"]], "a", null])).toBe("a, b");
  });
});
