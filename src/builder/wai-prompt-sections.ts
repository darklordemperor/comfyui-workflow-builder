import type { PromptSections, WaiPromptSections } from "../types/prompt.types.ts";

export const WAI_PROMPT_SECTION_ORDER = ["master", "female", "male", "interactionPose", "background"] as const;

function normalizeTerms(terms: string[]): string[] {
  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))];
}

export function normalizeWaiPromptSections(sections: WaiPromptSections): WaiPromptSections {
  return Object.fromEntries(
    WAI_PROMPT_SECTION_ORDER.map((name) => [name, normalizeTerms(sections[name])]),
  ) as unknown as WaiPromptSections;
}

export function joinWaiPromptSections(sections: WaiPromptSections): string {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const name of WAI_PROMPT_SECTION_ORDER) {
    for (const term of normalizeTerms(sections[name])) {
      if (seen.has(term)) continue;
      seen.add(term);
      terms.push(term);
    }
  }
  return terms.join(", ");
}

export function groupWaiPromptSections(sections: PromptSections): WaiPromptSections {
  return normalizeWaiPromptSections({
    master: [...sections.quality, ...sections.style, ...sections.additionalPositive],
    female: [
      ...sections.subjectCount,
      ...sections.female.identity,
      ...sections.female.appearance,
      ...sections.female.costume,
      ...sections.female.additional,
    ],
    male: sections.males.flatMap((male) => [male.appearance, male.clothing, male.position, male.additional]).flat(),
    interactionPose: [
      ...sections.poseTrigger,
      ...sections.interaction.femaleToMales,
      ...sections.interaction.malesToFemale,
      ...sections.interaction.mainPose,
      ...sections.interaction.spatialComposition,
      ...sections.camera,
    ],
    background: sections.background,
  });
}
