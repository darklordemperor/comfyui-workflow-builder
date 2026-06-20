import type { CharacterPreset, StylePreset } from "./lora.types.ts";
import type { PosePreset } from "./pose.types.ts";
import type { GenerationRequest } from "./request.types.ts";

export interface AppSettings {
  version: 1;
  comfyUrl: string;
  comfyRoot: string;
  checkpointName: string;
  workflowFileName: string;
  filenamePrefix: string;
  generationDefaults: { width: number; height: number; steps: number; cfg: number; sampler: string; scheduler: string };
}
export interface PresetDocument<T> { version: 1; records: Record<string, T> }
export interface PresetDocuments {
  characters: PresetDocument<CharacterPreset>;
  styles: PresetDocument<StylePreset>;
  poses: PresetDocument<PosePreset>;
}
export interface ModelCatalog { checkpoints: string[]; loras: string[]; controlnets: string[] }
export interface BootstrapPayload {
  settings: AppSettings;
  presets: PresetDocuments;
  connection: { connected: boolean; message: string };
  models: ModelCatalog;
  inputImages: string[];
}
export interface WorkflowActionRequest { request: GenerationRequest }
