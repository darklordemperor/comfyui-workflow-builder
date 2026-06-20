import { describe, expect, it } from "./test-api.ts";
import { buildComfyUICanvasWorkflow, buildComfyWorkflow, buildPrompts, exampleGenerationRequest, examplePresetsRegistry, resolveRequest, type AppSettings } from "../index.ts";
import { makeRegistry, makeRequest, withOpenPose } from "./fixtures.ts";

const build = (registry = makeRegistry(), request = makeRequest()) => {
  const resolved = resolveRequest(request, registry);
  return buildComfyWorkflow({ builtPrompts: buildPrompts(resolved), waiSections: resolved.waiSections, loraStack: resolved.loraStack, posePreset: resolved.resolvedPosePreset, request });
};

const nodesByType = (built: ReturnType<typeof build>, type: string) =>
  Object.entries(built.workflow.prompt).filter(([, node]) => node.class_type === type);

describe("ComfyUI workflow", () => {
  it("exposes versioned application settings", () => {
    const settings: AppSettings = {
      version: 1,
      comfyUrl: "http://127.0.0.1:8188",
      comfyRoot: "/Volumes/MacOSExternalNVME1/ComfyUI",
      checkpointName: "wai-illustrious-xl-v17.safetensors",
      workflowFileName: "Agent Modular Workflow.json",
      filenamePrefix: "output",
      generationDefaults: { width: 1024, height: 1024, steps: 28, cfg: 6, sampler: "dpmpp_2m", scheduler: "karras" },
    };
    expect(structuredClone(settings)).toEqual(settings);
  });

  it("builds an API-ready graph from the public example registry", () => {
    const resolved = resolveRequest(exampleGenerationRequest, examplePresetsRegistry);
    const built = buildComfyWorkflow({ builtPrompts: buildPrompts(resolved), waiSections: resolved.waiSections, loraStack: resolved.loraStack, posePreset: resolved.resolvedPosePreset, request: exampleGenerationRequest });
    expect(Object.keys(built.workflow.prompt).length).toBeGreaterThan(10);
  });

  it("converts the API graph into an editor-loadable canvas workflow", () => {
    const api = build();
    const canvas = buildComfyUICanvasWorkflow(api);
    expect(canvas.version).toBe(0.4);
    expect(canvas.nodes).toHaveLength(Object.keys(api.workflow.prompt).length);
    expect(canvas.links.length).toBeGreaterThan(0);
    expect(canvas.nodes.find((node) => node.type === "CheckpointLoaderSimple")?.widgets_values).toEqual(["wai-illustrious-xl-v17.safetensors"]);
    expect(canvas.nodes.find((node) => node.type === "KSampler")?.inputs.filter((input) => input.link !== null)).toHaveLength(4);
  });

  it("lays out canvas nodes without overlapping rectangles", () => {
    const canvas = buildComfyUICanvasWorkflow(build());
    for (let leftIndex = 0; leftIndex < canvas.nodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < canvas.nodes.length; rightIndex += 1) {
        const left = canvas.nodes[leftIndex]!;
        const right = canvas.nodes[rightIndex]!;
        const overlaps = left.pos[0] < right.pos[0] + right.size[0]
          && left.pos[0] + left.size[0] > right.pos[0]
          && left.pos[1] < right.pos[1] + right.size[1]
          && left.pos[1] + left.size[1] > right.pos[1];
        expect(overlaps).toBe(false);
      }
    }
  });

  it("loads the configured checkpoint", () => {
    expect(nodesByType(build(), "CheckpointLoaderSimple")[0]?.[1].inputs.ckpt_name).toBe("wai-illustrious-xl-v17.safetensors");
  });

  it("chains character, costume, style, then pose LoRAs", () => {
    const built = build();
    const loras = nodesByType(built, "LoraLoader");
    expect(loras.map(([, node]) => node.inputs.lora_name)).toEqual(["claire.safetensors", "formal.safetensors", "anime.safetensors", "couple.safetensors"]);
    expect(loras[1]?.[1].inputs.model).toEqual([loras[0]?.[0], 0]);
    expect(built.workflow.prompt[built.nodeMap.ksampler!]?.inputs.model).toEqual([loras[3]?.[0], 0]);
  });

  it("creates exactly three chained LoRA nodes when style has no LoRA", () => {
    const built = build(makeRegistry(), makeRequest({ stylePresetId: "ink" }));
    expect(nodesByType(built, "LoraLoader")).toHaveLength(3);
  });

  it("encodes the complete positive and negative prompts", () => {
    const resolved = resolveRequest(makeRequest(), makeRegistry());
    const prompts = buildPrompts(resolved);
    const built = build();
    expect(built.workflow.prompt[built.nodeMap.positive_clip!]?.inputs.text).toEqual([built.nodeMap.prompt_join, 0]);
    expect(prompts.positive).toBe(buildPrompts(resolved).positive);
    expect(built.workflow.prompt[built.nodeMap.negative_clip!]?.inputs.text).toBe(prompts.negative);
  });

  it("builds the positive prompt from five KJNodes sections", () => {
    const built = build();
    expect(nodesByType(built, "StringConstantMultiline")).toHaveLength(5);
    expect(nodesByType(built, "JoinStringMulti")).toHaveLength(1);
    const join = built.workflow.prompt[built.nodeMap.prompt_join!];
    expect(join?.inputs.inputcount).toBe(5);
    expect(join?.inputs.delimiter).toBe(", ");
    expect(join?.inputs.return_list).toBe(false);
    expect(join?.inputs.string_1).toEqual([built.nodeMap.prompt_master, 0]);
    expect(join?.inputs.string_5).toEqual([built.nodeMap.prompt_background, 0]);
    expect(built.workflow.prompt[built.nodeMap.positive_clip!]?.inputs.text).toEqual([built.nodeMap.prompt_join, 0]);
  });

  it("renders titled KJNodes prompt sections on the canvas", () => {
    const canvas = buildComfyUICanvasWorkflow(build());
    const sectionNodes = canvas.nodes.filter((node) => node.type === "StringConstantMultiline");
    expect(sectionNodes.map((node) => node.title)).toEqual([
      "1 · Master / Quality",
      "2 · Female Character",
      "3 · Male Character",
      "4 · Interaction / Pose",
      "5 · Background / Environment",
    ]);
    expect(canvas.nodes.find((node) => node.type === "JoinStringMulti")?.title).toBe("Join WAI Prompt");
  });

  it("omits all pose-control nodes when OpenPose is disabled", () => {
    const built = build();
    expect(nodesByType(built, "LoadImage")).toHaveLength(0);
    expect(nodesByType(built, "ControlNetLoader")).toHaveLength(0);
    expect(nodesByType(built, "ControlNetApplyAdvanced")).toHaveLength(0);
  });

  it("adds OpenPose and ControlNet nodes when enabled", () => {
    const built = build(withOpenPose());
    expect(nodesByType(built, "LoadImage")).toHaveLength(1);
    expect(nodesByType(built, "DWPreprocessor")).toHaveLength(1);
    expect(nodesByType(built, "ControlNetLoader")).toHaveLength(1);
    expect(nodesByType(built, "ControlNetApplyAdvanced")).toHaveLength(1);
  });

  it("bypasses preprocessing and uses the loaded image", () => {
    const built = build(withOpenPose("bypass"));
    expect(nodesByType(built, "DWPreprocessor")).toHaveLength(0);
    const apply = nodesByType(built, "ControlNetApplyAdvanced")[0]?.[1];
    expect(apply?.inputs.image).toEqual([built.nodeMap.pose_reference_image, 0]);
  });

  it.each([
    ["full", ["enable", "enable", "enable"]],
    ["body_only", ["enable", "disable", "disable"]],
    ["face_only", ["disable", "enable", "disable"]],
  ])("maps %s preprocessor flags", (mode, expected) => {
    const node = nodesByType(build(withOpenPose(mode)), "DWPreprocessor")[0]?.[1];
    expect([node?.inputs.detect_body, node?.inputs.detect_face, node?.inputs.detect_hand]).toEqual(expected);
  });

  it("adds only the optional preprocessor preview when requested", () => {
    const without = build(withOpenPose("full", false));
    const withPreview = build(withOpenPose("full", true));
    expect(without.nodeMap.preprocessor_preview).toBeUndefined();
    expect(withPreview.workflow.prompt[withPreview.nodeMap.preprocessor_preview!]?.inputs.images).toEqual([withPreview.nodeMap.pose_preprocessor, 0]);
  });

  it("always previews and saves the decoded output", () => {
    const built = build();
    const decoded = [built.nodeMap.vae_decode, 0];
    expect(built.workflow.prompt[built.nodeMap.output_preview!]?.inputs.images).toEqual(decoded);
    expect(built.workflow.prompt[built.nodeMap.save_image!]?.inputs.images).toEqual(decoded);
  });

  it("routes both ControlNet conditioning outputs to KSampler", () => {
    const built = build(withOpenPose());
    const sampler = built.workflow.prompt[built.nodeMap.ksampler!];
    expect(sampler?.inputs.positive).toEqual([built.nodeMap.controlnet_apply, 0]);
    expect(sampler?.inputs.negative).toEqual([built.nodeMap.controlnet_apply, 1]);
  });

  it("uses the supplied generation defaults", () => {
    const sampler = build().workflow.prompt[build().nodeMap.ksampler!];
    expect({ steps: sampler?.inputs.steps, cfg: sampler?.inputs.cfg, sampler: sampler?.inputs.sampler_name, scheduler: sampler?.inputs.scheduler, denoise: sampler?.inputs.denoise }).toEqual({ steps: 28, cfg: 6, sampler: "dpmpp_2m", scheduler: "karras", denoise: 1 });
  });

  it("maps logical names to sequential IDs and valid references", () => {
    const built = build(withOpenPose("full", true));
    const ids = Object.keys(built.workflow.prompt);
    expect(ids).toEqual(ids.map((_, index) => String(index + 1)));
    expect(built.nodeMap.checkpoint).toBe("1");
    for (const node of Object.values(built.workflow.prompt)) {
      for (const value of Object.values(node.inputs)) {
        if (Array.isArray(value)) expect(built.workflow.prompt[value[0]]).toBeDefined();
      }
    }
  });
});
