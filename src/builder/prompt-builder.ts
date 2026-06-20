import type { BuiltPrompts, NegativePromptSections, WaiPromptSections } from "../types/prompt.types.ts";
import { joinPromptSections } from "../utils/prompt-join.ts";
import { joinWaiPromptSections } from "./wai-prompt-sections.ts";

export function buildPrompts({ waiSections, negativeSections }: { waiSections: WaiPromptSections; negativeSections: NegativePromptSections }): BuiltPrompts {
  return {
    positive: joinWaiPromptSections(waiSections),
    negative: joinPromptSections([
      negativeSections.quality,
      negativeSections.anatomy,
      negativeSections.subjectCount,
      negativeSections.identityLeakage,
      negativeSections.maleSpecific,
      negativeSections.interaction,
      negativeSections.posePreset,
      negativeSections.additionalNegative,
    ]),
  };
}
