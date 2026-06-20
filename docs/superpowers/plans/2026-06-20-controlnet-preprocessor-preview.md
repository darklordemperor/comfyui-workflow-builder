# ControlNet Preprocessor Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install the ControlNet auxiliary preprocessors and make the generated workflow preview the exact preprocessed image supplied to ControlNet.

**Architecture:** Pose configuration selects an AIO auxiliary processor and resolution. Workflow generation routes `LoadImage` through `AIO_Preprocessor`, then fans its output to both `PreviewImage` and `ControlNetApplyAdvanced`, while keeping final decoded output preview separate.

**Tech Stack:** ComfyUI, Python 3.12, `comfyui_controlnet_aux`, TypeScript workflow builder, Node tests.

---

### Task 1: Install and verify the auxiliary node package

**Files:**
- Create: `custom_nodes/comfyui_controlnet_aux/**`

- [ ] Clone `https://github.com/Fannovel16/comfyui_controlnet_aux.git` into `custom_nodes/comfyui_controlnet_aux`.
- [ ] Install its requirements with the Python 3.12 executable used by the running ComfyUI process.
- [ ] Restart ComfyUI and verify `/object_info/AIO_Preprocessor` returns its schema.
- [ ] Record the exact required input names and available DWPose selector value for workflow generation.

### Task 2: Build and test the preprocessor preview graph

**Files:**
- Modify: `comfyui-workflow-builder/src/types/pose.types.ts`
- Modify: `comfyui-workflow-builder/src/presets/poses/example-couple.ts`
- Modify: `comfyui-workflow-builder/src/builder/workflow-builder.ts`
- Modify: `comfyui-workflow-builder/src/builder/ui-workflow-builder.ts`
- Modify: `comfyui-workflow-builder/server/workflow-service.ts`
- Modify: `comfyui-workflow-builder/src/tests/fixtures.ts`
- Modify: `comfyui-workflow-builder/src/tests/workflow.test.ts`

- [ ] Add failing tests asserting one `AIO_Preprocessor`, a `ControlNet Input Preview`, and identical preprocessor output references into preview and `ControlNetApplyAdvanced.image`.
- [ ] Run the focused tests and confirm they fail because the AIO graph is absent.
- [ ] Add preprocessor selector/resolution configuration and emit `AIO_Preprocessor` for non-bypass modes.
- [ ] Always create the control-map `PreviewImage` when ControlNet is enabled; preserve direct-image bypass behavior.
- [ ] Register the AIO canvas schema and title the control and final previews explicitly.
- [ ] Require `AIO_Preprocessor` in workflow-service node capability validation.
- [ ] Run workflow tests and type checking until green.
- [ ] Commit the graph changes.

### Task 3: Regenerate and verify workflows

**Files:**
- Modify: `comfyui-workflow-builder/examples/example-workflow.json`
- Modify: `comfyui-workflow-builder/examples/example-workflow-api.json`
- Modify: `comfyui-workflow-builder/data/generated/Agent Modular Workflow.json`

- [ ] Regenerate examples and copy the canvas workflow to the stored workflow.
- [ ] Run all backend/web tests, type checking, and production builds.
- [ ] Inspect JSON for `LoadImage -> AIO_Preprocessor -> PreviewImage + ControlNetApplyAdvanced` and separate final preview.
- [ ] Run `git diff --check` and preserve unrelated files.
- [ ] Commit generated workflow artifacts.
