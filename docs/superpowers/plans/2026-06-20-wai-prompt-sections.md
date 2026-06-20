# WAI Prompt Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five editable WAI prompt sections to the existing web UI and emit the same sections as KJNodes text constants joined into one positive CLIP prompt.

**Architecture:** A shared prompt-grouping module converts the detailed resolved preset data into five ordered `WaiPromptSections`. Preview and workflow generation consume the same normalized structure. The React Generate page edits those arrays responsively, while the workflow builder emits five `StringConstantMultiline` nodes and one `JoinStringMulti` node.

**Tech Stack:** TypeScript, React 19, Vite, Node test runner, Vitest/Testing Library, ComfyUI API/canvas JSON, ComfyUI-KJNodes.

---

### Task 1: Shared five-section prompt model

**Files:**
- Modify: `comfyui-workflow-builder/src/types/prompt.types.ts`
- Modify: `comfyui-workflow-builder/src/types/request.types.ts`
- Create: `comfyui-workflow-builder/src/builder/wai-prompt-sections.ts`
- Modify: `comfyui-workflow-builder/src/builder/resolve-request.ts`
- Modify: `comfyui-workflow-builder/src/builder/prompt-builder.ts`
- Modify: `comfyui-workflow-builder/src/builder/preview.ts`
- Modify: `comfyui-workflow-builder/src/config/defaults.ts`
- Modify: `comfyui-workflow-builder/src/index.ts`
- Test: `comfyui-workflow-builder/src/tests/prompt.test.ts`

- [ ] **Step 1: Write failing tests for grouping, order, overrides, and cleanup**

Add assertions that `preview.waiSections` has exactly `master`, `female`, `male`, `interactionPose`, and `background`; that quality/style are in master; that female and male terms remain separated; and that `buildPrompts` joins in the fixed order with blanks and exact duplicates removed.

```ts
expect(Object.keys(preview.waiSections)).toEqual(["master", "female", "male", "interactionPose", "background"]);
expect(preview.positivePrompt).toBe(joinWaiPromptSections(preview.waiSections));
expect(joinWaiPromptSections({ master: ["masterpiece", ""], female: ["1woman"], male: ["1man"], interactionPose: ["holding hands"], background: ["lobby", "masterpiece"] }))
  .toBe("masterpiece, 1woman, 1man, holding hands, lobby");
```

- [ ] **Step 2: Run the prompt tests and verify failure**

Run: `npm test -- --test-name-pattern="WAI prompt sections"`
Expected: FAIL because `waiSections` and `joinWaiPromptSections` do not exist.

- [ ] **Step 3: Add the shared section type and grouping functions**

Define:

```ts
export interface WaiPromptSections {
  master: string[];
  female: string[];
  male: string[];
  interactionPose: string[];
  background: string[];
}

export const WAI_PROMPT_SECTION_ORDER = ["master", "female", "male", "interactionPose", "background"] as const;
export function normalizeWaiPromptSections(sections: WaiPromptSections): WaiPromptSections;
export function joinWaiPromptSections(sections: WaiPromptSections): string;
export function groupWaiPromptSections(sections: PromptSections): WaiPromptSections;
```

Map `quality + style + additionalPositive` to master, `subjectCount + female fields` to female, flattened male fields to male, pose/interaction/camera to interactionPose, and background to background. Add optional `waiPromptSections?: WaiPromptSections` to `GenerationRequest`; when present, normalize and use it as a complete replacement. Return `waiSections` from `ResolvedRequest`, build positive text only from it, and expose the five groups in preview breakdown.

Change quality defaults to:

```ts
quality: ["masterpiece", "best quality", "very aesthetic", "absurdres"]
```

- [ ] **Step 4: Run prompt tests and typecheck**

Run: `npm test -- --test-name-pattern="WAI prompt sections|prompt" && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit the shared prompt model**

```bash
git add comfyui-workflow-builder/src
git commit -m "feat: add five-section WAI prompt model"
```

### Task 2: KJNodes workflow graph

**Files:**
- Modify: `comfyui-workflow-builder/src/builder/workflow-builder.ts`
- Modify: `comfyui-workflow-builder/src/builder/ui-workflow-builder.ts`
- Modify: `comfyui-workflow-builder/src/types/ui-workflow.types.ts`
- Test: `comfyui-workflow-builder/src/tests/workflow.test.ts`

- [ ] **Step 1: Write failing graph and canvas tests**

Assert five `StringConstantMultiline` nodes, one `JoinStringMulti`, fixed logical names, five ordered string links, `inputcount: 5`, delimiter `, `, `return_list: false`, and the join output connected to positive `CLIPTextEncode.text`. Assert the new canvas rectangles do not overlap.

```ts
expect(nodesByType(built, "StringConstantMultiline")).toHaveLength(5);
expect(nodesByType(built, "JoinStringMulti")).toHaveLength(1);
expect(built.workflow.prompt[built.nodeMap.positive_clip!]?.inputs.text).toEqual([built.nodeMap.prompt_join!, 0]);
```

- [ ] **Step 2: Run workflow tests and verify failure**

Run: `npm test -- --test-name-pattern="KJNodes|encodes the complete positive|canvas"`
Expected: FAIL because positive text is still embedded directly.

- [ ] **Step 3: Build the six-node KJ prompt chain**

Change `buildComfyWorkflow` to receive `waiSections`, create logical nodes `prompt_master`, `prompt_female`, `prompt_male`, `prompt_interaction_pose`, `prompt_background`, and `prompt_join`, and connect them as:

```ts
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
```

Register both KJ schemas with `cnr_id: "comfyui-kjnodes"`, including five dynamic STRING input slots for the joiner. Add canvas `title?: string` support, descriptive section titles, and a non-overlapping prompt-column layout.

- [ ] **Step 4: Run workflow tests and typecheck**

Run: `npm test -- --test-name-pattern="workflow|KJNodes|canvas" && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit the workflow graph**

```bash
git add comfyui-workflow-builder/src
git commit -m "feat: emit sectioned KJNodes prompt graph"
```

### Task 3: Responsive web section editors

**Files:**
- Create: `comfyui-workflow-builder/web/src/components/PromptSectionEditor.tsx`
- Modify: `comfyui-workflow-builder/web/src/pages/GeneratePage.tsx`
- Modify: `comfyui-workflow-builder/web/src/styles.css`
- Test: `comfyui-workflow-builder/web/src/App.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Provide non-empty fixture presets, open Generate, and assert all five editor labels render. Change the Female Character textarea and assert the combined positive preview updates and the generate request contains `waiPromptSections`.

```ts
expect(await screen.findByLabelText("Master / Quality")).toBeInTheDocument();
await user.clear(screen.getByLabelText("Female Character"));
await user.type(screen.getByLabelText("Female Character"), "1woman, red hair");
expect(screen.getByLabelText("Combined positive prompt")).toHaveValue(expect.stringContaining("red hair"));
```

- [ ] **Step 2: Run web tests and verify failure**

Run: `npm run test:web -- --runInBand`
Expected: FAIL because the five editors do not exist.

- [ ] **Step 3: Implement editable cards and synchronized requests**

Create `PromptSectionEditor` as an accessible labeled textarea that parses comma/newline text into normalized tags. In `GeneratePage`, derive resolved base sections from preview, keep direct edits in state, reset them when preset selection changes, and send the edited `waiPromptSections` in every action request. Keep negative overrides separate. Render the five editors in fixed order plus a read-only textarea labeled `Combined positive prompt`.

Add `.prompt-sections-grid` with two columns on wide displays and one column below 700px. Ensure textareas have no fixed horizontal width and action buttons remain touch-sized.

- [ ] **Step 4: Run web tests and typecheck**

Run: `npm run test:web && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit the responsive UI**

```bash
git add comfyui-workflow-builder/web
git commit -m "feat: add responsive WAI prompt section editors"
```

### Task 4: KJNodes capability validation

**Files:**
- Modify: `comfyui-workflow-builder/server/comfy-client.ts`
- Modify: `comfyui-workflow-builder/server/workflow-service.ts`
- Test: `comfyui-workflow-builder/server/tests/store.test.ts`
- Test: `comfyui-workflow-builder/server/tests/workflow-service.test.ts`

- [ ] **Step 1: Write failing capability tests**

Test that object info containing both KJ classes passes and missing either produces: `ComfyUI-KJNodes is required: enable StringConstantMultiline and JoinStringMulti.` Test generate, save, and queue paths. When ComfyUI is disconnected and capability cannot be verified, return `Connect ComfyUI to verify the required KJNodes prompt nodes.`

- [ ] **Step 2: Run server tests and verify failure**

Run: `npm test -- --test-name-pattern="KJNodes capability"`
Expected: FAIL because no capability method exists.

- [ ] **Step 3: Add capability inspection and actionable validation**

Add to the client:

```ts
async hasNodeTypes(names: string[]): Promise<boolean> {
  const info = await request("/object_info");
  return names.every((name) => Boolean(info?.[name]));
}
```

Call it before generate, save, and queue. Throw the exact actionable missing-node error when false and the exact connection error when object info cannot be read.

- [ ] **Step 4: Run server tests and typecheck**

Run: `npm test -- --test-name-pattern="KJNodes capability|workflow service" && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit capability validation**

```bash
git add comfyui-workflow-builder/server
git commit -m "feat: validate KJNodes workflow support"
```

### Task 5: Full verification and generated artifacts

**Files:**
- Modify: `comfyui-workflow-builder/examples/example-workflow.json`
- Modify: `comfyui-workflow-builder/examples/example-workflow-api.json`
- Modify: `comfyui-workflow-builder/data/generated/Agent Modular Workflow.json`
- Modify: `comfyui-workflow-builder/dist/**`
- Modify: `comfyui-workflow-builder/dist-web/**`

- [ ] **Step 1: Run all automated checks**

Run: `npm test && npm run test:web && npm run typecheck && npm run build && npm run build:web`
Expected: all commands exit 0.

- [ ] **Step 2: Regenerate examples and inspect the graph**

Run: `npm run example`
Expected: generated canvas contains five `StringConstantMultiline` nodes and one `JoinStringMulti`; positive CLIP text is linked.

- [ ] **Step 3: Run formatting and repository checks**

Run: `git diff --check && git status --short`
Expected: no whitespace errors; unrelated existing untracked files remain unstaged.

- [ ] **Step 4: Commit generated artifacts**

```bash
git add comfyui-workflow-builder/dist comfyui-workflow-builder/dist-web comfyui-workflow-builder/examples comfyui-workflow-builder/data/generated
git commit -m "build: refresh sectioned workflow artifacts"
```
