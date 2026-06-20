import type { LoraConfig } from "./lora.types.ts";

export type OpenPosePreprocessorMode =
  | "full"
  | "body_only"
  | "face_only"
  | "hand_only"
  | "body_face"
  | "body_hand"
  | "bypass";

export interface OpenPoseConfig {
  enabled: boolean;
  referenceImagePath: string;
  preprocessor: "openpose" | "dwpose";
  preprocessorMode: OpenPosePreprocessorMode;
  showPreprocessorPreview: boolean;
  resolution?: number;
  controlNetModel: string;
  strength: number;
  startPercent: number;
  endPercent: number;
}

export interface PosePreset {
  id: string;
  subjectLayout: {
    femaleCount: number;
    maleCount: number;
    totalSubjects: number;
  };
  poseLora: LoraConfig;
  interaction: {
    femaleToMales: string[];
    malesToFemale: string[];
    mainPose: string[];
    spatialComposition: string[];
  };
  camera: string[];
  negativePrompt: string[];
  openPose?: OpenPoseConfig;
}
