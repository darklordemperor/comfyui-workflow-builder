import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createStore } from "../store.ts";

test("persists versioned preset documents atomically", async () => {
  const root = await mkdtemp(join(tmpdir(), "workflow-store-"));
  const store = createStore(root);
  const document = { version: 1 as const, records: { claire: { id: "claire", characterLora: { fileName: "c.safetensors", strengthModel: 1, strengthClip: 1, trigger: [] }, costumes: {}, female: { identity: [], appearance: [] } } } };
  await store.writePresetDocument("characters", document);
  assert.deepEqual((await store.readPresetDocuments()).characters, document);
});

test("rejects workflow path traversal", async () => {
  const root = await mkdtemp(join(tmpdir(), "workflow-store-"));
  const store = createStore(root);
  assert.throws(() => store.resolveWorkflowPath("../../escape.json"), /valid workflow filename/);
});
