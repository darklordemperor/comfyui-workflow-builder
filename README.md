# ComfyUI Modular Prompt and Workflow Builder

A strict TypeScript library for composing section-based multi-character prompts and generating ComfyUI API-format workflow JSON for WAI-Illustrious-XL v17.

## React Control Panel

The standalone local UI manages settings and every preset category without editing TypeScript files.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The local API runs at `http://127.0.0.1:4174` and listens only on loopback.

Use the sidebar to edit characters/costumes, styles, poses/ControlNet, and generation settings. The Generate workspace previews prompt sections and the LoRA chain, downloads JSON, saves a loadable workflow under `ComfyUI/user/default/workflows`, and queues through ComfyUI `/prompt` after model filenames match installed resources.

Project data is stored under `data/settings.json` and `data/presets/*.json`. UI saves use atomic JSON writes.

## Commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run example
```

`npm run example` prints the assembled prompts and writes two formats:

- `examples/example-workflow.json` loads into the ComfyUI editor and displays the node canvas.
- `examples/example-workflow-api.json` is ready to POST to ComfyUI's `/prompt` endpoint.

## Build a Workflow

```ts
import {
  buildComfyWorkflow,
  buildPrompts,
  exampleGenerationRequest,
  examplePresetsRegistry,
  resolveRequest,
} from "./src/index.ts";

const resolved = resolveRequest(exampleGenerationRequest, examplePresetsRegistry);
const workflow = buildComfyWorkflow({
  builtPrompts: buildPrompts(resolved),
  loraStack: resolved.loraStack,
  posePreset: resolved.resolvedPosePreset,
  request: exampleGenerationRequest,
});
```

The returned `workflow.workflow` object is the request body expected by ComfyUI:

```ts
await fetch("http://127.0.0.1:8188/prompt", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(workflow.workflow),
});
```

## Preview Prompt Sources

```ts
import { previewPromptSections } from "./src/index.ts";

const preview = previewPromptSections(exampleGenerationRequest, examplePresetsRegistry);
console.table(preview.positiveSectionBreakdown);
console.table(preview.negativeSectionBreakdown);
```

## Configure Installed Models

The example LoRA, ControlNet, and reference-image filenames are registry values. Replace them with filenames available to your ComfyUI installation. Workflow and prompt defaults are exported as `DEFAULT_WORKFLOW_DEFAULTS` and `DEFAULT_PROMPT_DEFAULTS`; pass custom typed defaults to the relevant builder when needed.
