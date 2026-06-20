import { Plus, X } from "lucide-react";
import { useState } from "react";

export function TokenField({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => { const next = draft.split(/[,\n]/).map((term) => term.trim()).filter(Boolean); onChange([...new Set([...value, ...next])]); setDraft(""); };
  return <label className="field token-field"><span>{label}</span><div className="tokens">{value.map((term) => <button type="button" className="token" key={term} onClick={() => onChange(value.filter((item) => item !== term))}>{term}<X size={12}/></button>)}</div><div className="token-entry"><input value={draft} placeholder="Add terms" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }}/><button type="button" className="icon-button" title={`Add ${label}`} onClick={add}><Plus size={15}/></button></div></label>;
}

export function ModelField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return <label className="field"><span>{label}</span><input list={id} value={value} onChange={(event) => onChange(event.target.value)}/><datalist id={id}>{options.map((option) => <option key={option} value={option}/>)}</datalist></label>;
}
