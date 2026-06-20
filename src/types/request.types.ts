import type { MalePromptSection, WaiPromptSections } from "./prompt.types.ts";

export interface PromptArrayOverride {
  replace?: string[];
  append?: string[];
  remove?: string[];
}

export interface SubjectCountConfig {
  femaleCount: number;
  maleCount: number;
}

export interface GenerationRequest {
  femaleCharacterPresetId: string;
  costumePresetId: string;
  stylePresetId?: string;
  posePresetId: string;
  maleCount: number;
  maleOverrides?: MalePromptSection[];
  waiPromptSections?: WaiPromptSections;
  promptOverrides?: {
    femaleAppearance?: PromptArrayOverride;
    femaleAdditional?: PromptArrayOverride;
    femaleToMales?: PromptArrayOverride;
    malesToFemale?: PromptArrayOverride;
    mainPose?: PromptArrayOverride;
    spatialComposition?: PromptArrayOverride;
    camera?: PromptArrayOverride;
    background?: PromptArrayOverride;
    style?: PromptArrayOverride;
    quality?: PromptArrayOverride;
    additionalPositive?: PromptArrayOverride;
    additionalNegative?: PromptArrayOverride;
  };
  generationParams?: {
    seed?: number;
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    sampler?: string;
    scheduler?: string;
  };
}
