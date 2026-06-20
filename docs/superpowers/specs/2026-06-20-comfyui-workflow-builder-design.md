# ComfyUI Modular Prompt and Workflow Builder Design

## Goal

Build an isolated TypeScript package at `comfyui-workflow-builder/` that resolves typed generation requests into modular prompts and valid ComfyUI API-format workflow graphs for WAI-Illustrious-XL v17.

## Package Boundary

The package is independent of ComfyUI's Python runtime. It has its own `package.json`, strict `tsconfig.json`, Vitest configuration, source tree, tests, README, and public entry point. Existing files outside `comfyui-workflow-builder/` are not changed except for this design and its implementation plan.

## Architecture

The package has five layers:

1. **Types** define prompt sections, presets, generation requests, runtime defaults, and ComfyUI node graphs.
2. **Preset registries** provide example character, costume, style, and pose data without embedding those values in builders.
3. **Utilities** implement subject-count tokens, immutable array overrides, and stable prompt joining with deduplication.
4. **Builders** resolve requests, assemble prompts, preview contributing sections, and construct sequential ComfyUI node graphs.
5. **Tests** exercise the 44 supplied prompt and workflow requirements through public behavior.

## Configuration

Prompt text, LoRA filenames, checkpoint names, generation defaults, output prefixes, and configurable node parameters live in typed configuration or preset objects. Builder modules consume those objects rather than containing domain strings.

The supplied WAI-Illustrious defaults are represented by exported default configuration objects. Public builder APIs accept optional configuration overrides while preserving the requested call shape for callers that use the defaults.

## Request Resolution

`resolveRequest` validates all referenced presets and validates `maleOverrides` length before constructing sections. Pose subject layout must agree with one female plus the requested number of males. Preset data is deep-cloned so overrides never mutate registry objects.

Default male sections are generated with stable IDs and deterministic left/right/center-relative positions. Male sections contain appearance, clothing, position, and additional terms only; male-to-female actions remain exclusively in the interaction section.

The LoRA stack is resolved in character, costume, style, then pose order. Swapping the pose preset atomically replaces the pose LoRA, trigger, interactions, camera, pose negatives, and optional OpenPose configuration.

## Prompt Assembly

Positive sections follow the exact 16-stage order in the supplied specification. Negative sections follow their declared order. Empty and nested arrays are flattened, whitespace-only entries are discarded, and duplicate terms are removed while preserving the first occurrence.

The preview API returns resolved sections, LoRA stack, final strings, and named positive and negative section breakdowns without contacting ComfyUI.

## Workflow Construction

A private `NodeBuilder` allocates sequential string IDs, records logical-name mappings, and validates references by construction. The graph contains:

- Checkpoint loader
- Ordered LoRA chain
- Positive and negative CLIP encoders
- Empty latent image
- Optional pose image, preprocessor, preprocessor preview, ControlNet loader, and advanced ControlNet application
- KSampler
- VAE decode
- Output preview and image save nodes

OpenPose `bypass` mode wires the loaded image directly to ControlNet. Other modes map body, face, and hand flags explicitly. ControlNet conditioning outputs replace both KSampler conditioning inputs when enabled.

The API result has the shape `{ prompt: Record<string, ComfyNode> }`, ready to serialize as the request body for ComfyUI's `/prompt` endpoint.

## Errors

Resolution throws descriptive errors for missing character, costume, pose, or requested style presets; incompatible pose subject counts; invalid male override counts; and invalid generation/control values. Node lookup errors identify the missing logical node name.

## Testing

Vitest tests are written before implementation in red-green-refactor cycles. Tests cover every supplied requirement, including immutability, section ordering, pose swapping, LoRA chaining, ControlNet mode wiring, default generation parameters, sequential node maps, and graph reference integrity.

Type checking, the full test suite, and a production build must all pass before completion.

## Deliverables

- Complete TypeScript source and example preset registries
- All specified unit tests
- Public package exports
- README usage examples for previewing prompts, building workflows, and posting to ComfyUI
- Generated example workflow JSON demonstrating the final output
