export const makeRegistry = () => ({
  characters: {
    claire: {
      id: "claire",
      characterLora: {
        fileName: "claire.safetensors",
        strengthModel: 0.8,
        strengthClip: 0.8,
        trigger: ["claire_trigger"],
      },
      costumes: {
        formal: {
          id: "formal",
          costumeLora: {
            fileName: "formal.safetensors",
            strengthModel: 0.7,
            strengthClip: 0.7,
            trigger: ["formal_trigger"],
          },
          costume: ["white dress"],
        },
      },
      female: {
        identity: ["Claire"],
        appearance: ["silver hair", "red eyes"],
      },
    },
  },
  styles: {
    anime: {
      id: "anime",
      styleLora: {
        fileName: "anime.safetensors",
        strengthModel: 0.5,
        strengthClip: 0.5,
        trigger: ["anime_trigger"],
      },
      style: ["anime illustration"],
    },
    ink: { id: "ink", style: ["ink drawing"] },
  },
  poses: {
    couple: {
      id: "couple",
      subjectLayout: { femaleCount: 1, maleCount: 1, totalSubjects: 2 },
      poseLora: {
        fileName: "couple.safetensors",
        strengthModel: 0.9,
        strengthClip: 0.9,
        trigger: ["couple_pose"],
      },
      interaction: {
        femaleToMales: ["woman holding male-1 hand"],
        malesToFemale: ["male-1 facing woman"],
        mainPose: ["standing together"],
        spatialComposition: ["close composition"],
      },
      camera: ["medium shot"],
      negativePrompt: ["incorrect pose"],
    },
    trio: {
      id: "trio",
      subjectLayout: { femaleCount: 1, maleCount: 2, totalSubjects: 3 },
      poseLora: {
        fileName: "trio.safetensors",
        strengthModel: 0.85,
        strengthClip: 0.85,
        trigger: ["trio_pose"],
      },
      interaction: {
        femaleToMales: ["woman between both men"],
        malesToFemale: ["male-1 and male-2 facing woman"],
        mainPose: ["group standing"],
        spatialComposition: ["balanced trio"],
      },
      camera: ["wide shot"],
      negativePrompt: ["incorrect trio pose"],
    },
  },
});

export const makeRequest = (overrides: Record<string, unknown> = {}) => ({
  femaleCharacterPresetId: "claire",
  costumePresetId: "formal",
  stylePresetId: "anime",
  posePresetId: "couple",
  maleCount: 1,
  ...overrides,
});

export const withOpenPose = (mode = "full", preview = true, preprocessor = "dwpose", resolution = 512) => {
  const registry = makeRegistry();
  return {
    ...registry,
    poses: {
      ...registry.poses,
      couple: {
        ...registry.poses.couple,
        openPose: {
          enabled: true,
          referenceImagePath: "pose.png",
          preprocessor,
          preprocessorMode: mode,
          showPreprocessorPreview: preview,
          resolution,
          controlNetModel: "controlnet.safetensors",
          strength: 0.8,
          startPercent: 0,
          endPercent: 0.75,
        },
      },
    },
  };
};
