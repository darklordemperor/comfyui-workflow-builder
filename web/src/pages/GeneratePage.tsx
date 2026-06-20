import { Download, FileJson, Play, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { joinWaiPromptSections, previewPromptSections, type BootstrapPayload, type GenerationRequest, type PresetsRegistry, type WaiPromptSections } from "../../../src/index.ts";
import { postJson } from "../api";
import { PromptSectionEditor } from "../components/PromptSectionEditor";
import { TokenField } from "../components/TokenField";

type SectionKey = keyof WaiPromptSections;
type SectionText = Record<SectionKey, string>;
const SECTION_EDITORS: Array<{ key: SectionKey; label: string; hint: string }> = [
  { key: "master", label: "Master / Quality", hint: "Quality, aesthetic, medium, artist and style tags" },
  { key: "female", label: "Female Character", hint: "Subject count, identity, appearance and clothing" },
  { key: "male", label: "Male Character", hint: "Identity, appearance, clothing and position" },
  { key: "interactionPose", label: "Interaction / Pose", hint: "Actions, contact, pose, framing and camera" },
  { key: "background", label: "Background / Environment", hint: "Location, scenery, lighting and atmosphere" },
];
const toText = (sections: WaiPromptSections): SectionText => Object.fromEntries(SECTION_EDITORS.map(({ key }) => [key, sections[key].join(", ")])) as SectionText;
const parseTerms = (value: string): string[] => [...new Set(value.split(/[,\n]/).map((term) => term.trim()).filter(Boolean))];
const toSections = (text: SectionText): WaiPromptSections => Object.fromEntries(SECTION_EDITORS.map(({ key }) => [key, parseTerms(text[key])])) as unknown as WaiPromptSections;

export function GeneratePage({ data }: { data: BootstrapPayload }) {
  const characters = Object.values(data.presets.characters.records), styles = Object.values(data.presets.styles.records), poses = Object.values(data.presets.poses.records);
  const [characterId, setCharacter] = useState(characters[0]?.id ?? "");
  const character = data.presets.characters.records[characterId];
  const [costumeId, setCostume] = useState(character ? Object.keys(character.costumes)[0] ?? "" : "");
  const [styleId, setStyle] = useState(styles[0]?.id ?? ""), [poseId, setPose] = useState(poses[0]?.id ?? "");
  const [maleCount, setMaleCount] = useState(poses[0]?.subjectLayout.maleCount ?? 1);
  const [additionalNegative, setAdditionalNegative] = useState<string[]>([]), [sectionText, setSectionText] = useState<SectionText>(), [message, setMessage] = useState("");
  const registry: PresetsRegistry = { characters: data.presets.characters.records, styles: data.presets.styles.records, poses: data.presets.poses.records };
  const baseRequest: GenerationRequest = { femaleCharacterPresetId: characterId, costumePresetId: costumeId, stylePresetId: styleId || undefined, posePresetId: poseId, maleCount, generationParams: data.settings.generationDefaults, promptOverrides: { additionalNegative: { append: additionalNegative } } };
  const basePreview = useMemo(() => { try { return previewPromptSections(baseRequest, registry); } catch { return null; } }, [characterId, costumeId, styleId, poseId, maleCount, additionalNegative, data]);
  const selectionKey = `${characterId}|${costumeId}|${styleId}|${poseId}|${maleCount}`;
  useEffect(() => { if (basePreview) setSectionText(toText(basePreview.waiSections)); }, [selectionKey]);
  const activeText = sectionText ?? (basePreview ? toText(basePreview.waiSections) : undefined);
  const waiPromptSections = activeText ? toSections(activeText) : undefined;
  const request: GenerationRequest = { ...baseRequest, ...(waiPromptSections ? { waiPromptSections } : {}) };
  const preview = useMemo(() => { try { return previewPromptSections(request, registry); } catch { return null; } }, [request, registry]);
  const combinedPositive = waiPromptSections ? joinWaiPromptSections(waiPromptSections) : "";
  const action = async (name: "generate" | "save" | "queue") => {
    try {
      const result = await postJson<any>(`/api/workflows/${name}`, { request });
      setMessage(name === "queue" ? `Queued ${result.promptId}` : name === "save" ? `Saved ${result.path}` : "Workflow JSON generated");
      if (name === "generate") { const url = URL.createObjectURL(new Blob([JSON.stringify(result.canvas, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = data.settings.workflowFileName; link.click(); URL.revokeObjectURL(url); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Action failed"); }
  };
  return <main className="workspace generate"><header><h1>Generate</h1><p>Build five WAI-Illustrious prompt sections and send the joined workflow to ComfyUI.</p></header><div className="generate-grid">
    <section className="panel"><h2>Selections</h2>
      <label className="field"><span>Character</span><select value={characterId} onChange={(event) => { setCharacter(event.target.value); setCostume(Object.keys(data.presets.characters.records[event.target.value]?.costumes ?? {})[0] ?? ""); }}>{characters.map((item) => <option key={item.id}>{item.id}</option>)}</select></label>
      <label className="field"><span>Costume</span><select value={costumeId} onChange={(event) => setCostume(event.target.value)}>{Object.keys(character?.costumes ?? {}).map((id) => <option key={id}>{id}</option>)}</select></label>
      <label className="field"><span>Style</span><select value={styleId} onChange={(event) => setStyle(event.target.value)}>{styles.map((item) => <option key={item.id}>{item.id}</option>)}</select></label>
      <label className="field"><span>Pose</span><select value={poseId} onChange={(event) => { setPose(event.target.value); setMaleCount(data.presets.poses.records[event.target.value]?.subjectLayout.maleCount ?? 1); }}>{poses.map((item) => <option key={item.id}>{item.id}</option>)}</select></label>
      <label className="field"><span>Male count</span><input type="number" min="0" value={maleCount} onChange={(event) => setMaleCount(Number(event.target.value))}/></label>
      <h2>Generation</h2><div className="compact-grid"><Metric label="Width" value={data.settings.generationDefaults.width}/><Metric label="Height" value={data.settings.generationDefaults.height}/><Metric label="Steps" value={data.settings.generationDefaults.steps}/><Metric label="CFG" value={data.settings.generationDefaults.cfg}/></div>
    </section>
    <section className="panel prompt-panel"><h2>Positive prompt sections</h2>
      {activeText ? <div className="prompt-sections-grid">{SECTION_EDITORS.map(({ key, label, hint }) => <PromptSectionEditor key={key} label={label} hint={hint} value={activeText[key]} onChange={(value) => setSectionText((current) => ({ ...(current ?? activeText), [key]: value }))}/>)}</div> : <div className="empty-state">Resolve preset selections to edit prompts.</div>}
      <label className="field combined-prompt"><span className="positive">Combined positive prompt</span><textarea aria-label="Combined positive prompt" readOnly value={combinedPositive}/></label>
      <TokenField label="Additional negative" value={additionalNegative} onChange={setAdditionalNegative}/>
      <label className="field"><span className="negative">Negative prompt</span><textarea readOnly value={preview?.negativePrompt ?? ""}/></label>
      <h2>LoRA stack</h2><div className="stack">{preview?.loraStack.map((lora, index) => <div key={`${lora.fileName}-${index}`}><b>{index + 1}</b><span>{lora.fileName}</span><small>{lora.strengthModel.toFixed(2)} / {lora.strengthClip.toFixed(2)}</small></div>)}</div>
    </section>
    <section className="panel inspector"><h2>Actions</h2><button className="primary action" disabled={!preview || !combinedPositive} onClick={() => action("generate")}><FileJson size={16}/>Generate & download</button><button className="action" disabled={!preview || !combinedPositive} onClick={() => action("save")}><Save size={16}/>Save to ComfyUI</button><button className="action" disabled={!preview || !combinedPositive || !data.connection.connected} onClick={() => action("queue")}><Play size={16}/>Queue generation</button><button className="action" disabled><Download size={16}/>API JSON included</button><div className="activity">{message || "Ready"}</div><h2>Section breakdown</h2><div className="breakdown">{preview?.positiveSectionBreakdown.map((section) => <div key={section.sectionName}><strong>{section.sectionName}</strong><span>{section.terms.length} terms</span></div>)}</div></section>
  </div></main>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
