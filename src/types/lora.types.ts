export interface LoraConfig {
  fileName: string;
  strengthModel: number;
  strengthClip: number;
  trigger: string[];
}

export interface CharacterPreset {
  id: string;
  characterLora: LoraConfig;
  costumes: Record<string, CostumePreset>;
  female: {
    identity: string[];
    appearance: string[];
  };
}

export interface CostumePreset {
  id: string;
  costumeLora?: LoraConfig;
  costume: string[];
}

export interface StylePreset {
  id: string;
  styleLora?: LoraConfig;
  style: string[];
}
