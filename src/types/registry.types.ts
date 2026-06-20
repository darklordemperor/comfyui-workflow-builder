import type { CharacterPreset, StylePreset } from "./lora.types.ts";
import type { PosePreset } from "./pose.types.ts";

export interface PresetsRegistry {
  characters: Record<string, CharacterPreset>;
  styles: Record<string, StylePreset>;
  poses: Record<string, PosePreset>;
}
