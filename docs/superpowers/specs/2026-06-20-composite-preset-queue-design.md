# Composite Preset Queue Design

## Goal

Replace the separate character, style, pose, and generate workspaces with a preset-first workflow where one saved composite preset is one ordered queue item. A preset owns the three LoRA selections and all prompt text needed to create an executable ComfyUI job.

## Navigation

The application sidebar contains only:

- **Presets** — create, clone, edit, and delete complete generation presets.
- **Queue** — arrange saved presets, set variants and seed behavior, save a queue plan, and submit it.
- **Settings** — configure ComfyUI connectivity, Payload template paths, output prefix, and maximum pending jobs.

## Composite preset

A composite preset stores:

- stable ID and display name;
- character, style, and pose LoRA filenames and model/CLIP strengths;
- six WAI prompt sections: master, trigger words, female, male, interaction/pose, and background;
- negative prompt terms.

LoRA filenames are selected from ComfyUI's `LoraLoader.lora_name` options. Trigger words are editable, but the editor pre-populates them from the preset's LoRA configuration. Cloning is the primary way to create a series that differs only by pose.

## Queue plan

A queue plan is an ordered array of entries. Each entry references one composite preset and stores enabled state and variant count. The plan also stores a base seed. Duplicate preset references are allowed. The queue page provides add, remove, move-up, move-down, enable/disable, and variant controls.

Expansion is deterministic: iterate enabled entries in visible order, then variants from zero to `variants - 1`. Seed equals `baseSeed + globalJobIndex`. One queue entry with three variants becomes three separate ComfyUI jobs.

## Execution

The server expands a plan into immutable job descriptors. Each job builds an API-format graph with its preset's LoRA stack and prompt sections, changes only the seed/output prefix per variant, and submits the graph to ComfyUI's `/prompt` endpoint. It records the returned prompt IDs in submission order.

The initial implementation uses the builder's executable graph path so batching is functional and testable. Payload canvas/API template patching remains an explicit follow-up boundary: the Settings UI exposes template paths, but reverse conversion of arbitrary canvas graphs is not mixed into this UI migration.

## Persistence and migration

Composite presets live in `data/presets/composites.json`; queue plans live in `data/queues.json`. Existing character/style/pose files remain untouched for rollback, but the new UI no longer edits them. On first load, if no composite preset exists, the store creates one migrated preset from the first existing character, style, and pose records.

## Error handling

- Reject missing preset references before any job is submitted.
- Reject empty queues, invalid variant counts, and duplicate preset IDs in the preset document.
- Return partial submission information if ComfyUI rejects a later job.
- Disable Queue while ComfyUI is disconnected.

## Verification

Backend tests cover storage, migration, deterministic expansion, seed/output naming, and ordered API submission. Web tests cover the reduced navigation, LoRA filename selection, preset save/clone, queue ordering, and queue submission payload. Existing prompt/workflow tests remain green.
