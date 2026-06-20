# WAI Prompt Sections Design

## Goal

Make the positive prompt easy to revise as five independent sections in both the workflow-builder web UI and exported ComfyUI canvas workflows. The final prompt remains one comma-separated string sent to WAI-Illustrious SDXL v17 through a single positive `CLIPTextEncode` node.

## Prompt Structure

The five sections and their fixed join order are:

1. **Master / Quality** — quality, aesthetic, medium, artist, and style tags. Initial quality defaults should favor recognized Illustrious-style tags such as `masterpiece`, `best quality`, `very aesthetic`, and `absurdres`; vague phrases such as `coherent anatomy` and `clean composition` should not be defaults.
2. **Female Character** — female subject count, identity or trigger, series, appearance, expression, and clothing.
3. **Male Character** — male subject count, identity or trigger, series, appearance, expression, and clothing. Multiple male records are flattened into this single editable section.
4. **Interaction / Pose** — character actions, contact, relative positions, pose, framing, camera angle, and spatial composition.
5. **Background / Environment** — location, scenery, background objects, lighting, weather, time, and atmosphere.

The section boundaries are editing aids. The model receives:

```text
master, female, male, interaction/pose, background/environment
```

Tags are comma-separated. Joining trims whitespace, removes empty entries, and removes exact duplicates while preserving the first occurrence and section order. Negative prompting remains a separate existing prompt and `CLIPTextEncode` node.

## Web UI

The Generate page replaces the narrow prompt-override experience with five clearly labeled positive-prompt editors populated from the resolved presets. Each editor supports direct tag editing and updates a read-only combined positive-prompt preview immediately.

The preset selectors remain the starting point. Changing a character, costume, style, pose, or male count resolves fresh values for the affected sections. User edits are represented as section overrides in the generation request, so preview, download, save, and queue actions all use the same values.

Responsive behavior:

- Wide screens use a two-column editor layout, with the combined preview and actions remaining easy to scan.
- Narrow screens stack all five editors in prompt order without horizontal scrolling.
- Labels, controls, and action buttons remain usable with touch input.

The UI shows a clear error if preset resolution fails. Actions are disabled when no valid combined prompt can be built.

## ComfyUI Workflow

The exported API and canvas workflows use the installed ComfyUI-KJNodes package:

- Five `StringConstantMultiline` nodes hold the five section strings.
- One `JoinStringMulti` node receives the five strings in the fixed order.
- `JoinStringMulti` uses `inputcount = 5`, delimiter `, `, and `return_list = false`.
- Its `STRING` output connects to the text input of the positive `CLIPTextEncode` node.
- The negative `CLIPTextEncode` keeps its existing multiline text widget.

Canvas nodes are titled for their purpose and laid out together as a visible prompt-authoring group. The five source nodes must not overlap each other or the join/encode nodes.

KJNodes is an explicit runtime dependency for generated workflows. The web server must detect whether `StringConstantMultiline` and `JoinStringMulti` are available from ComfyUI object information. If unavailable, generation/save/queue returns an actionable message telling the user to install or enable ComfyUI-KJNodes; it must not silently produce a broken graph.

## Data Flow

1. Preset selection resolves the detailed internal prompt sections already used by the builder.
2. A grouping function maps those details into the five public WAI editing sections.
3. Web overrides replace or modify those grouped sections.
4. A shared normalizer produces both the live combined preview and the five workflow-node strings.
5. The workflow builder creates the five KJNodes constants, joins them, and sends the result to positive CLIP encoding.
6. Downloaded, saved, and queued workflows are built from the same normalized request.

Edits made later inside ComfyUI do not sync back to the web UI. Reverse synchronization or workflow importing is outside this feature.

## Compatibility

Existing preset files remain valid. Existing detailed prompt-resolution types may remain internal, but the generation request gains a five-section editing representation. The generated canvas schema gains support for the two KJNodes classes and their package metadata.

The output prompt semantics stay compatible with WAI-Illustrious SDXL v17: logical Danbooru-style tag grouping, quality first, character details before action and environment, and one final positive conditioning path.

## Testing

Unit and web tests cover:

- Correct mapping from detailed resolved values to all five sections.
- Fixed join order, trimming, empty-tag removal, and stable deduplication.
- Exact five-node KJ prompt graph and valid references into `JoinStringMulti` and `CLIPTextEncode`.
- Correct KJ join configuration and canvas widget values.
- Non-overlapping canvas placement.
- Responsive editor rendering and live combined-preview updates.
- Identical prompts across preview, download, save, and queue paths.
- Actionable failure when required KJNodes classes are unavailable.
- Preservation of the separate negative-prompt path.

## Out of Scope

- Synchronizing ComfyUI edits back into the web UI.
- Regional prompting or separate CLIP conditioning per character.
- Automatic prompt generation by an LLM.
- Replacing KJNodes with a new custom-node package.
