# ComfyUI Workflow Builder Web UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone React control panel that manages project JSON presets, discovers installed ComfyUI resources, previews prompts, saves loadable workflows, and queues generation.

**Architecture:** A Vite React application imports the existing typed builders for immediate previews. A loopback-only Node service owns JSON persistence, path-safe workflow writes, reference-image uploads, and ComfyUI API calls; it repeats workflow construction server-side before every save or queue operation.

**Tech Stack:** React, TypeScript, Vite, Lucide React, Node HTTP/fetch APIs, Node test runner, React Testing Library

---

## File Map

- `comfyui-workflow-builder/src/types/app.types.ts`: versioned settings, persisted documents, API request/response contracts.
- `comfyui-workflow-builder/data/`: settings, character, style, and pose JSON documents.
- `comfyui-workflow-builder/server/`: loopback HTTP service, persistence, validation, ComfyUI client, workflow actions.
- `comfyui-workflow-builder/web/`: Vite application, focused UI components, pages, state, API client, and styles.
- `comfyui-workflow-builder/scripts/dev.mjs`: starts the service and Vite together and terminates both cleanly.

### Task 1: Tooling and Shared Application Contracts

**Files:**
- Modify: `comfyui-workflow-builder/package.json`
- Modify: `comfyui-workflow-builder/tsconfig.json`
- Create: `comfyui-workflow-builder/tsconfig.server.json`
- Create: `comfyui-workflow-builder/src/types/app.types.ts`
- Modify: `comfyui-workflow-builder/src/index.ts`
- Create: `comfyui-workflow-builder/scripts/dev.mjs`

- [ ] **Step 1: Add a failing public-contract test**

Extend `src/tests/workflow.test.ts` to import `AppSettings` and assert a typed fixture can be passed through `structuredClone` without losing version or generation defaults.

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test`

Expected: module export failure for `AppSettings`.

- [ ] **Step 3: Define versioned contracts and install frontend dependencies**

`AppSettings` contains the fields in the test. `PresetDocuments` contains `{ version: 1, records: Record<string, T> }` documents for characters, styles, and poses. `BootstrapPayload` contains settings, registry, ComfyUI status, normalized models, and input images.

Install React, React DOM, Lucide React, Vite, the React Vite plugin, React/Node typings, Vitest, jsdom, React Testing Library, and user-event. Add scripts:

```json
{
  "dev": "node scripts/dev.mjs",
  "dev:server": "node --experimental-strip-types server/index.ts",
  "dev:web": "vite --config web/vite.config.ts",
  "build:web": "vite build --config web/vite.config.ts",
  "test:web": "vitest run --config web/vitest.config.ts"
}
```

- [ ] **Step 4: Implement the development process runner**

`scripts/dev.mjs` spawns `npm run dev:server` and `npm run dev:web`, forwards signals to both children, and exits nonzero when either child fails unexpectedly.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`

Expected: all tests pass and TypeScript reports zero errors.

### Task 2: Versioned JSON Persistence and Validation

**Files:**
- Create: `comfyui-workflow-builder/data/settings.json`
- Create: `comfyui-workflow-builder/data/presets/characters.json`
- Create: `comfyui-workflow-builder/data/presets/styles.json`
- Create: `comfyui-workflow-builder/data/presets/poses.json`
- Create: `comfyui-workflow-builder/server/validation.ts`
- Create: `comfyui-workflow-builder/server/store.ts`
- Create: `comfyui-workflow-builder/server/tests/store.test.ts`

- [ ] **Step 1: Write failing store tests**

Cover valid document reads, rejected unsupported versions, rejected record/id mismatch, atomic writes, and path traversal rejection.

```ts
await store.writePresetDocument("characters", { version: 1, records: { claire: validCharacter } });
assert.deepEqual((await store.readPresetDocuments()).characters.records.claire, validCharacter);
await assert.rejects(() => store.resolveWorkflowPath("../../escape.json"), /valid workflow filename/);
```

- [ ] **Step 2: Run store tests and verify RED**

Run: `node --test --experimental-strip-types server/tests/store.test.ts`

Expected: missing `server/store.ts`.

- [ ] **Step 3: Implement validators and atomic storage**

Validators check version, required strings, finite numeric strengths, subject-count consistency, OpenPose percentages, and that each record key equals its `id`. `writeJsonAtomic` writes `<name>.tmp-<random>` beside the destination and renames it after successful serialization.

- [ ] **Step 4: Seed JSON from current typed examples**

Seed settings from `DEFAULT_WORKFLOW_DEFAULTS`; seed character/style/pose records from `examplePresetsRegistry`. Preserve `openpose_T-pose.png` as the example reference image.

- [ ] **Step 5: Run store tests**

Expected: all persistence and validation tests pass.

### Task 3: ComfyUI Client and Resource Discovery

**Files:**
- Create: `comfyui-workflow-builder/server/comfy-client.ts`
- Create: `comfyui-workflow-builder/server/tests/comfy-client.test.ts`

- [ ] **Step 1: Write failing client tests with a local mock server**

Test health status, extraction of checkpoint/LoRA/ControlNet lists from `/object_info`, queue response parsing, non-2xx structured errors, and image upload forwarding.

```ts
const models = await client.getModels();
assert.deepEqual(models.checkpoints, ["wai.safetensors"]);
assert.deepEqual(models.loras, ["character.safetensors"]);
assert.equal((await client.queue({ prompt: {} })).promptId, "prompt-123");
```

- [ ] **Step 2: Verify RED**

Run: `node --test --experimental-strip-types server/tests/comfy-client.test.ts`

Expected: missing Comfy client.

- [ ] **Step 3: Implement timeout-bound fetch calls**

Use `AbortSignal.timeout(5000)`. Normalize model arrays from required input combo values for `CheckpointLoaderSimple.ckpt_name`, `LoraLoader.lora_name`, and `ControlNetLoader.control_net_name`. Return `{ connected: false, message }` rather than throwing from health checks.

- [ ] **Step 4: Run client tests**

Expected: all discovery, upload, queue, and error tests pass.

### Task 4: Workflow Application Service and HTTP Routes

**Files:**
- Create: `comfyui-workflow-builder/server/workflow-service.ts`
- Create: `comfyui-workflow-builder/server/http.ts`
- Create: `comfyui-workflow-builder/server/index.ts`
- Create: `comfyui-workflow-builder/server/tests/http.test.ts`

- [ ] **Step 1: Write failing HTTP integration tests**

Cover `GET /api/bootstrap`, `PUT /api/settings`, `PUT /api/presets/:kind`, `POST /api/workflows/generate`, `POST /api/workflows/save`, `POST /api/workflows/queue`, and `POST /api/images/upload`.

```ts
const response = await fetch(`${baseUrl}/api/workflows/generate`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ request: validRequest }),
});
const body = await response.json();
assert.equal(body.canvas.version, 0.4);
assert.ok(body.api.prompt);
```

- [ ] **Step 2: Verify RED**

Run: `node --test --experimental-strip-types server/tests/http.test.ts`

Expected: missing server modules.

- [ ] **Step 3: Implement server-side reconstruction**

Load persisted settings/registry for each action, call `resolveRequest`, `buildPrompts`, `buildComfyWorkflow`, and `buildComfyUICanvasWorkflow`, then return or persist the results. Save only basename filenames ending in `.json` beneath the configured ComfyUI workflow directory and `data/generated`.

- [ ] **Step 4: Implement loopback HTTP handling**

Bind to `127.0.0.1:4174`; reject bodies over 10 MB; send JSON envelopes `{ ok: true, data }` or `{ ok: false, error: { code, message, fields? } }`; set CORS only for the Vite origin `http://127.0.0.1:5173`.

- [ ] **Step 5: Run server integration tests**

Expected: every route passes with temporary directories and the mock ComfyUI server.

### Task 5: React Shell, API Client, and Workspace State

**Files:**
- Create: `comfyui-workflow-builder/web/index.html`
- Create: `comfyui-workflow-builder/web/vite.config.ts`
- Create: `comfyui-workflow-builder/web/vitest.config.ts`
- Create: `comfyui-workflow-builder/web/src/main.tsx`
- Create: `comfyui-workflow-builder/web/src/App.tsx`
- Create: `comfyui-workflow-builder/web/src/api/client.ts`
- Create: `comfyui-workflow-builder/web/src/state/workspace.tsx`
- Create: `comfyui-workflow-builder/web/src/components/AppSidebar.tsx`
- Create: `comfyui-workflow-builder/web/src/components/ConnectionStatus.tsx`
- Create: `comfyui-workflow-builder/web/src/styles.css`
- Create: `comfyui-workflow-builder/web/src/App.test.tsx`

- [ ] **Step 1: Write a failing shell test**

Mock `/api/bootstrap`, render `App`, and assert Generate, Characters, Styles, Poses, Settings, and connection status are present. Click Styles and assert the Styles workspace heading appears.

- [ ] **Step 2: Verify RED**

Run: `npm run test:web`

Expected: missing React application.

- [ ] **Step 3: Build the application shell**

Use a compact icon-and-label sidebar, restrained neutral surfaces, status bar, and one scrollable workspace. Use Lucide icons with `title`/accessible labels. Keep card radius at 6px and avoid decorative gradients.

- [ ] **Step 4: Implement typed bootstrap state**

Workspace state exposes `settings`, `registry`, `models`, `inputImages`, `connection`, `activeRequest`, `refresh`, and save methods. All fetch failures become a visible status message with Retry.

- [ ] **Step 5: Run shell tests**

Expected: navigation and connection-state tests pass.

### Task 6: Shared Editors and Preset CRUD Screens

**Files:**
- Create: `web/src/components/TokenField.tsx`
- Create: `web/src/components/ModelCombobox.tsx`
- Create: `web/src/components/FormSection.tsx`
- Create: `web/src/components/LoraEditor.tsx`
- Create: `web/src/pages/CharactersPage.tsx`
- Create: `web/src/pages/StylesPage.tsx`
- Create: `web/src/pages/PosesPage.tsx`
- Create: `web/src/pages/SettingsPage.tsx`
- Create: `web/src/pages/PresetPages.test.tsx`

- [ ] **Step 1: Write failing editing-flow tests**

Test token entry/removal, model selection, character costume addition, optional style LoRA toggling, OpenPose mode controls, settings persistence, duplicate, and confirmed delete.

- [ ] **Step 2: Verify RED**

Run: `npm run test:web -- PresetPages`

Expected: missing editor components/pages.

- [ ] **Step 3: Implement shared controls**

`TokenField` splits pasted comma/newline lists, trims blanks, preserves order, and prevents duplicates. `ModelCombobox` uses installed model options but accepts manual text. `LoraEditor` edits file, model/CLIP strengths, and triggers as one reusable unit.

- [ ] **Step 4: Implement CRUD pages**

Each page uses a preset list and detail form, local draft state, Save/Duplicate/Delete actions, inline validation, and dirty-navigation confirmation. Poses reveal ControlNet fields only when enabled and hide preprocessor preview when mode is bypass.

- [ ] **Step 5: Run preset UI tests**

Expected: all CRUD and shared-control tests pass.

### Task 7: Generate Workspace and Workflow Actions

**Files:**
- Create: `web/src/pages/GeneratePage.tsx`
- Create: `web/src/components/PromptPreview.tsx`
- Create: `web/src/components/GenerationControls.tsx`
- Create: `web/src/pages/GeneratePage.test.tsx`

- [ ] **Step 1: Write failing generation-flow tests**

Select character/costume/style/pose, change male count, add prompt overrides, assert live prompt ordering, generate/download both JSON formats, save to ComfyUI, and queue generation. Assert queue is disabled while disconnected or invalid.

- [ ] **Step 2: Verify RED**

Run: `npm run test:web -- GeneratePage`

Expected: missing Generate page.

- [ ] **Step 3: Implement live preview**

Build a typed `GenerationRequest` from controls and call `previewPromptSections` in a memoized error boundary. Show positive/negative prompts, named section breakdowns, and ordered LoRA stack without server calls.

- [ ] **Step 4: Implement workflow actions**

Generate calls `/api/workflows/generate`; downloads use object URLs; Save calls `/api/workflows/save`; Queue calls `/api/workflows/queue`. Show returned paths and prompt IDs in a compact activity area and preserve actionable server errors.

- [ ] **Step 5: Run generation tests**

Expected: full generation workflow passes.

### Task 8: Documentation and End-to-End Verification

**Files:**
- Modify: `comfyui-workflow-builder/README.md`

- [ ] **Step 1: Document setup and operations**

Document `npm install`, `npm run dev`, ports 5173/4174, ComfyUI URL/root settings, JSON locations, preset editing, image upload, canvas/API generation, saving, and queueing.

- [ ] **Step 2: Run complete automated verification**

Run:

```bash
npm test
npm run test:web
npm run typecheck
npm run build
npm run build:web
```

Expected: all commands exit 0 with no failed tests.

- [ ] **Step 3: Start ComfyUI and the web application**

Start ComfyUI on an available loopback port with an isolated in-memory database, then run `npm run dev`. Confirm the UI reports connected and model selectors populate.

- [ ] **Step 4: Verify in the browser**

At 1440x900 and 390x844, verify no overlap or clipped labels. Create/edit presets, generate prompts, save `Agent Modular Workflow.json`, open it in ComfyUI, and confirm visible linked nodes. Queue only after replacing placeholder model filenames with installed model options.

- [ ] **Step 5: Review workspace changes**

Run `git diff --check` and `git status --short`. Confirm unrelated launcher and `prompt_presets` files remain untouched.
