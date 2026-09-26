import { useEffect, useRef, useState } from "react";
import updates from "../data/updates.json";

type Panel = "updates" | "help" | null;

export default function HeaderTools({ theme, onThemeChange }: {
  theme: "light" | "dark"; onThemeChange: (theme: "light" | "dark") => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (panel && !dialog.current?.open) dialog.current?.showModal();
    if (!panel && dialog.current?.open) dialog.current.close();
  }, [panel]);

  return <>
    <nav className="header-tools" aria-label="サイトメニュー">
      <button className="header-tool" type="button" aria-haspopup="dialog" onClick={() => setPanel("updates")}>更新情報</button>
      <div className="theme-switch" role="group" aria-label="表示モード">
        <button type="button" aria-label="ライトモード" aria-pressed={theme === "light"} onClick={() => onThemeChange("light")}><span aria-hidden="true">☀</span><span>ライト</span></button>
        <button type="button" aria-label="ダークモード" aria-pressed={theme === "dark"} onClick={() => onThemeChange("dark")}><span aria-hidden="true">☾</span><span>ダーク</span></button>
      </div>
      <button className="header-tool" type="button" aria-haspopup="dialog" onClick={() => setPanel("help")}><span className="help-icon" aria-hidden="true">?</span>Help</button>
    </nav>
    <dialog ref={dialog} className="info-dialog" aria-labelledby="info-title" onCancel={() => setPanel(null)} onClose={() => setPanel(null)} onClick={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
      <div className="info-dialog-inner">
        <div className="info-dialog-heading"><div><p>CHARACTER MAKER</p><h2 id="info-title">{panel === "updates" ? "更新情報" : "Help · 使い方"}</h2></div><button type="button" className="dialog-close" aria-label="閉じる" autoFocus onClick={() => setPanel(null)}>×</button></div>
        {panel === "updates" ? <div className="update-list">{updates.map((update) => <article key={update.version}>
          <div className="update-meta"><time dateTime={update.date}>{update.date.replaceAll("-", ".")}</time><span>v{update.version}</span></div>
          <h3>{update.title}</h3><ul>{update.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>)}</div> : <div className="help-content">
          <section><h3>1. キャラクターを設定する</h3><p>A・Bを切り替えて、身長・年齢・体型を設定します。顔・頭の大きさは80〜120%で調整できます。頭を変えても入力した身長は変わりません。</p></section>
          <section><h3>2. 同じ縮尺で比べる</h3><p>「2人で比べる」または「身近な物と比べる」を選びます。身体位置ガイドをオンにすると、目・肩・腰・膝の位置を確認できます。比較用の人物も髪のないマネキンです。</p></section>
          <section><h3>3. 保存・共有する</h3><p>PNG保存では結果カードだけを書き出します。背景透過や体重・BMIの非表示にも対応。比較URLには表示中の設定が含まれるため、名前など公開したくない情報にはご注意ください。</p></section>
          <section><h3>保存したキャラはどこにある？</h3><p>設定・キャラ一覧・表示モードは、この端末のブラウザに保存されます。ログインやサーバーへの送信は不要です。ブラウザデータの削除で消え、別端末や移転前のサイトとは自動同期されません。</p></section>
          <section><h3>体重やシルエットについて</h3><p>創作資料用の近似です。体重は体型別のBMIテーブルから計算し、手動入力・固定もできます。頭部の調整は体重に影響しません。健康・成長の評価には使用しないでください。</p></section>
        </div>}
      </div>
    </dialog>
  </>;
}
