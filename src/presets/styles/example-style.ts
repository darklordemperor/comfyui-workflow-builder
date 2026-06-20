import type { StylePreset } from "../../types/lora.types.ts";

export const exampleStylePreset: StylePreset = {
  id: "polished-anime",
  styleLora: {
    fileName: "polished-anime-style.safetensors",
    strengthModel: 0.55,
    strengthClip: 0.55,
    trigger: ["polished_anime_style"],
  },
  style: ["anime illustration", "precise linework", "balanced color palette"],
};
