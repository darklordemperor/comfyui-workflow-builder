import { writeFileSync } from "node:fs";
import {
  buildComfyWorkflow,
  buildComfyUICanvasWorkflow,
  buildPrompts,
  exampleGenerationRequest,
  examplePresetsRegistry,
  previewPromptSections,
  resolveRequest,
} from "../src/index.ts";

const preview = previewPromptSections(exampleGenerationRequest, examplePresetsRegistry);
const resolved = resolveRequest(exampleGenerationRequest, examplePresetsRegistry);
const workflow = buildComfyWorkflow({
  builtPrompts: buildPrompts(resolved),
  waiSections: resolved.waiSections,
  loraStack: resolved.loraStack,
  posePreset: resolved.resolvedPosePreset,
  request: exampleGenerationRequest,
});

const canvasWorkflow = buildComfyUICanvasWorkflow(workflow);

writeFileSync(new URL("./example-workflow-api.json", import.meta.url), `${JSON.stringify(workflow.workflow, null, 2)}\n`);
writeFileSync(new URL("./example-workflow.json", import.meta.url), `${JSON.stringify(canvasWorkflow, null, 2)}\n`);

console.log(`Positive prompt:\n${preview.positivePrompt}\n`);
console.log(`Negative prompt:\n${preview.negativePrompt}\n`);
console.log(`Generated ${Object.keys(workflow.workflow.prompt).length} ComfyUI nodes.`);
console.log("Wrote editor workflow: examples/example-workflow.json");
console.log("Wrote API workflow: examples/example-workflow-api.json");
