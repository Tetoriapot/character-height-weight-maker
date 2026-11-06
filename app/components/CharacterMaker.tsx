"use client";

import { useEffect, useRef, useState } from "react";
import CharacterEditor from "./CharacterEditor";
import HeaderTools from "./HeaderTools";
import { ComparisonIcon, ScaleScene } from "./ScaleScene";
import {
  ages, genders, comparisons, profileFor, weightFor, bmiFor, characterName, landmarks, pairNotes,
  initialState, normalizeState, normalizeLibrary, regenerate, encodeShare, decodeShare,
  STORAGE_KEY, LEGACY_KEY, LIBRARY_KEY, MAX_SAVED,
  type Character, type MakerState, type SavedCharacter,
} from "../lib/character";

function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "mini-brand" : "brand"}><span className="brand-mark" aria-hidden="true">↕</span><span>身長・体重メーカー</span></span>;
}

function CharacterSummary({ character: c, slot, state }: { character: Character; slot: number; state: MakerState }) {
  const profile = profileFor(c);
  return <section className={`character-summary summary-${slot}`} aria-label={`${slot ? "B" : "A"}の結果`}>
    <h3><span className={`slot-dot slot-${slot}`}>{slot ? "B" : "A"}</span>{characterName(c, slot)}</h3>
    <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${2 + Number(state.showWeight) + Number(state.showBmi)}, minmax(0, 1fr))` }}>
      <div className="primary-stat"><span>HEIGHT</span><strong>{c.height}</strong><b>cm</b></div>
      {state.showWeight && <div className="primary-stat"><span>WEIGHT</span><strong>{weightFor(c)}</strong><b>kg</b></div>}
      {state.showBmi && <div className="secondary-stat"><span>BMI</span><strong>{bmiFor(c).toFixed(1)}</strong></div>}
      <div className="secondary-stat"><span>BODY</span><strong>{profile.label}</strong></div>
    </div>
    <div className="character-meta"><span>{genders.find((g) => g.id === c.gender)?.label}</span><i /><span>{ages.find((a) => a.id === c.age)?.label}</span></div>
  </section>;
}

function lifeNotes(c: Character) {
  const ref = (id: string) => comparisons.find((item) => item.id === id)!.height;
  const diff = (id: string, label: string) => {
    const delta = c.height - ref(id);
    return delta === 0 ? `${label}と同じ高さ` : `${label}より${Math.abs(delta)}cm${delta > 0 ? "高い" : "低い"}`;
  };
  const nearest = (id: string, label: string) => {
    const point = landmarks(c).reduce((best, item) => Math.abs(item.height - ref(id)) < Math.abs(best.height - ref(id)) ? item : best);
    const delta = Math.round(ref(id) - point.height);
    return Math.abs(delta) < 8 ? `${label}は${point.label}のあたり` : `${label}は${point.label}から約${Math.abs(delta)}cm${delta > 0 ? "上" : "下"}`;
  };
  return [diff("average-man", "男性の目安身長"), diff("average-woman", "女性の目安身長"), nearest("door-knob", "ドアノブ"), diff("kei-car", "軽自動車の屋根"), nearest("school-desk", "学校の机"), diff("vending-machine", "自動販売機")];
}

export default function CharacterMaker() {
  const [state, setState] = useState<MakerState>(initialState);
  const [activeSlot, setActiveSlot] = useState(0);
  const [library, setLibrary] = useState<SavedCharacter[]>([]);
  const [undo, setUndo] = useState<{ item: SavedCharacter; index: number } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState("読み込み中…");
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [restoredShared, setRestoredShared] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
      // Hydrate browser-only data after SSR; the draft is not persisted until the user edits it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setState(normalizeState(JSON.parse(stored)));
      setStorageStatus("このブラウザに自動保存");
    } catch { setStorageStatus("保存データを読み込めませんでした"); }
    try {
      const saved = localStorage.getItem(LIBRARY_KEY);
      if (saved) setLibrary(normalizeLibrary(JSON.parse(saved)));
    } catch { setMessage("保存キャラを読み込めませんでした。この画面では引き続き作成できます。"); }
    try {
      const savedTheme = localStorage.getItem("character-maker-theme");
      setTheme(savedTheme === "dark" || (savedTheme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");
    } catch { /* Optional preference; the default light theme remains usable. */ }
    function readShared() {
      try {
        const shared = decodeShare(window.location.hash);
        if (shared) {
          setState(shared); setActiveSlot(0); setRestoredShared(true);
          setShareUrl(""); setStorageStatus("共有データを表示中");
          setMessage("共有された比較を読み込みました。保存キャラ一覧はそのままです。");
        }
      } catch (error) { setMessage(error instanceof Error ? error.message : "共有URLを読み込めませんでした。"); }
    }
    readShared();
    window.addEventListener("hashchange", readShared);
    setReady(true);
    return () => window.removeEventListener("hashchange", readShared);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("character-maker-theme", theme); } catch { /* Theme still works for this visit. */ }
  }, [theme, ready]);

  const a = state.characters[0], b = state.characters[1];
  const current = state.characters[activeSlot];
  const comparison = comparisons.find((entry) => entry.id === state.comparisonId) ?? comparisons[0];
  const pair = state.mode === "pair";
  const notes = pair ? pairNotes(a, b) : lifeNotes(a);

  function change(next: MakerState) {
    setState(next); setShareUrl(""); setRestoredShared(false);
    if (ready) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageStatus("このブラウザに自動保存済み"); }
      catch { setStorageStatus("自動保存できません・この画面のみ保持"); }
    }
    if (window.location.hash.startsWith("#c=")) history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  function changeCharacter(character: Character, slot = activeSlot) {
    const characters: [Character, Character] = [...state.characters];
    characters[slot] = character;
    change({ ...state, characters });
  }
  function persistLibrary(next: SavedCharacter[], success: string) {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); setLibrary(next); setMessage(success); return true;
    } catch { setMessage("保存できませんでした。ブラウザの保存設定や空き容量を確認してください。"); return false; }
  }
  function saveCharacter() {
    if (library.length >= MAX_SAVED) { setMessage(`保存は${MAX_SAVED}件までです。不要なキャラを削除してから保存してください。`); return; }
    const snapshot = { ...current, name: characterName(current, activeSlot) };
    const entry = { id: crypto.randomUUID(), character: snapshot, savedAt: new Date().toISOString() };
    persistLibrary([entry, ...library], `${snapshot.name}を保存しました。現在の体重も再現できます。`);
  }
  function loadCharacter(entry: SavedCharacter, slot: number) {
    const characters: [Character, Character] = [...state.characters];
    characters[slot] = { ...entry.character };
    change({ ...state, characters, mode: slot === 1 ? "pair" : state.mode });
    setActiveSlot(slot); setMessage(`${entry.character.name}を${slot ? "B" : "A"}に読み込みました。`);
  }
  async function savePng() {
    if (!resultRef.current || saving) return;
    setSaving(true); setSaveError("");
    try {
      const { downloadCard } = await import("../lib/export-card");
      await downloadCard(resultRef.current, transparent, pair ? `${characterName(a)}-${characterName(b, 1)}-身長比較` : `${characterName(a)}-${a.height}cm`);
      setMessage("PNGを作成しました。ダウンロード先を確認してください。");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "画像保存に失敗しました。もう一度お試しください。");
    } finally { setSaving(false); }
  }
  async function share() {
    const url = new URL(window.location.href);
    url.search = ""; url.hash = `c=${encodeShare(state)}`;
    setShareUrl(url.href);
    try {
      await navigator.clipboard.writeText(url.href);
      setMessage("比較URLをコピーしました。相手も同じ設定を開けます。");
    } catch {
      setMessage("下の共有URLを選択してコピーしてください。");
      requestAnimationFrame(() => { shareRef.current?.focus(); shareRef.current?.select(); });
    }
  }

  return <main className="site-shell">
    <header className="site-header"><a href="#top" aria-label="身長・体重メーカー トップへ"><Brand /></a><HeaderTools theme={theme} onThemeChange={setTheme} /></header>
    <section className="hero" id="top"><p className="eyebrow"><span />CREATOR&apos;S TOOL #01</p><h1>キャラクターの<br className="mobile-break" /><em>身長・体格</em>を比較</h1>
      <p className="hero-copy">2人の身長差と、目・肩・腰・膝の位置を確認。<br />身近な物との比較を、創作資料として保存できます。</p>
      <div className="hero-points"><span>✓ 2人の身長差</span><span>✓ キャラ保存</span><span>✓ PNG・URL共有</span></div>
    </section>
    <div className="workspace-toolbar">
      <div className="mode-switch" aria-label="比較モード">
        <button type="button" aria-pressed={pair} className={pair ? "selected" : ""} onClick={() => change({ ...state, mode: "pair" })}>2人で比べる</button>
        <button type="button" aria-pressed={!pair} className={!pair ? "selected" : ""} onClick={() => { change({ ...state, mode: "object" }); setActiveSlot(0); }}>身近な物と比べる</button>
      </div>
      <span className="save-note" role="status">{storageStatus}</span>
    </div>
    <section className="maker-layout" aria-label="キャラクター設定と生成結果">
      <div className="editor-column">
        <aside className="settings-card" aria-labelledby="settings-heading">
          <div className="section-heading"><span className="step-number">01</span><div><p>CHARACTER SETUP</p><h2 id="settings-heading">キャラクター設定</h2></div></div>
          {pair && <div className="character-tabs" aria-label="編集するキャラクター">
            {[a, b].map((c, i) => <button type="button" key={i} className={activeSlot === i ? "selected" : ""} aria-pressed={activeSlot === i} onClick={() => setActiveSlot(i)}><span className={`slot-dot slot-${i}`}>{i ? "B" : "A"}</span><span>{characterName(c, i)}</span></button>)}
          </div>}
          <CharacterEditor key={activeSlot} character={current} slot={activeSlot} onChange={changeCharacter} ready={ready}
            onSave={saveCharacter} onGenerate={() => { changeCharacter(regenerate(current)); setMessage(current.lockedWeight !== null || current.weightMode === "manual" ? "指定した体重で結果を更新しました。" : "体重の候補を更新しました。"); resultRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); }} />
        </aside>
        <section className="library-panel" aria-labelledby="library-title"><div className="library-heading"><h2 id="library-title">保存したキャラ</h2><span>{library.length} / {MAX_SAVED}</span></div>
          <p className="field-hint">保存時の設定をA・Bに呼び出せます。編集後は別の保存として追加します。</p>
          {library.length === 0 && <p className="library-empty">「このキャラを保存」で<br />いつもの登場人物をここに。</p>}
          <ul className="saved-list">{library.map((entry, index) => <li key={entry.id}>
            <div><strong>{entry.character.name || "名前なし"}</strong><small>{entry.character.height}cm · {weightFor(entry.character)}kg · {profileFor(entry.character).label}</small></div>
            <div className="library-buttons"><button type="button" aria-label={`${entry.character.name}をAに読み込む`} onClick={() => loadCharacter(entry, 0)}>Aへ</button><button type="button" aria-label={`${entry.character.name}をBに読み込む`} onClick={() => loadCharacter(entry, 1)}>Bへ</button><button className="delete-saved" type="button" aria-label={`${entry.character.name}の保存を削除`} onClick={() => { if (persistLibrary(library.filter((c) => c.id !== entry.id), "保存を削除しました。元に戻せます。")) setUndo({ item: entry, index }); }}>×</button></div>
          </li>)}</ul>
          {undo && <button type="button" className="text-button" onClick={() => {
            if (library.length >= MAX_SAVED) { setMessage("保存件数が上限のため復元できません。1件空けてください。"); return; }
            const restored = [...library]; restored.splice(Math.min(undo.index, restored.length), 0, undo.item);
            if (persistLibrary(restored, "削除したキャラを復元しました。")) setUndo(null);
          }}>直前の削除を元に戻す</button>}
        </section>
      </div>
      <section className="result-column" aria-labelledby="result-heading">
        <div className="view-controls">
          <label className="check-control"><input type="checkbox" checked={state.showGuides} onChange={(e) => change({ ...state, showGuides: e.target.checked })} />身体位置ガイド</label>
          <div className="visibility-controls"><span>カード・URLに表示：</span><label className="check-control"><input type="checkbox" checked={state.showWeight} onChange={(e) => change({ ...state, showWeight: e.target.checked })} />体重</label><label className="check-control"><input type="checkbox" checked={state.showBmi} onChange={(e) => change({ ...state, showBmi: e.target.checked })} />BMI</label></div>
        </div>
        {!pair && <div className="object-choices"><div className="comparison-controls"><h3>何と比べる？</h3><label className="comparison-select-wrap"><span className="sr-only">比較対象を選択</span><select value={state.comparisonId} onChange={(e) => change({ ...state, comparisonId: e.target.value })}>
          {Array.from(new Set(comparisons.map((c) => c.group))).map((group) => <optgroup key={group} label={group}>{comparisons.filter((c) => c.group === group).map((c) => <option key={c.id} value={c.id}>{c.label}（{c.height}cm）</option>)}</optgroup>)}
        </select></label></div><div className="quick-comparisons">{["average-man", "average-woman", "door", "vending-machine", "kei-car"].map((id) => {
          const item = comparisons.find((c) => c.id === id)!;
          return <button type="button" key={id} className={id === state.comparisonId ? "selected" : ""} aria-pressed={id === state.comparisonId} onClick={() => change({ ...state, comparisonId: id })}><ComparisonIcon comparison={item} /><span>{item.shortLabel}</span></button>;
        })}</div></div>}
        <div className="result-card" id="character-result" ref={resultRef}>
          <div className="result-topline"><div className="section-heading compact"><span className="step-number">02</span><div><p>{pair ? "SIDE BY SIDE" : "LIFE SIZE"}</p><h2 id="result-heading">{pair ? "ふたりの身長比較" : "生成結果"}</h2></div></div><span className="result-badge">CHARACTER DATA</span></div>
          <div className={pair ? "summary-grid paired" : "summary-grid"}><CharacterSummary character={a} slot={0} state={state} />{pair && <CharacterSummary character={b} slot={1} state={state} />}</div>
          <ScaleScene character={a} partner={pair ? b : undefined} comparison={comparison} showGuides={state.showGuides} />
          {state.showGuides && <div className="guide-table-wrap"><table className="guide-table"><caption>身体位置の目安（床からの高さ・cm）</caption><thead><tr><th scope="col">位置</th><th scope="col">A</th>{pair && <th scope="col">B</th>}</tr></thead><tbody>{landmarks(a).map((point, i) => <tr key={point.id}><th scope="row">{point.label}</th><td>{point.height.toFixed(1)}</td>{pair && <td>{landmarks(b)[i].height.toFixed(1)}</td>}</tr>)}</tbody></table></div>}
          <div className="insights-section"><div className="insights-heading"><div><p>{pair ? "RELATIONSHIP NOTES" : "LIFE-SIZE NOTES"}</p><h3>{pair ? "ふたりを描くヒント" : "このキャラは…"}</h3></div><span>サイズ感のメモ</span></div>
            <div className={`insight-grid${pair ? " pair-notes" : ""}`}>{notes.map((note, i) => <div className="insight-item" key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{note}</p></div>)}</div>
          </div>
          <p className="result-disclaimer">シルエットと身体位置は創作向けの目安です。個人差や姿勢は反映しません。{!pair && "比較対象の寸法は代表例です。"}</p>
          <div className="card-footer"><Brand compact /><p>FOR CHARACTER CREATORS</p></div>
        </div>
        <div className="result-actions">
          <label className="check-control transparent-option"><input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />背景を透過して保存</label>
          <div className="export-buttons"><button className="save-button" type="button" onClick={savePng} disabled={!ready || saving}>{saving ? "画像を作成中…" : "↓ 結果をPNGで保存"}</button><button className="secondary-button" type="button" disabled={!ready} onClick={share}>↗ 比較URLをコピー</button></div>
          <p>カード全体を幅1800pxで保存。体重・BMIの表示設定も反映します。</p>
          {saveError && <p className="error-message" role="alert">{saveError}</p>}
          {shareUrl && <div className="share-panel"><label htmlFor="share-url">共有URL</label><input id="share-url" ref={shareRef} value={shareUrl} readOnly onFocus={(e) => e.target.select()} /><p>表示中のキャラの名前・身長・体型などを含みます。保存キャラ一覧は含みません。{state.showWeight || state.showBmi ? "体重またはBMIを表示しているため、正確な体重も含まれます。" : "非表示の体重・BMIは含みません。"}</p></div>}
          {restoredShared && !state.showWeight && !state.showBmi && <p>共有元の体重は含まれていません。表示を有効にすると、この画面での推定値が表示されます。</p>}
        </div>
      </section>
    </section>
    <div className="toast" role="status" aria-live="polite" aria-atomic="true">{message && <><span>{message}</span><button type="button" aria-label="通知を閉じる" onClick={() => setMessage("")}>×</button></>}</div>
    <section className="how-it-works" aria-labelledby="how-heading"><p className="eyebrow"><span />QUICK GUIDE</p><h2 id="how-heading">設定・比較・保存の手順</h2><div className="guide-grid">
      <div><span>1</span><strong>A・Bを設定する</strong><p>名前・身長・体型を設定。よく使うキャラは保存して、いつでも呼び出せます。</p></div>
      <div><span>2</span><strong>並べて確かめる</strong><p>身長差や目線、肩・腰・膝の位置を比較。身近な物との比較にも切り替えられます。</p></div>
      <div><span>3</span><strong>創作の資料にする</strong><p>必要な情報だけ表示してPNG保存。比較URLなら同じ設定を相手も開けます。</p></div>
    </div></section>
    <footer className="site-footer"><Brand /><p>キャラクターの身長・体格を比較する創作資料ツール</p><small>体重・BMIは創作向けの目安です。医療的な判断には使用しないでください。保存データはブラウザのデータ削除で消去されます。</small></footer>
  </main>;
}
