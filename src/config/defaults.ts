import type { PromptDefaults, WorkflowDefaults } from "../types/config.types.ts";

export const DEFAULT_WORKFLOW_DEFAULTS: Readonly<WorkflowDefaults> = Object.freeze({
  checkpointName: "wai-illustrious-xl-v17.safetensors",
  width: 1024,
  height: 1024,
  steps: 28,
  cfg: 6,
  sampler: "dpmpp_2m",
  scheduler: "karras",
  denoise: 1,
  batchSize: 1,
  filenamePrefix: "output",
});

export const DEFAULT_PROMPT_DEFAULTS: Readonly<PromptDefaults> = Object.freeze({
  defaultMaleAppearance: ["bald man", "generic male appearance"],
  defaultMaleClothing: ["plain black formal clothing"],
  defaultMalePositions: ["left of woman", "right of woman", "centered behind woman"],
  quality: ["masterpiece", "best quality", "very aesthetic", "absurdres"],
  negative: {
    quality: ["worst quality", "low quality", "low resolution", "blurry"],
    anatomy: ["bad anatomy", "bad hands", "extra arms", "extra legs", "extra fingers", "fused fingers", "missing fingers", "disconnected limbs", "merged bodies"],
    subjectCount: ["extra person", "duplicate person", "incorrect number of people"],
    identityLeakage: ["male character with silver hair", "male character with red eyes", "male character wearing the woman's costume", "female character bald", "swapped faces", "swapped clothing", "identical characters", "twins"],
    maleSpecific: ["detailed male face", "female body on male character", "feminine male body"],
    interaction: ["hands not touching", "incorrect hand contact", "wrong arm ownership", "crossed limbs", "merged hands"],
  },
});
