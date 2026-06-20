import { DEFAULT_WORKFLOW_DEFAULTS } from "../config/defaults.ts";
import type { WorkflowDefaults } from "../types/config.types.ts";
import type { LoraConfig } from "../types/lora.types.ts";
import type { PosePreset } from "../types/pose.types.ts";
import type { BuiltPrompts, WaiPromptSections } from "../types/prompt.types.ts";
import { joinPromptSections } from "../utils/prompt-join.ts";
import type { GenerationRequest } from "../types/request.types.ts";
import type { BuiltWorkflow, ComfyNode, ComfyNodeInput, ComfyNodeReference } from "../types/workflow.types.ts";

class NodeBuilder {
  private readonly nodes: Record<string, ComfyNode> = {};
  private readonly nodeMap: Record<string, string> = {};
  private counter = 1;

  add(logicalName: string, classType: string, inputs: ComfyNodeInput): string {
    if (this.nodeMap[logicalName]) throw new Error(`Duplicate logical node name: ${logicalName}`);
    const id = String(this.counter++);
    this.nodes[id] = { class_type: classType, inputs };
    this.nodeMap[logicalName] = id;
    return id;
  }

  ref(logicalName: string, slot = 0): ComfyNodeReference {
    const id = this.nodeMap[logicalName];
    if (!id) throw new Error(`Node not found: ${logicalName}`);
    return [id, slot];
  }

  build(): BuiltWorkflow {
    return { workflow: { prompt: this.nodes }, nodeMap: this.nodeMap };
  }
}

export function buildComfyWorkflow({
  builtPrompts,
  waiSections,
  loraStack,
  posePreset,
  request,
  defaults = DEFAULT_WORKFLOW_DEFAULTS,
}: {
  builtPrompts: BuiltPrompts;
  waiSections: WaiPromptSections;
  loraStack: LoraConfig[];
  posePreset: PosePreset;
  request: GenerationRequest;
  defaults?: WorkflowDefaults;
}): BuiltWorkflow {
  const nodes = new NodeBuilder();
  nodes.add("checkpoint", "CheckpointLoaderSimple", { ckpt_name: defaults.checkpointName });
  let modelRef = nodes.ref("checkpoint", 0);
  let clipRef = nodes.ref("checkpoint", 1);
  loraStack.forEach((lora, index) => {
    const name = `lora_${index}`;
    nodes.add(name, "LoraLoader", {
      model: modelRef,
      clip: clipRef,
      lora_name: lora.fileName,
      strength_model: lora.strengthModel,
      strength_clip: lora.strengthClip,
    });
    modelRef = nodes.ref(name, 0);
    clipRef = nodes.ref(name, 1);
  });
  const promptSections = [
    ["prompt_master", waiSections.master],
    ["prompt_female", waiSections.female],
    ["prompt_male", waiSections.male],
    ["prompt_interaction_pose", waiSections.interactionPose],
    ["prompt_background", waiSections.background],
  ] as const;
  for (const [name, terms] of promptSections) {
    nodes.add(name, "StringConstantMultiline", { string: joinPromptSections([terms]), strip_newlines: true });
  }
  nodes.add("prompt_join", "JoinStringMulti", {
    inputcount: 5,
    string_1: nodes.ref("prompt_master"),
    delimiter: ", ",
    return_list: false,
    string_2: nodes.ref("prompt_female"),
    string_3: nodes.ref("prompt_male"),
    string_4: nodes.ref("prompt_interaction_pose"),
    string_5: nodes.ref("prompt_background"),
  });
  nodes.add("positive_clip", "CLIPTextEncode", { text: nodes.ref("prompt_join"), clip: clipRef });
  nodes.add("negative_clip", "CLIPTextEncode", { text: builtPrompts.negative, clip: clipRef });
  nodes.add("empty_latent", "EmptyLatentImage", {
    width: request.generationParams?.width ?? defaults.width,
    height: request.generationParams?.height ?? defaults.height,
    batch_size: defaults.batchSize,
  });

  let positiveRef = nodes.ref("positive_clip", 0);
  let negativeRef = nodes.ref("negative_clip", 0);
  const openPose = posePreset.openPose;
  if (openPose?.enabled) {
    nodes.add("pose_reference_image", "LoadImage", { image: openPose.referenceImagePath, upload: "image" });
    let controlImageRef = nodes.ref("pose_reference_image", 0);
    if (openPose.preprocessorMode !== "bypass") {
      nodes.add("pose_preprocessor", "AIO_Preprocessor", {
        image: controlImageRef,
        preprocessor: openPose.preprocessor === "dwpose" ? "DWPreprocessor" : "OpenposePreprocessor",
        resolution: openPose.resolution ?? 512,
      });
      controlImageRef = nodes.ref("pose_preprocessor", 0);
    }
    nodes.add("preprocessor_preview", "PreviewImage", { images: controlImageRef });
    nodes.add("controlnet_loader", "ControlNetLoader", { control_net_name: openPose.controlNetModel });
    nodes.add("controlnet_apply", "ControlNetApplyAdvanced", {
      positive: positiveRef,
      negative: negativeRef,
      control_net: nodes.ref("controlnet_loader", 0),
      image: controlImageRef,
      strength: openPose.strength,
      start_percent: openPose.startPercent,
      end_percent: openPose.endPercent,
    });
    positiveRef = nodes.ref("controlnet_apply", 0);
    negativeRef = nodes.ref("controlnet_apply", 1);
  }

  nodes.add("ksampler", "KSampler", {
    model: modelRef,
    positive: positiveRef,
    negative: negativeRef,
    latent_image: nodes.ref("empty_latent", 0),
    seed: request.generationParams?.seed ?? Math.floor(Math.random() * 4_294_967_295),
    steps: request.generationParams?.steps ?? defaults.steps,
    cfg: request.generationParams?.cfg ?? defaults.cfg,
    sampler_name: request.generationParams?.sampler ?? defaults.sampler,
    scheduler: request.generationParams?.scheduler ?? defaults.scheduler,
    denoise: defaults.denoise,
  });
  nodes.add("vae_decode", "VAEDecode", { samples: nodes.ref("ksampler", 0), vae: nodes.ref("checkpoint", 2) });
  nodes.add("output_preview", "PreviewImage", { images: nodes.ref("vae_decode", 0) });
  nodes.add("save_image", "SaveImage", { images: nodes.ref("vae_decode", 0), filename_prefix: defaults.filenamePrefix });
  return nodes.build();
}
