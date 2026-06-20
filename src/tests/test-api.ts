import assert from "node:assert/strict";
import { describe, test } from "node:test";

type Matcher = {
  not: Matcher;
  toBe(expected: unknown): void;
  toBeDefined(): void;
  toBeGreaterThan(expected: number): void;
  toBeUndefined(): void;
  toContain(expected: unknown): void;
  toEqual(expected: unknown): void;
  toHaveLength(expected: number): void;
  toMatch(expected: RegExp): void;
  toThrow(expected?: string | RegExp): void;
};

function makeMatcher(actual: unknown, inverted = false): Matcher {
  const check = (condition: boolean, message: string) => {
    if (inverted ? condition : !condition) throw new assert.AssertionError({ message });
  };
  const matcher: Omit<Matcher, "not"> & { not?: Matcher } = {
    toBe: (expected) => check(Object.is(actual, expected), `Expected ${String(actual)} to${inverted ? " not" : ""} be ${String(expected)}`),
    toBeDefined: () => check(actual !== undefined, `Expected value to${inverted ? " not" : ""} be defined`),
    toBeGreaterThan: (expected) => check(typeof actual === "number" && actual > expected, `Expected ${String(actual)} to${inverted ? " not" : ""} be greater than ${expected}`),
    toBeUndefined: () => check(actual === undefined, `Expected value to${inverted ? " not" : ""} be undefined`),
    toContain: (expected) => check(Array.isArray(actual) ? actual.includes(expected) : typeof actual === "string" && actual.includes(String(expected)), `Expected value to${inverted ? " not" : ""} contain ${String(expected)}`),
    toEqual: (expected) => {
      let equal = true;
      try { assert.deepEqual(actual, expected); } catch { equal = false; }
      check(equal, `Expected values to${inverted ? " not" : ""} be deeply equal`);
    },
    toHaveLength: (expected) => check(actual != null && typeof (actual as { length?: unknown }).length === "number" && (actual as { length: number }).length === expected, `Expected length to${inverted ? " not" : ""} be ${expected}`),
    toMatch: (expected) => check(typeof actual === "string" && expected.test(actual), `Expected value to${inverted ? " not" : ""} match ${expected}`),
    toThrow: (expected) => {
      let thrown: unknown;
      try { (actual as () => unknown)(); } catch (error) { thrown = error; }
      const message = thrown instanceof Error ? thrown.message : String(thrown ?? "");
      const matches = thrown !== undefined && (expected === undefined || (typeof expected === "string" ? message.includes(expected) : expected.test(message)));
      check(matches, `Expected function to${inverted ? " not" : ""} throw ${String(expected ?? "")}`);
    },
  };
  Object.defineProperty(matcher, "not", {
    get: () => makeMatcher(actual, !inverted),
  });
  return matcher as Matcher;
}

type It = typeof test & {
  each(cases: ReadonlyArray<ReadonlyArray<unknown>>): (name: string, fn: (...args: any[]) => unknown) => void;
};

export const it = test as It;
it.each = (cases) => (name, fn) => {
  for (const values of cases) test(name.replace(/%[is]/, String(values[0])), () => fn(...values));
};

export { describe };
export const expect = (actual: unknown): Matcher => makeMatcher(actual);
