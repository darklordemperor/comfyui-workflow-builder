import type { PromptArrayOverride } from "../types/request.types.ts";

export function applyOverride(base: string[], override: PromptArrayOverride | undefined): string[] {
  if (!override) return [...base];
  let result = override.replace !== undefined ? [...override.replace] : [...base];
  if (override.append?.length) result.push(...override.append);
  if (override.remove?.length) {
    const removed = new Set(override.remove);
    result = result.filter((term) => !removed.has(term));
  }
  return result;
}
