export type ComfyNodeReference = [string, number];

export interface ComfyNodeInput {
  [key: string]: string | number | boolean | ComfyNodeReference;
}

export interface ComfyNode {
  class_type: string;
  inputs: ComfyNodeInput;
}

export interface ComfyWorkflowJSON {
  prompt: Record<string, ComfyNode>;
}

export interface BuiltWorkflow {
  workflow: ComfyWorkflowJSON;
  nodeMap: Record<string, string>;
}
