import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { exampleCouplePosePreset, exampleStylePreset, swanClairePreset } from "../../src/index.ts";
import App from "./App";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

beforeEach(() => {
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const data = {
    settings: { version: 1, comfyUrl: "http://127.0.0.1:8188", comfyRoot: "/ComfyUI", checkpointName: "wai.safetensors", workflowFileName: "Workflow.json", filenamePrefix: "output", generationDefaults: { width: 1024, height: 1024, steps: 28, cfg: 6, sampler: "dpmpp_2m", scheduler: "karras" } },
    presets: {
      characters: { version: 1, records: { [swanClairePreset.id]: swanClairePreset } },
      styles: { version: 1, records: { [exampleStylePreset.id]: exampleStylePreset } },
      poses: { version: 1, records: { [exampleCouplePosePreset.id]: exampleCouplePosePreset } },
    },
    connection: { connected: true, message: "Connected" }, models: { checkpoints: [], loras: [], controlnets: [] }, inputImages: [],
  };
  vi.stubGlobal("fetch", vi.fn(async (_path: string, init?: RequestInit) => ({
    ok: true,
    json: async () => ({ ok: true, data: init?.method === "POST" ? { canvas: {}, path: "workflow.json", promptId: "prompt-1" } : data }),
  })));
});

test("edits five responsive WAI prompt sections and sends them to generation", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByLabelText("Master / Quality")).toBeInTheDocument();
  for (const label of ["Female Character", "Male Character", "Interaction / Pose", "Background / Environment"]) {
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  }
  const female = screen.getByLabelText("Female Character");
  await user.clear(female);
  await user.type(female, "1woman, red hair");
  expect((screen.getByLabelText("Combined positive prompt") as HTMLTextAreaElement).value).toContain("red hair");
  await user.click(screen.getByRole("button", { name: "Generate & download" }));
  const postCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === "POST");
  const body = JSON.parse(String(postCall?.[1]?.body));
  expect(body.request.waiPromptSections.female).toEqual(["1woman", "red hair"]);
});

test("renders the complete app navigation and switches workspaces", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByRole("button", { name: "Generate" })).toBeInTheDocument();
  expect(screen.getByText("ComfyUI Workflow Builder")).toBeInTheDocument();
  for (const label of ["Generate", "Characters", "Styles", "Poses", "Settings"]) expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Styles" }));
  expect(screen.getByRole("heading", { name: "Styles" })).toBeInTheDocument();
});
