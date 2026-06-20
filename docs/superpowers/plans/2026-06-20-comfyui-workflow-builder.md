# ComfyUI Modular Prompt and Workflow Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a strict TypeScript library that composes modular prompts and emits API-ready ComfyUI workflow JSON, including optional OpenPose/ControlNet nodes.

**Architecture:** A standalone package resolves immutable typed presets into prompt sections, assembles ordered deduplicated prompt strings, and feeds them into a sequential node-graph builder. Typed default configuration objects hold all supplied model, prompt, and workflow defaults so domain values are not embedded in builder logic.

**Tech Stack:** TypeScript 5, Vitest, Node.js 20+, npm

---

## File Map

- `comfyui-workflow-builder/src/types/*.ts`: public domain and graph contracts.
- `comfyui-workflow-builder/src/config/defaults.ts`: typed WAI-Illustrious and prompt defaults.
- `comfyui-workflow-builder/src/presets/**/*.ts`: example registries.
- `comfyui-workflow-builder/src/utils/*.ts`: pure subject count, override, and join functions.
- `comfyui-workflow-builder/src/builder/*.ts`: request resolution, prompts, preview, and graph generation.
- `comfyui-workflow-builder/src/tests/*.test.ts`: supplied prompt, override, and workflow behavior.
- `comfyui-workflow-builder/examples/generate-workflow.ts`: executable example.
- `comfyui-workflow-builder/examples/example-workflow.json`: generated result.

### Task 1: Package Scaffold and Public Types

**Files:** Create `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/types/*.ts`, and `src/index.ts`.

- [ ] Write a type-level smoke test importing every public contract from `src/index.ts`.
- [ ] Run `npm test -- src/tests/types.test.ts`; expect failure because exports do not exist.
- [ ] Add strict ESM package configuration and the exact prompt, LoRA, pose, request, registry, defaults, and workflow interfaces from the approved design.
- [ ] Re-run the smoke test and `npm run typecheck`; expect both to pass.

The defaults contract must include:

```ts
export interface WorkflowDefaults {
  checkpointName: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  sampler: string;
  scheduler: string;
  denoise: number;
  batchSize: number;
  filenamePrefix: string;
}

export interface PromptDefaults {
  defaultMaleAppearance: string[];
  defaultMaleClothing: string[];
  defaultMalePositions: string[];
  quality: string[];
  negative: Omit<NegativePromptSections, "posePreset" | "additionalNegative">;
}
```

### Task 2: Pure Utilities

**Files:** Create `src/utils/subject-count.ts`, `src/utils/override.ts`, `src/utils/prompt-join.ts`, and `src/tests/override.test.ts`.

- [ ] Write failing tests for singular/plural count tokens, replace/append/remove ordering, arbitrary nested flattening, blank removal, and stable deduplication.
- [ ] Run `npm test -- src/tests/override.test.ts`; expect missing-module failures.
- [ ] Implement `generateSubjectCount`, `applyOverride`, and `joinPromptSections` as pure functions that never mutate inputs.
- [ ] Re-run the focused tests; expect all to pass.

Core join behavior:

```ts
const flat = sections.flat(Infinity);
const terms = flat.filter((value): value is string =>
  typeof value === "string" && value.trim().length > 0
);
return [...new Set(terms.map((term) => term.trim()))].join(", ");
```

### Task 3: Immutable Request Resolution and Prompt Assembly

**Files:** Create `src/config/defaults.ts`, `src/builder/resolve-request.ts`, `src/builder/prompt-builder.ts`, and `src/tests/prompt.test.ts`.

- [ ] Write failing tests for prompt requirements 1-23, including exact section order, male override validation, preset lookup errors, pose count mismatch, and source-preset immutability.
- [ ] Run `npm test -- src/tests/prompt.test.ts`; expect missing resolver failures.
- [ ] Implement preset lookup and validation before section construction.
- [ ] Implement deterministic default males with IDs `male-1` onward and configured relative positions.
- [ ] Build the character/costume/style/pose LoRA stack in exact order and deep-clone every preset-derived array.
- [ ] Apply overrides independently to their named sections.
- [ ] Implement positive and negative assembly in the required order.
- [ ] Re-run prompt tests; expect all to pass.

Validation must include:

```ts
if (request.maleOverrides && request.maleOverrides.length !== request.maleCount) {
  throw new Error(`maleOverrides must contain exactly ${request.maleCount} entries`);
}
```

### Task 4: Prompt Preview

**Files:** Create `src/builder/preview.ts` and extend `src/tests/prompt.test.ts`.

- [ ] Add a failing test asserting every named positive and negative section appears in the preview with its contributing terms.
- [ ] Run the focused test; expect `previewPromptSections` to be missing.
- [ ] Implement preview by calling `resolveRequest` and `buildPrompts`, then producing stable named breakdown arrays without contacting ComfyUI.
- [ ] Re-run prompt tests; expect all to pass.

### Task 5: Base ComfyUI Graph

**Files:** Create `src/builder/workflow-builder.ts` and `src/tests/workflow.test.ts`.

- [ ] Write failing tests for requirements 24-29, 38-39, and 42-44.
- [ ] Run `npm test -- src/tests/workflow.test.ts`; expect missing builder failure.
- [ ] Implement private `NodeBuilder.add`, `ref`, and `build` with sequential string IDs and logical-name mapping.
- [ ] Add checkpoint, ordered LoRA chain, standard CLIP encoders, latent, KSampler, VAE decode, output preview, and save nodes.
- [ ] Generate a random default seed in the inclusive range 0-4294967294.
- [ ] Re-run workflow tests; expect base graph tests to pass.

Node references must remain tuples:

```ts
type ComfyNodeReference = [string, number];
```

### Task 6: OpenPose and ControlNet Graph

**Files:** Modify `src/builder/workflow-builder.ts` and `src/tests/workflow.test.ts`.

- [ ] Write failing tests for requirements 30-37 and 40-41 across disabled, bypass, full, body-only, and face-only modes.
- [ ] Run focused tests; expect missing conditional nodes or incorrect conditioning references.
- [ ] Implement explicit detect-flag mapping for all six processed modes.
- [ ] Add optional reference load, preprocessor, preview, ControlNet loader, and `ControlNetApplyAdvanced` nodes.
- [ ] Wire bypass directly from `LoadImage`; otherwise wire preprocessor output.
- [ ] Route ControlNet positive slot 0 and negative slot 1 to KSampler.
- [ ] Re-run workflow tests; expect all to pass.

### Task 7: Example Presets, Exports, and Visible Result

**Files:** Create `src/presets/characters/swan-claire.ts`, `src/presets/poses/example-couple.ts`, `src/presets/styles/example-style.ts`, `src/presets/index.ts`, `examples/generate-workflow.ts`, `README.md`, and generated `examples/example-workflow.json`.

- [ ] Add a failing integration test that resolves the example registry and validates every graph reference.
- [ ] Run the integration test; expect missing presets.
- [ ] Add typed example presets using placeholder filenames that users can replace with their installed LoRAs and ControlNet model.
- [ ] Export the complete public API from `src/index.ts`.
- [ ] Add an example script that previews sections, builds the graph, and writes formatted JSON.
- [ ] Document install, test, build, preview, and `/prompt` POST usage.
- [ ] Run the example script and inspect `examples/example-workflow.json`.

### Task 8: Final Verification

- [ ] Run `npm test`; expect all specified tests to pass.
- [ ] Run `npm run typecheck`; expect zero TypeScript errors.
- [ ] Run `npm run build`; expect `dist/` output.
- [ ] Parse the generated JSON and validate every tuple reference targets an existing node.
- [ ] Review `git diff --check` and `git status --short`; ensure unrelated workspace files remain untouched.
