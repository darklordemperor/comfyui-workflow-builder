import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { exampleGenerationRequest } from "../../src/index.ts";
import { createComfyClient } from "../comfy-client.ts";
import { createStore } from "../store.ts";
import { createWorkflowService } from "../workflow-service.ts";

const response = (data: unknown) => ({ ok: true, json: async () => data, text: async () => "" }) as Response;

test("detects the KJNodes prompt node capability", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => response({ StringConstantMultiline: {}, JoinStringMulti: {} })) as typeof fetch;
  try {
    assert.equal(await createComfyClient("http://comfy").hasNodeTypes(["StringConstantMultiline", "JoinStringMulti"]), true);
  } finally { globalThis.fetch = originalFetch; }
});

test("rejects workflow generation when required KJNodes classes are missing", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => response({ CheckpointLoaderSimple: {} })) as typeof fetch;
  try {
    const service = createWorkflowService(createStore(join(process.cwd(), "data")));
    await assert.rejects(service.generate(exampleGenerationRequest), /ComfyUI-KJNodes is required: enable StringConstantMultiline and JoinStringMulti/);
  } finally { globalThis.fetch = originalFetch; }
});

test("explains when ComfyUI cannot be reached to verify KJNodes", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("offline"); }) as typeof fetch;
  try {
    const service = createWorkflowService(createStore(join(process.cwd(), "data")));
    await assert.rejects(service.generate(exampleGenerationRequest), /Connect ComfyUI to verify the required KJNodes prompt nodes/);
  } finally { globalThis.fetch = originalFetch; }
});
