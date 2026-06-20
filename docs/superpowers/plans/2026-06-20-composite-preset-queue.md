# Composite Preset Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace category-specific editors with complete saved presets and an ordered batch queue that submits one ComfyUI API workflow per preset variant.

**Architecture:** Add composite preset and queue-plan documents to the existing file store. Expand queue plans on the server into deterministic job descriptors, build one API workflow for each job, and submit them sequentially through the existing Comfy client. Replace the React navigation with focused Presets, Queue, and Settings pages.

**Tech Stack:** TypeScript, Node.js HTTP server, React 19, Vite, Node test runner, Vitest/Testing Library.

---

### Task 1: Composite preset and queue types

**Files:**
- Create: `src/types/composite-preset.types.ts`
- Modify: `src/types/app.types.ts`
- Modify: `src/index.ts`
- Test: `server/tests/store.test.ts`

- [ ] Write failing type/store tests for a versioned composite preset document and queue-plan document.
- [ ] Run `npm test` and confirm missing store methods fail.
- [ ] Define `CompositePreset`, `QueueEntry`, and `QueuePlan` with explicit LoRA and six-section prompt fields.
- [ ] Export the types and run `npm run typecheck`.

### Task 2: Persistent documents and migration

**Files:**
- Modify: `server/store.ts`
- Modify: `server/index.ts`
- Create: `data/presets/composites.json`
- Create: `data/queues.json`
- Test: `server/tests/store.test.ts`

- [ ] Write failing tests for atomic read/write of composite presets and queue plans.
- [ ] Add `readCompositePresets`, `writeCompositePresets`, `readQueuePlans`, and `writeQueuePlans`.
- [ ] Expose `PUT /api/presets/composites` and `PUT /api/queues`.
- [ ] Run the store tests and commit the green state.

### Task 3: Deterministic queue expansion

**Files:**
- Create: `src/queue/expand-queue.ts`
- Test: `src/tests/queue.test.ts`

- [ ] Write a failing test expecting ordered expansion and seeds `baseSeed + index`.
- [ ] Write a failing validation test for missing preset IDs and invalid variants.
- [ ] Implement `expandQueuePlan(plan, presets)` without mutating inputs.
- [ ] Run `npm test` and commit the green state.

### Task 4: Batch workflow submission

**Files:**
- Modify: `server/comfy-client.ts`
- Modify: `server/workflow-service.ts`
- Modify: `server/index.ts`
- Test: `server/tests/workflow-service.test.ts`

- [ ] Write a failing service test that expects prompt submissions in queue order.
- [ ] Convert each composite preset into a LoRA stack and `WaiPromptSections`.
- [ ] Build one workflow per variant, set the job seed and filename prefix, and submit through `/prompt`.
- [ ] Add `POST /api/queues/run` returning batch ID, total, and prompt IDs.
- [ ] Run service tests and commit the green state.

### Task 5: Presets workspace

**Files:**
- Create: `web/src/pages/PresetsPage.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/styles.css`
- Test: `web/src/App.test.tsx`

- [ ] Write a failing UI test for three navigation items and three installed-LoRA selectors.
- [ ] Replace category navigation with Presets, Queue, and Settings.
- [ ] Build create/edit/clone/delete controls and six prompt editors.
- [ ] Save through `PUT /api/presets/composites`.
- [ ] Run `npm run test:web` and commit the green state.

### Task 6: Queue workspace

**Files:**
- Create: `web/src/pages/QueuePage.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/styles.css`
- Test: `web/src/App.test.tsx`

- [ ] Write a failing UI test for adding, ordering, saving, and running queue entries.
- [ ] Render an ordered entry list with enable and variants controls.
- [ ] Add seed, save-plan, and run-queue controls.
- [ ] Display returned prompt IDs/count without the old LoRA stack or section breakdown.
- [ ] Run Web tests and commit the green state.

### Task 7: Verification and documentation

**Files:**
- Modify: `README.md`

- [ ] Document the preset and queue execution model and the Payload-template follow-up boundary.
- [ ] Run `npm test`, `npm run test:web`, `npm run typecheck`, `npm run build`, and `npm run build:web`.
- [ ] Run the local development server and verify `/`, bootstrap, preset save, and queue validation.
- [ ] Confirm `git diff --check` and commit the final documentation.
