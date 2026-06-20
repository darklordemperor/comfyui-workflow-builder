import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { AppSettings, PresetDocument, PresetDocuments } from "../src/types/app.types.ts";
import type { CharacterPreset, StylePreset } from "../src/types/lora.types.ts";
import type { PosePreset } from "../src/types/pose.types.ts";

type Kind = keyof PresetDocuments;
const FILES: Record<Kind, string> = { characters: "characters.json", styles: "styles.json", poses: "poses.json" };

export function createStore(dataRoot: string) {
  const presetsRoot = join(dataRoot, "presets");
  const generatedRoot = join(dataRoot, "generated");
  async function readJson<T>(path: string): Promise<T> { return JSON.parse(await readFile(path, "utf8")) as T; }
  async function readDocument<T>(path: string): Promise<PresetDocument<T>> {
    try { return await readJson<PresetDocument<T>>(path); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, records: {} }; throw error; }
  }
  async function writeJsonAtomic(path: string, value: unknown) {
    await mkdir(join(path, ".."), { recursive: true });
    const temp = `${path}.tmp-${Math.random().toString(36).slice(2)}`;
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temp, path);
  }
  function validateDocument<T extends { id: string }>(document: PresetDocument<T>) {
    if (document.version !== 1 || !document.records) throw new Error("Unsupported preset document");
    for (const [id, record] of Object.entries(document.records)) if (id !== record.id) throw new Error(`Preset key does not match id: ${id}`);
  }
  return {
    async readSettings() { return readJson<AppSettings>(join(dataRoot, "settings.json")); },
    async writeSettings(value: AppSettings) {
      if (value.version !== 1 || !value.comfyUrl.startsWith("http")) throw new Error("Invalid settings");
      await writeJsonAtomic(join(dataRoot, "settings.json"), value);
    },
    async readPresetDocuments(): Promise<PresetDocuments> {
      const [characters, styles, poses] = await Promise.all([
        readDocument<CharacterPreset>(join(presetsRoot, FILES.characters)),
        readDocument<StylePreset>(join(presetsRoot, FILES.styles)),
        readDocument<PosePreset>(join(presetsRoot, FILES.poses)),
      ]);
      return { characters, styles, poses };
    },
    async writePresetDocument(kind: Kind, value: PresetDocuments[Kind]) {
      validateDocument(value as PresetDocument<{ id: string }>);
      await writeJsonAtomic(join(presetsRoot, FILES[kind]), value);
    },
    resolveWorkflowPath(name: string) {
      if (basename(name) !== name || !/^[\w .-]+\.json$/i.test(name)) throw new Error("Expected a valid workflow filename");
      return join(generatedRoot, name);
    },
    writeJsonAtomic,
  };
}
