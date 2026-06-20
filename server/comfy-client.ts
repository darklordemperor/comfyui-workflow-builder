import type { ComfyWorkflowJSON } from "../src/types/workflow.types.ts";
import type { ModelCatalog } from "../src/types/app.types.ts";

function combo(info: any, node: string, input: string): string[] {
  const value = info?.[node]?.input?.required?.[input]?.[0];
  return Array.isArray(value) ? value : [];
}
export function createComfyClient(baseUrl: string) {
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`ComfyUI ${response.status}: ${await response.text()}`);
    return response.json();
  };
  return {
    async health() { try { await request("/object_info"); return { connected: true, message: "Connected" }; } catch (error) { return { connected: false, message: error instanceof Error ? error.message : "Disconnected" }; } },
    async getModels(): Promise<ModelCatalog> {
      const info = await request("/object_info");
      return { checkpoints: combo(info, "CheckpointLoaderSimple", "ckpt_name"), loras: combo(info, "LoraLoader", "lora_name"), controlnets: combo(info, "ControlNetLoader", "control_net_name") };
    },
    async hasNodeTypes(names: string[]): Promise<boolean> {
      const info = await request("/object_info");
      return names.every((name) => Boolean(info?.[name]));
    },
    async queue(workflow: ComfyWorkflowJSON) { const result = await request("/prompt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(workflow) }); return { promptId: result.prompt_id as string }; },
  };
}
