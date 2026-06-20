export interface ComfyUIInputSlot {
  localized_name?: string;
  name: string;
  type: string;
  widget?: { name: string };
  shape?: number;
  link: number | null;
}

export interface ComfyUIOutputSlot {
  localized_name: string;
  name: string;
  type: string;
  links: number[] | null;
}

export interface ComfyUICanvasNode {
  id: number;
  type: string;
  title?: string;
  pos: [number, number];
  size: [number, number];
  flags: Record<string, unknown>;
  order: number;
  mode: number;
  inputs: ComfyUIInputSlot[];
  outputs: ComfyUIOutputSlot[];
  properties: Record<string, unknown>;
  widgets_values: Array<string | number | boolean>;
}

export type ComfyUILink = [number, number, number, number, number, string];

export interface ComfyUICanvasWorkflow {
  id: string;
  revision: number;
  last_node_id: number;
  last_link_id: number;
  nodes: ComfyUICanvasNode[];
  links: ComfyUILink[];
  groups: unknown[];
  config: Record<string, unknown>;
  extra: {
    ds: {
      scale: number;
      offset: [number, number];
    };
  };
  version: 0.4;
}
