import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { buildComfyUICanvasWorkflow, buildComfyWorkflow, buildPrompts, previewPromptSections, resolveRequest } from "../src/index.ts";
import type { GenerationRequest, PresetsRegistry } from "../src/index.ts";
import { createComfyClient } from "./comfy-client.ts";

export function createWorkflowService(store: ReturnType<typeof import("./store.ts").createStore>) {
  async function context() {
    const [settings, docs] = await Promise.all([store.readSettings(), store.readPresetDocuments()]);
    const registry: PresetsRegistry = { characters: docs.characters.records, styles: docs.styles.records, poses: docs.poses.records };
    return { settings, docs, registry };
  }
  async function generate(request: GenerationRequest) {
    const { settings, registry } = await context();
    const resolved = resolveRequest(request, registry);
    const built = buildComfyWorkflow({ builtPrompts: buildPrompts(resolved), waiSections: resolved.waiSections, loraStack: resolved.loraStack, posePreset: resolved.resolvedPosePreset, request, defaults: { checkpointName: settings.checkpointName, ...settings.generationDefaults, denoise: 1, batchSize: 1, filenamePrefix: settings.filenamePrefix } });
    return { preview: previewPromptSections(request, registry), api: built.workflow, canvas: buildComfyUICanvasWorkflow(built) };
  }
  return {
    context, generate,
    async bootstrap() {
      const { settings, docs } = await context(); const client = createComfyClient(settings.comfyUrl); const connection = await client.health();
      const models = connection.connected ? await client.getModels() : { checkpoints: [], loras: [], controlnets: [] };
      let inputImages: string[] = []; try { inputImages = (await readdir(join(settings.comfyRoot, "input"))).filter((name) => /\.(png|jpe?g|webp)$/i.test(name)); } catch {}
      return { settings, presets: docs, connection, models, inputImages };
    },
    async save(request: GenerationRequest) {
      const { settings } = await context(); const result = await generate(request);
      const path = join(settings.comfyRoot, "user/default/workflows", settings.workflowFileName);
      await store.writeJsonAtomic(path, result.canvas); await store.writeJsonAtomic(store.resolveWorkflowPath(settings.workflowFileName), result.canvas);
      return { path };
    },
    async queue(request: GenerationRequest) { const { settings } = await context(); const result = await generate(request); return createComfyClient(settings.comfyUrl).queue(result.api); },
  };
}
