# ControlNet Preprocessor Preview Design

## Goal

Update only the generated ComfyUI workflow so the exact image sent into ControlNet is visible in a dedicated preview, matching the supplied reference workflow.

## Dependency

Install the official `Fannovel16/comfyui_controlnet_aux` package in `custom_nodes/comfyui_controlnet_aux` using the Python 3.12 runtime that launches this ComfyUI instance. The workflow builder will treat `AIO_Preprocessor` as a required node alongside its existing KJNodes requirements.

## Graph

For an enabled ControlNet pose preset, generate this image path:

```text
LoadImage -> AIO_Preprocessor -> PreviewImage (control map)
                              -> ControlNetApplyAdvanced.image

VAEDecode -> PreviewImage (final generated image)
          -> SaveImage
```

The original reference remains visible in `LoadImage`. `AIO_Preprocessor` receives the selected preprocessor name and resolution from the pose preset. Its output is the single authoritative control image used by both the control-map preview and ControlNet application.

The `bypass` mode remains supported: it sends the original loaded image directly to ControlNet and the control-map preview. Non-bypass modes use the AIO preprocessor. The control-map preview is always present whenever ControlNet is enabled.

## Configuration

Extend the pose ControlNet configuration with an AIO preprocessor selector and resolution. Existing mode values map to appropriate OpenPose preprocessors for backward compatibility. Default the example pose to a DWPose full-body/face/hand processor at 512 resolution and enable its preview.

## Canvas Layout

Place the reference loader, AIO preprocessor, control-map preview, ControlNet loader/apply nodes, and final output preview without overlaps. Give the two preview nodes explicit titles: `ControlNet Input Preview` and `Final Generated Preview`.

## Validation

Tests verify the AIO node inputs, the split output wiring, bypass behavior, always-on control preview, separate final preview, non-overlapping layout, and missing-node capability error. Regenerated workflow JSON must contain the same graph.

## Out of Scope

- Web UI changes.
- Displaying preview images in the workflow-builder browser app.
- Changing prompt sections, sampling, or output saving behavior.
