export interface PromptSections {
  subjectCount: string[];
  female: {
    identity: string[];
    appearance: string[];
    costume: string[];
    additional: string[];
  };
  males: MalePromptSection[];
  poseTrigger: string[];
  interaction: {
    femaleToMales: string[];
    malesToFemale: string[];
    mainPose: string[];
    spatialComposition: string[];
  };
  camera: string[];
  background: string[];
  style: string[];
  quality: string[];
  additionalPositive: string[];
}

export interface WaiPromptSections {
  master: string[];
  female: string[];
  male: string[];
  interactionPose: string[];
  background: string[];
}

export interface MalePromptSection {
  id: string;
  label?: string;
  appearance: string[];
  clothing: string[];
  position: string[];
  additional: string[];
}

export interface NegativePromptSections {
  quality: string[];
  anatomy: string[];
  subjectCount: string[];
  identityLeakage: string[];
  maleSpecific: string[];
  interaction: string[];
  posePreset: string[];
  additionalNegative: string[];
}

export interface BuiltPrompts {
  positive: string;
  negative: string;
}

export interface SectionPreview {
  sectionName: string;
  terms: string[];
}
