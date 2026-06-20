export function PromptSectionEditor({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  return <label className="prompt-section-card"><span>{label}</span><small>{hint}</small><textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
