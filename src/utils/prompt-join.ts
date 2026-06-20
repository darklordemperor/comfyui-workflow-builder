export function joinPromptSections(sections: Array<unknown>): string {
  const flat = sections.flat(Infinity);
  const terms = flat.filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return [...new Set(terms.map((term) => term.trim()))].join(", ");
}
