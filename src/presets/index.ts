import type { GenerationRequest } from "../types/request.types.ts";
import type { PresetsRegistry } from "../types/registry.types.ts";
import { swanClairePreset } from "./characters/swan-claire.ts";
import { exampleCouplePosePreset } from "./poses/example-couple.ts";
import { exampleStylePreset } from "./styles/example-style.ts";

export { exampleCouplePosePreset, exampleStylePreset, swanClairePreset };

export const examplePresetsRegistry: PresetsRegistry = {
  characters: { [swanClairePreset.id]: swanClairePreset },
  poses: { [exampleCouplePosePreset.id]: exampleCouplePosePreset },
  styles: { [exampleStylePreset.id]: exampleStylePreset },
};

export const exampleGenerationRequest: GenerationRequest = {
  femaleCharacterPresetId: "swan-claire",
  costumePresetId: "evening",
  stylePresetId: "polished-anime",
  posePresetId: "example-couple",
  maleCount: 1,
  promptOverrides: {
    background: { append: ["grand hotel lobby", "soft evening lighting"] },
    additionalPositive: { append: ["distinct facial identities"] },
  },
  generationParams: {
    seed: 20260620,
  },
};
