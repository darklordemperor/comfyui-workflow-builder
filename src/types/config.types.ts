import type { NegativePromptSections } from "./prompt.types.ts";

export interface WorkflowDefaults {
  checkpointName: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  sampler: string;
  scheduler: string;
  denoise: number;
  batchSize: number;
  filenamePrefix: string;
}

export interface PromptDefaults {
  defaultMaleAppearance: string[];
  defaultMaleClothing: string[];
  defaultMalePositions: string[];
  quality: string[];
  negative: Omit<NegativePromptSections, "posePreset" | "additionalNegative">;
}
