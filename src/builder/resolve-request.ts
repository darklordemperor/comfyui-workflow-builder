import { DEFAULT_PROMPT_DEFAULTS } from "../config/defaults.ts";
import type { PromptDefaults } from "../types/config.types.ts";
import type { LoraConfig } from "../types/lora.types.ts";
import type { NegativePromptSections, MalePromptSection, PromptSections, WaiPromptSections } from "../types/prompt.types.ts";
import type { GenerationRequest } from "../types/request.types.ts";
import type { PresetsRegistry } from "../types/registry.types.ts";
import { applyOverride } from "../utils/override.ts";
import { generateSubjectCount } from "../utils/subject-count.ts";
import { groupWaiPromptSections, normalizeWaiPromptSections } from "./wai-prompt-sections.ts";

export interface ResolvedRequest {
  sections: PromptSections;
  waiSections: WaiPromptSections;
  negativeSections: NegativePromptSections;
  loraStack: LoraConfig[];
  resolvedPosePreset: PresetsRegistry["poses"][string];
}

function generateDefaultMales(count: number, defaults: PromptDefaults): MalePromptSection[] {
  if (defaults.defaultMalePositions.length === 0) {
    throw new Error("Prompt defaults must define at least one male position");
  }
  return Array.from({ length: count }, (_, index) => ({
    id: `male-${index + 1}`,
    appearance: structuredClone(defaults.defaultMaleAppearance),
    clothing: structuredClone(defaults.defaultMaleClothing),
    position: [defaults.defaultMalePositions[index % defaults.defaultMalePositions.length]!],
    additional: [],
  }));
}

export function resolveRequest(
  request: GenerationRequest,
  presets: PresetsRegistry,
  defaults: PromptDefaults = DEFAULT_PROMPT_DEFAULTS,
): ResolvedRequest {
  const character = presets.characters[request.femaleCharacterPresetId];
  if (!character) throw new Error(`Character preset not found: ${request.femaleCharacterPresetId}`);
  const costume = character.costumes[request.costumePresetId];
  if (!costume) throw new Error(`Costume preset not found: ${request.costumePresetId}`);
  const pose = presets.poses[request.posePresetId];
  if (!pose) throw new Error(`Pose preset not found: ${request.posePresetId}`);
  const style = request.stylePresetId ? presets.styles[request.stylePresetId] : undefined;
  if (request.stylePresetId && !style) throw new Error(`Style preset not found: ${request.stylePresetId}`);
  if (request.maleOverrides && request.maleOverrides.length !== request.maleCount) {
    throw new Error(`maleOverrides must contain exactly ${request.maleCount} entries`);
  }
  const requiredSubjects = request.maleCount + 1;
  if (pose.subjectLayout.totalSubjects !== requiredSubjects || pose.subjectLayout.femaleCount !== 1 || pose.subjectLayout.maleCount !== request.maleCount) {
    throw new Error(`Pose preset "${pose.id}" supports ${pose.subjectLayout.totalSubjects} subjects but the request requires ${requiredSubjects} subjects.`);
  }

  const ov = request.promptOverrides ?? {};
  const males = request.maleOverrides ? structuredClone(request.maleOverrides) : generateDefaultMales(request.maleCount, defaults);
  const loraStack: LoraConfig[] = [
    structuredClone(character.characterLora),
    ...(costume.costumeLora ? [structuredClone(costume.costumeLora)] : []),
    ...(style?.styleLora ? [structuredClone(style.styleLora)] : []),
    structuredClone(pose.poseLora),
  ];

  const sections: PromptSections = {
    subjectCount: generateSubjectCount({ femaleCount: 1, maleCount: request.maleCount }),
    female: {
      identity: [...structuredClone(character.characterLora.trigger), ...structuredClone(costume.costumeLora?.trigger ?? []), ...structuredClone(character.female.identity)],
      appearance: applyOverride(structuredClone(character.female.appearance), ov.femaleAppearance),
      costume: structuredClone(costume.costume),
      additional: applyOverride([], ov.femaleAdditional),
    },
    males,
    poseTrigger: structuredClone(pose.poseLora.trigger),
    interaction: {
      femaleToMales: applyOverride(structuredClone(pose.interaction.femaleToMales), ov.femaleToMales),
      malesToFemale: applyOverride(structuredClone(pose.interaction.malesToFemale), ov.malesToFemale),
      mainPose: applyOverride(structuredClone(pose.interaction.mainPose), ov.mainPose),
      spatialComposition: applyOverride(structuredClone(pose.interaction.spatialComposition), ov.spatialComposition),
    },
    camera: applyOverride(structuredClone(pose.camera), ov.camera),
    background: applyOverride([], ov.background),
    style: applyOverride([...structuredClone(style?.styleLora?.trigger ?? []), ...structuredClone(style?.style ?? [])], ov.style),
    quality: applyOverride(structuredClone(defaults.quality), ov.quality),
    additionalPositive: applyOverride([], ov.additionalPositive),
  };
  const negativeSections: NegativePromptSections = {
    quality: structuredClone(defaults.negative.quality),
    anatomy: structuredClone(defaults.negative.anatomy),
    subjectCount: structuredClone(defaults.negative.subjectCount),
    identityLeakage: structuredClone(defaults.negative.identityLeakage),
    maleSpecific: structuredClone(defaults.negative.maleSpecific),
    interaction: structuredClone(defaults.negative.interaction),
    posePreset: structuredClone(pose.negativePrompt),
    additionalNegative: applyOverride([], ov.additionalNegative),
  };
  const waiSections = request.waiPromptSections
    ? normalizeWaiPromptSections(structuredClone(request.waiPromptSections))
    : groupWaiPromptSections(sections);
  return { sections, waiSections, negativeSections, loraStack, resolvedPosePreset: structuredClone(pose) };
}
