import { Activity, Bot, Brush, Menu, RefreshCw, Settings, Sparkles, Users, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import type { BootstrapPayload, PresetDocuments } from "../../src/index.ts";
import { api, putJson } from "./api";
import { CharactersPage, PosesPage, SettingsPage, StylesPage } from "./pages/Editors";
import { GeneratePage } from "./pages/GeneratePage";

const NAV = [{ id: "generate", label: "Generate", icon: Sparkles }, { id: "characters", label: "Characters", icon: Users }, { id: "styles", label: "Styles", icon: Brush }, { id: "poses", label: "Poses", icon: Activity }, { id: "settings", label: "Settings", icon: Settings }] as const;
type Page = typeof NAV[number]["id"];
export default function App() {
  const [page, setPage] = useState<Page>("generate"); const [data, setData] = useState<BootstrapPayload>(); const [error, setError] = useState(""); const [mobileNav, setMobileNav] = useState(false);
  const refresh = async () => { try { setData(await api<BootstrapPayload>("/api/bootstrap")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load"); } };
  useEffect(() => { void refresh(); }, []);
  const savePreset = async (kind: keyof PresetDocuments, document: any) => { await putJson(`/api/presets/${kind}`, document); await refresh(); };
  if (!data) return <div className="loading"><Workflow size={24}/><strong>ComfyUI Workflow Builder</strong><span>{error || "Loading workspace..."}</span></div>;
  return <div className="app-shell"><aside className={mobileNav ? "sidebar open" : "sidebar"}><div className="brand"><Workflow/><strong>ComfyUI Workflow Builder</strong></div><nav>{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={page === id ? "active" : ""} onClick={() => { setPage(id); setMobileNav(false); }}><Icon size={18}/>{label}</button>)}</nav><div className="sidebar-foot"><Bot size={16}/><span>Local control panel</span></div></aside><div className="app-main"><div className="topbar"><button className="mobile-menu" title="Open navigation" onClick={() => setMobileNav(!mobileNav)}><Menu size={18}/></button><div className={data.connection.connected ? "connection connected" : "connection"}><i/>{data.connection.message}<code>{data.settings.comfyUrl}</code></div><button className="refresh" onClick={refresh}><RefreshCw size={15}/>Refresh</button></div>{page === "generate" ? <GeneratePage data={data}/> : page === "characters" ? <CharactersPage document={data.presets.characters} loras={data.models.loras} save={(doc) => savePreset("characters", doc)}/> : page === "styles" ? <StylesPage document={data.presets.styles} loras={data.models.loras} save={(doc) => savePreset("styles", doc)}/> : page === "poses" ? <PosesPage document={data.presets.poses} loras={data.models.loras} controlnets={data.models.controlnets} images={data.inputImages} save={(doc) => savePreset("poses", doc)}/> : <SettingsPage settings={data.settings} checkpoints={data.models.checkpoints} save={async (settings) => { await putJson("/api/settings", settings); await refresh(); }}/>}</div></div>;
}
