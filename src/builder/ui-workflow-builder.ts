import type {
  ComfyUICanvasNode,
  ComfyUICanvasWorkflow,
  ComfyUIInputSlot,
  ComfyUILink,
  ComfyUIOutputSlot,
} from "../types/ui-workflow.types.ts";
import type { BuiltWorkflow, ComfyNode } from "../types/workflow.types.ts";

interface SlotSchema {
  name: string;
  type: string;
  widget?: boolean;
  optional?: boolean;
}

interface NodeSchema {
  inputs: SlotSchema[];
  outputs: SlotSchema[];
  size: [number, number];
  packageId?: string;
}

const NODE_SCHEMAS: Record<string, NodeSchema> = {
  CheckpointLoaderSimple: {
    inputs: [{ name: "ckpt_name", type: "COMBO", widget: true }],
    outputs: [{ name: "MODEL", type: "MODEL" }, { name: "CLIP", type: "CLIP" }, { name: "VAE", type: "VAE" }],
    size: [300, 98],
  },
  LoraLoader: {
    inputs: [
      { name: "model", type: "MODEL" },
      { name: "clip", type: "CLIP" },
      { name: "lora_name", type: "COMBO", widget: true },
      { name: "strength_model", type: "FLOAT", widget: true },
      { name: "strength_clip", type: "FLOAT", widget: true },
    ],
    outputs: [{ name: "MODEL", type: "MODEL" }, { name: "CLIP", type: "CLIP" }],
    size: [315, 126],
  },
  CLIPTextEncode: {
    inputs: [{ name: "clip", type: "CLIP" }, { name: "text", type: "STRING", widget: true }],
    outputs: [{ name: "CONDITIONING", type: "CONDITIONING" }],
    size: [420, 220],
  },
  StringConstantMultiline: {
    inputs: [{ name: "string", type: "STRING", widget: true }, { name: "strip_newlines", type: "BOOLEAN", widget: true }],
    outputs: [{ name: "STRING", type: "STRING" }],
    size: [400, 170],
    packageId: "comfyui-kjnodes",
  },
  JoinStringMulti: {
    inputs: [
      { name: "inputcount", type: "INT", widget: true },
      { name: "string_1", type: "STRING" },
      { name: "delimiter", type: "STRING", widget: true },
      { name: "return_list", type: "BOOLEAN", widget: true },
      { name: "string_2", type: "STRING" },
      { name: "string_3", type: "STRING" },
      { name: "string_4", type: "STRING" },
      { name: "string_5", type: "STRING" },
    ],
    outputs: [{ name: "string", type: "STRING" }],
    size: [360, 250],
    packageId: "comfyui-kjnodes",
  },
  EmptyLatentImage: {
    inputs: [
      { name: "width", type: "INT", widget: true },
      { name: "height", type: "INT", widget: true },
      { name: "batch_size", type: "INT", widget: true },
    ],
    outputs: [{ name: "LATENT", type: "LATENT" }],
    size: [315, 106],
  },
  LoadImage: {
    inputs: [{ name: "image", type: "COMBO", widget: true }, { name: "upload", type: "IMAGEUPLOAD", widget: true }],
    outputs: [{ name: "IMAGE", type: "IMAGE" }, { name: "MASK", type: "MASK" }],
    size: [315, 314],
  },
  AIO_Preprocessor: {
    inputs: [
      { name: "image", type: "IMAGE" },
      { name: "preprocessor", type: "COMBO", widget: true },
      { name: "resolution", type: "INT", widget: true },
    ],
    outputs: [{ name: "IMAGE", type: "IMAGE" }],
    size: [315, 110],
    packageId: "comfyui_controlnet_aux",
  },
  PreviewImage: {
    inputs: [{ name: "images", type: "IMAGE" }],
    outputs: [],
    size: [300, 246],
  },
  ControlNetLoader: {
    inputs: [{ name: "control_net_name", type: "COMBO", widget: true }],
    outputs: [{ name: "CONTROL_NET", type: "CONTROL_NET" }],
    size: [330, 58],
  },
  ControlNetApplyAdvanced: {
    inputs: [
      { name: "positive", type: "CONDITIONING" },
      { name: "negative", type: "CONDITIONING" },
      { name: "control_net", type: "CONTROL_NET" },
      { name: "image", type: "IMAGE" },
      { name: "vae", type: "VAE", optional: true },
      { name: "strength", type: "FLOAT", widget: true },
      { name: "start_percent", type: "FLOAT", widget: true },
      { name: "end_percent", type: "FLOAT", widget: true },
    ],
    outputs: [{ name: "positive", type: "CONDITIONING" }, { name: "negative", type: "CONDITIONING" }],
    size: [330, 186],
  },
  KSampler: {
    inputs: [
      { name: "model", type: "MODEL" },
      { name: "positive", type: "CONDITIONING" },
      { name: "negative", type: "CONDITIONING" },
      { name: "latent_image", type: "LATENT" },
      { name: "seed", type: "INT", widget: true },
      { name: "steps", type: "INT", widget: true },
      { name: "cfg", type: "FLOAT", widget: true },
      { name: "sampler_name", type: "COMBO", widget: true },
      { name: "scheduler", type: "COMBO", widget: true },
      { name: "denoise", type: "FLOAT", widget: true },
    ],
    outputs: [{ name: "LATENT", type: "LATENT" }],
    size: [315, 262],
  },
  VAEDecode: {
    inputs: [{ name: "samples", type: "LATENT" }, { name: "vae", type: "VAE" }],
    outputs: [{ name: "IMAGE", type: "IMAGE" }],
    size: [270, 82],
  },
  SaveImage: {
    inputs: [{ name: "images", type: "IMAGE" }, { name: "filename_prefix", type: "STRING", widget: true }],
    outputs: [],
    size: [300, 270],
  },
};

function widgetValues(node: ComfyNode): Array<string | number | boolean> {
  const input = node.inputs;
  switch (node.class_type) {
    case "CheckpointLoaderSimple": return [input.ckpt_name as string];
    case "LoraLoader": return [input.lora_name as string, input.strength_model as number, input.strength_clip as number];
    case "CLIPTextEncode": return typeof input.text === "string" ? [input.text] : [];
    case "StringConstantMultiline": return [input.string as string, input.strip_newlines as boolean];
    case "JoinStringMulti": return [input.inputcount as number, input.delimiter as string, input.return_list as boolean];
    case "EmptyLatentImage": return [input.width as number, input.height as number, input.batch_size as number];
    case "LoadImage": return [input.image as string, input.upload as string];
    case "AIO_Preprocessor": return [input.preprocessor as string, input.resolution as number];
    case "ControlNetLoader": return [input.control_net_name as string];
    case "ControlNetApplyAdvanced": return [input.strength as number, input.start_percent as number, input.end_percent as number];
    case "KSampler": return [
      input.seed as number,
      "fixed",
      input.steps as number,
      input.cfg as number,
      input.sampler_name as string,
      input.scheduler as string,
      input.denoise as number,
    ];
    case "SaveImage": return [input.filename_prefix as string];
    default: return [];
  }
}

function nodePosition(logicalName: string, fallbackIndex: number, downstreamX: number): [number, number] {
  if (logicalName === "checkpoint") return [80, 420];
  if (logicalName.startsWith("lora_")) return [430 + Number(logicalName.slice(5)) * 350, 420];
  const promptPositions: Record<string, [number, number]> = {
    prompt_master: [downstreamX, 20], prompt_female: [downstreamX, 220], prompt_male: [downstreamX, 420],
    prompt_interaction_pose: [downstreamX, 620], prompt_background: [downstreamX, 820], prompt_join: [downstreamX + 450, 370],
  };
  if (promptPositions[logicalName]) return promptPositions[logicalName];
  const pipelineX = downstreamX + 850;
  const positions: Record<string, [number, number]> = {
    positive_clip: [pipelineX, 50], negative_clip: [pipelineX, 330], empty_latent: [pipelineX, 650],
    pose_reference_image: [pipelineX, 850], pose_preprocessor: [pipelineX + 360, 950],
    preprocessor_preview: [pipelineX + 720, 950], controlnet_loader: [pipelineX + 360, 780],
    controlnet_apply: [pipelineX + 720, 480], ksampler: [pipelineX + 1120, 420],
    vae_decode: [pipelineX + 1520, 480], output_preview: [pipelineX + 1880, 260],
    save_image: [pipelineX + 1880, 560],
  };
  return positions[logicalName] ?? [400 + fallbackIndex * 80, 100 + fallbackIndex * 40];
}

export function buildComfyUICanvasWorkflow(built: BuiltWorkflow): ComfyUICanvasWorkflow {
  const logicalById = Object.fromEntries(Object.entries(built.nodeMap).map(([name, id]) => [id, name]));
  const loraCount = Object.keys(built.nodeMap).filter((name) => name.startsWith("lora_")).length;
  const downstreamX = 430 + loraCount * 350;
  const nodes: ComfyUICanvasNode[] = Object.entries(built.workflow.prompt).map(([id, node], index) => {
    const schema = NODE_SCHEMAS[node.class_type];
    if (!schema) throw new Error(`No ComfyUI canvas schema registered for node type: ${node.class_type}`);
    const inputs: ComfyUIInputSlot[] = schema.inputs.map((input) => ({
      localized_name: input.name,
      name: input.name,
      type: input.type,
      ...(input.widget ? { widget: { name: input.name } } : {}),
      ...(input.optional ? { shape: 7 } : {}),
      link: null,
    }));
    const outputs: ComfyUIOutputSlot[] = schema.outputs.map((output) => ({
      localized_name: output.name,
      name: output.name,
      type: output.type,
      links: null,
    }));
    const logicalName = logicalById[id] ?? id;
    const titles: Record<string, string> = {
      prompt_master: "1 · Master / Quality", prompt_female: "2 · Female Character", prompt_male: "3 · Male Character",
      prompt_interaction_pose: "4 · Interaction / Pose", prompt_background: "5 · Background / Environment", prompt_join: "Join WAI Prompt",
      preprocessor_preview: "ControlNet Input Preview", output_preview: "Final Generated Preview",
    };
    return {
      id: Number(id),
      type: node.class_type,
      ...(titles[logicalName] ? { title: titles[logicalName] } : {}),
      pos: nodePosition(logicalName, index, downstreamX),
      size: schema.size,
      flags: {},
      order: index,
      mode: 0,
      inputs,
      outputs,
      properties: {
        cnr_id: schema.packageId ?? "comfy-core",
        ver: "0.24.0",
        "Node name for S&R": node.class_type,
      },
      widgets_values: widgetValues(node),
    };
  });

  const canvasById = new Map(nodes.map((node) => [node.id, node]));
  const links: ComfyUILink[] = [];
  let linkId = 0;
  for (const [targetIdString, apiNode] of Object.entries(built.workflow.prompt)) {
    const targetId = Number(targetIdString);
    const targetNode = canvasById.get(targetId)!;
    const schema = NODE_SCHEMAS[apiNode.class_type]!;
    schema.inputs.forEach((inputSchema, targetSlot) => {
      const value = apiNode.inputs[inputSchema.name];
      if (!Array.isArray(value)) return;
      const sourceId = Number(value[0]);
      const sourceSlot = value[1];
      const sourceNode = canvasById.get(sourceId);
      if (!sourceNode) throw new Error(`Canvas link references missing source node: ${sourceId}`);
      linkId += 1;
      targetNode.inputs[targetSlot]!.link = linkId;
      const sourceOutput = sourceNode.outputs[sourceSlot];
      if (!sourceOutput) throw new Error(`Canvas link references missing output slot ${sourceSlot} on node ${sourceId}`);
      sourceOutput.links ??= [];
      sourceOutput.links.push(linkId);
      links.push([linkId, sourceId, sourceSlot, targetId, targetSlot, inputSchema.type]);
    });
  }

  return {
    id: "aa2d5081-f799-4c32-a668-8bf529ed6d85",
    revision: 0,
    last_node_id: Math.max(...nodes.map((node) => node.id), 0),
    last_link_id: linkId,
    nodes,
    links,
    groups: [],
    config: {},
    extra: { ds: { scale: 0.75, offset: [80, 80] } },
    version: 0.4,
  };
}
