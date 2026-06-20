import type { SubjectCountConfig } from "../types/request.types.ts";

export function generateSubjectCount({ femaleCount, maleCount }: SubjectCountConfig): string[] {
  const femaleToken = femaleCount === 1 ? "1woman" : `${femaleCount}women`;
  const maleToken = maleCount === 1 ? "1man" : `${maleCount}men`;
  return [femaleToken, maleToken, `${femaleCount + maleCount}people`];
}
