import type { LoraConfig } from "../types/lora.types.ts";
import type { NegativePromptSections, PromptSections, SectionPreview, WaiPromptSections } from "../types/prompt.types.ts";
import type { GenerationRequest } from "../types/request.types.ts";
import type { PresetsRegistry } from "../types/registry.types.ts";
import { buildPrompts } from "./prompt-builder.ts";
import { resolveRequest } from "./resolve-request.ts";

export interface PromptPreview {
  sections: PromptSections;
  waiSections: WaiPromptSections;
  negativeSections: NegativePromptSections;
  loraStack: LoraConfig[];
  positivePrompt: string;
  negativePrompt: string;
  positiveSectionBreakdown: SectionPreview[];
  negativeSectionBreakdown: SectionPreview[];
}

export function previewPromptSections(request: GenerationRequest, presets: PresetsRegistry): PromptPreview {
  const resolved = resolveRequest(request, presets);
  const built = buildPrompts(resolved);
  const { negativeSections, waiSections } = resolved;
  const positiveSectionBreakdown: SectionPreview[] = Object.entries(waiSections).map(([sectionName, terms]) => ({ sectionName, terms }));
  const negativeSectionBreakdown = (Object.keys(negativeSections) as Array<keyof NegativePromptSections>).map((sectionName) => ({ sectionName, terms: negativeSections[sectionName] }));
  return { ...resolved, positivePrompt: built.positive, negativePrompt: built.negative, positiveSectionBreakdown, negativeSectionBreakdown };
}
