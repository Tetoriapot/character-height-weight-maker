import { useState, type CSSProperties } from "react";
import { ages, genders, clamp, profiles, profileFor, weightFor, lockWeight, proportions, type Character } from "../lib/character";

function NumberField({ value, min, max, step = 1, label, disabled, onChange }: {
  value: number; min: number; max: number; step?: number; label: string; disabled?: boolean; onChange: (value: number) => void;
}) {
  const [edit, setEdit] = useState<{ source: number; text: string } | null>(null);
  const draft = edit?.source === value ? edit.text : String(value);
  function commit() {
    const parsed = Number(draft);
    const next = draft.trim() && Number.isFinite(parsed) ? Math.round(clamp(parsed, min, max) / step) * step : value;
    const rounded = Math.round(next * 10) / 10;
    setEdit(null);
    onChange(rounded);
  }
  return <input type="number" aria-label={label} min={min} max={max} step={step} value={draft} disabled={disabled}
    onChange={(e) => setEdit({ source: value, text: e.target.value })} onBlur={commit}
    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} />;
}

export default function CharacterEditor({ character, slot, onChange, onGenerate, onSave, ready }: {
  character: Character; slot: number; onChange: (character: Character) => void; onGenerate: () => void; onSave: () => void; ready: boolean;
}) {
  const c = character;
  const profile = profileFor(c);
  const locked = c.lockedWeight !== null;
  const update = (patch: Partial<Character>) => onChange({ ...c, ...patch });
  return <div className="character-editor">
    <div className="name-field">
      <label htmlFor="character-name">キャラクター名 <small>任意・40文字まで</small></label>
      <input id="character-name" maxLength={40} value={c.name} placeholder={`キャラクター${slot ? "B" : "A"}`} onChange={(e) => update({ name: e.target.value })} />
    </div>
    <div className="field-group height-field">
      <div className="field-label-row"><label htmlFor="height-range">身長</label><div className="number-input-wrap">
        <NumberField label="身長の数値" value={c.height} min={100} max={230} onChange={(height) => update({ height })} /><span>cm</span>
      </div></div>
      <input id="height-range" className="height-range" type="range" min={100} max={230} value={c.height} onChange={(e) => update({ height: Number(e.target.value) })} style={{ "--range-progress": `${(c.height - 100) / 1.3}%` } as CSSProperties} />
      <div className="range-labels"><span>100cm</span><span>230cm</span></div>
    </div>
    <fieldset className="field-group"><legend>性別 <small>シルエットに反映</small></legend><div className="segmented three-cols">
      {genders.map((g) => <button type="button" key={g.id} aria-pressed={c.gender === g.id} className={c.gender === g.id ? "selected" : ""} onClick={() => update({ gender: g.id })}>{g.label}</button>)}
    </div></fieldset>
    <fieldset className="field-group"><legend>年齢</legend><div className="age-grid">
      {ages.map((a) => <button type="button" key={a.id} aria-pressed={c.age === a.id} className={c.age === a.id ? "selected" : ""} onClick={() => update({ age: a.id })}>{a.label}</button>)}
    </div></fieldset>
    <div className="field-group head-size-field">
      <div className="field-label-row"><label htmlFor="head-size">顔・頭の大きさ</label><output htmlFor="head-size">{Math.round(c.headScale * 100)}%</output></div>
      <input id="head-size" className="height-range" type="range" min="80" max="120" step="1" value={Math.round(c.headScale * 100)} onChange={(e) => update({ headScale: Number(e.target.value) / 100 })} style={{ "--range-progress": `${(c.headScale - 0.8) / 0.4 * 100}%` } as CSSProperties} />
      <div className="range-labels"><span>小さめ</span><span>大きめ</span></div>
      <div className="head-size-note"><span>約{(220 / (proportions(c.age, c.headScale).radius * 2)).toFixed(1)}頭身 · 身長は変わりません</span><button type="button" className="text-button" onClick={() => update({ headScale: 1 })}>標準に戻す</button></div>
    </div>
    <fieldset className="field-group body-field"><legend>体型</legend><div className="body-grid">
      {profiles.map((p) => <button type="button" key={p.id} className={c.bodyType === p.id ? "selected" : ""} aria-pressed={c.bodyType === p.id} onClick={() => update({ bodyType: p.id })}><span>{p.label}</span><small>BMI {p.min}–{p.max}</small></button>)}
    </div><p className="body-description"><span />{profile.description}</p></fieldset>
    <fieldset className="field-group weight-field"><legend>体重</legend>
      <div className="segmented two-cols">
        <button type="button" disabled={locked} className={c.weightMode === "auto" ? "selected" : ""} aria-pressed={c.weightMode === "auto"} onClick={() => update({ weightMode: "auto" })}>自動計算</button>
        <button type="button" disabled={locked} className={c.weightMode === "manual" ? "selected" : ""} aria-pressed={c.weightMode === "manual"} onClick={() => update({ weightMode: "manual", manualWeight: weightFor(c) })}>手動入力</button>
      </div>
      <div className="weight-value-row">
        <div className="number-input-wrap"><NumberField label="体重の数値" value={weightFor(c)} min={1} max={500} step={0.1} disabled={locked || c.weightMode !== "manual"} onChange={(manualWeight) => update({ manualWeight })} /><span>kg</span></div>
        <label className="check-control"><input type="checkbox" checked={locked} onChange={(e) => onChange(lockWeight(c, e.target.checked))} />この体重を固定</label>
      </div>
      <p className="field-hint">{locked ? "身長・体型を変えても、再生成しても体重は変わりません。" : c.weightMode === "manual" ? "1〜500kgを入力できます。シルエットは選択した体型に従います。" : "身長と体型から算出。生成ボタンで体重の候補を変えられます。"}</p>
      {["toddler", "elementary", "junior-high", "high-school"].includes(c.age) && <p className="field-hint">年齢は描画に反映します。体重は全年齢共通の創作向け計算です。必要に応じて手動で調整してください。</p>}
    </fieldset>
    <button className="generate-button" type="button" disabled={!ready} onClick={onGenerate}>✧ この設定で生成する <span className="button-arrow">→</span></button>
    <button className="secondary-button library-save" type="button" disabled={!ready} onClick={onSave}>＋ このキャラを保存</button>
    <p className="privacy-note">設定と保存キャラは、このブラウザに保存します</p>
  </div>;
}
