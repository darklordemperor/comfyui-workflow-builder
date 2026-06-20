# ComfyUI Workflow Builder Web UI Design

## Goal

Add a standalone local React application to `comfyui-workflow-builder` so users can manage all workflow configuration, generate prompt previews, save editor/API workflows, and queue ComfyUI generation without editing TypeScript files.

## Runtime Architecture

The project will contain two local processes started by one development command:

1. A Vite React frontend provides the editing and generation interface.
2. A small Node HTTP service persists project JSON, serves model/input metadata, writes generated workflow files, uploads reference images, and proxies queue requests to ComfyUI.

The existing TypeScript prompt and workflow builders remain the only implementation of request resolution, prompt assembly, API graph creation, and canvas graph conversion. The web application imports those functions directly.

Both services listen only on loopback addresses. The backend validates file names and preset IDs and limits writes to the project's `data/` directory and the configured ComfyUI workflow/input directories.

## Persistence

Configuration is stored as JSON under:

```text
comfyui-workflow-builder/data/
  settings.json
  presets/
    characters.json
    styles.json
    poses.json
  generated/
```

Writes are atomic: the service writes a temporary file in the target directory and renames it over the destination. Invalid JSON or schema-invalid presets are rejected without modifying existing data.

Settings include the ComfyUI base URL, ComfyUI root path, selected checkpoint, workflow output name, image output prefix, and generation defaults. Model and prompt text continue to come from typed settings, requests, and registries rather than React components.

## ComfyUI Integration

The local service provides endpoints that:

- Check ComfyUI connection health.
- Read `/object_info` and normalize installed checkpoint, LoRA, and ControlNet names.
- List images available in the ComfyUI input directory.
- Upload a pose image through ComfyUI and return its stored name.
- Generate both canvas and API workflow JSON through the existing builders.
- Save canvas JSON under `user/default/workflows` using a validated filename.
- Save generated copies under `data/generated`.
- Queue API workflow JSON through ComfyUI `/prompt` and return the prompt ID.

Connection failures, unavailable node types, missing models, invalid reference images, and ComfyUI validation errors are returned as structured errors and remain visible in the UI until corrected or dismissed.

## User Interface

The application is a dense, work-focused editor rather than a landing page. The shell contains a compact sidebar, top connection/status bar, and one primary workspace.

### Generate

The default screen provides character, costume, style, and pose selectors; male count; generation parameters; section-based prompt overrides; live positive and negative previews; LoRA stack summary; and named prompt-section breakdowns.

Primary actions generate JSON, save the canvas workflow to ComfyUI, download either JSON format, or queue generation. Actions are disabled when validation fails. Queueing requires a healthy ComfyUI connection; local preview and JSON generation do not.

### Characters

Users create, duplicate, rename, and delete character presets. The editor covers identity terms, appearance terms, character LoRA filename/strengths/triggers, and a repeatable costume list with optional costume LoRAs.

### Styles

Users manage style terms and an optional style LoRA with filename, model/CLIP strengths, and trigger terms.

### Poses

Users manage subject layout, pose LoRA, all four interaction sections, camera terms, pose-specific negatives, and optional OpenPose settings. OpenPose controls include enabled state, reference image, preprocessor, mode, preview, ControlNet model, strength, start, and end percentages.

### Settings

Users configure the ComfyUI URL/root, checkpoint, dimensions, steps, CFG, sampler, scheduler, output prefix, and workflow filename. Model fields use searchable selectors populated from the connected ComfyUI instance while retaining manual entry when disconnected.

## Interaction Patterns

Array-valued prompt fields use token editors with add, remove, paste-list, and keyboard support. LoRA and model filenames use searchable comboboxes. Numeric strengths and percentages use bounded numeric inputs. Binary settings use switches. Preprocessor modes use a segmented control or select based on available width.

Unsaved forms are tracked per editor. Navigating away with unsaved changes prompts for confirmation. Destructive preset deletion requires confirmation and is blocked when the preset is used by the active generation request unless the user changes that request first.

## Data Flow

1. The frontend loads settings and all preset registries from the local service.
2. React forms edit local draft copies and send validated preset documents on save.
3. Generate selections create a typed `GenerationRequest`.
4. Existing builders resolve the request and provide prompt previews immediately.
5. Generate/save/queue actions send the typed request to the local service.
6. The service reloads persisted data, repeats validation, builds both formats, performs the requested filesystem or ComfyUI operation, and returns paths or prompt IDs.

Server-side reconstruction prevents browser state from bypassing validation or writing arbitrary workflow content.

## Testing

- Existing prompt/workflow tests remain unchanged and passing.
- Service tests cover atomic JSON persistence, path containment, schema rejection, model-list normalization, workflow saving, and mocked ComfyUI queue responses.
- React tests cover navigation, preset CRUD, token editing, dependent selectors, validation, prompt previews, connection status, generation, save, and queue actions.
- Browser verification runs the app at desktop and mobile widths, checks for text overlap, and exercises a complete character-to-workflow flow against a temporary local ComfyUI instance.

## Deliverables

- React/Vite application inside `comfyui-workflow-builder/web/`.
- Local Node service inside `comfyui-workflow-builder/server/`.
- Project JSON stores with migration-safe version fields.
- Unified development and production commands.
- Updated README with setup, ComfyUI connection, preset management, save, and queue instructions.
- Verified generated canvas workflow visible in ComfyUI.
