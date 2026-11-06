# 身長・体重メーカー

キャラクターの体格を、シルエット・身長差・身近な物で確かめる創作資料ツール。
Vite / vinext / React / TypeScript、SVG、html2canvas を使用しています。

## 起動・検証

Node.js 22.13以上。依存関係は `pnpm install` で導入できます。

```sh
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm dev:pages
pnpm build:pages
```

Windows/macOS/Linux 共通の起動スクリプトを使います。
`typecheck` はアプリ本体を検査します。スターターに残る未使用の D1 サンプル・Worker の型定義は対象外です。

## 第1段階：実装済み

- 2人比較：A/Bそれぞれの名前・身長・性別・年齢・体型を設定。共通スケールで描画。
- キャラ保存：ブラウザ内に最大40件、A/Bへ呼び出し、直前の削除を取り消し。
- 身体位置ガイド：目・肩・腰・膝の線と床からの高さ。描画と計算は同じ比率を使用。
- 体重の手動入力・固定：1〜500kg。固定時は身長・体型変更や再生成で変化しない。
- PNG保存：幅1800px、背景透過、体重/BMI表示切り替え、ライト/ダーク対応。
- URL共有：表示中の1人または2人の設定を再現。保存一覧は含めない。
- 髪のないマネキン：全性別・比較用人物に共通の滑らかな頭部。足をそろえた立ち姿。
- 顔・頭の大きさ：80〜120%で調整。身長を固定し、身体位置ガイド・保存・共有・PNGに反映。
- 右上メニュー：更新情報、ライト／ダーク切替、Help。ダイアログはEscでも閉じられます。

身近な物との比較、100〜230cmの入力、7体型、8年齢区分は従来どおり利用できます。

## 保存・共有の扱い

`localStorage`の保存キーは次の3つです。

- `character-maker-settings-v2`：現在の設定。旧版の `character-maker-settings-v1` も読込可能。
- `character-maker-library-v1`：保存キャラ一覧。
- `character-maker-theme`：テーマ設定。

共有URLは `#c=` に設定を含み、開いた時点では保存一覧とローカルの作業中設定を上書きしません。
共有画面を編集すると、新しい作業中設定として保存します。
体重・BMIを両方非表示にしたURLには、元の体重や乱数の種を含めません。
BMIのみ表示する場合も体重を逆算できるため、正確な体重を含む旨を画面に表示します。
URLは暗号化されていません。名前など、含まれる情報はリンクを知る人に見えます。
GitHub Pages版は公開サイトです。URLに含まれる設定はリンクを知る人が閲覧できます。
旧Sites版はそのまま残り、ブラウザ保存は異なるドメイン間で自動移行されません。

保存は端末・ブラウザ単位です。ブラウザデータを削除すると消え、別端末には同期しません。
保存に失敗した場合は通知し、成功と表示しないようにしています。

## 変更しやすい構成

| ファイル | 役割 |
| --- | --- |
| `app/data/bmi-profiles.json` | 体型別BMI範囲・シルエット幅 |
| `app/data/comparisons.json` | 比較対象の代表寸法・分類 |
| `app/lib/character.ts` | 計算・検証・旧版移行・共有データ |
| `app/components/CharacterEditor.tsx` | 1人分の入力UI |
| `app/components/ScaleScene.tsx` | SVG比較図・身体位置ガイド |
| `app/components/MannequinSilhouette.tsx` | 髪のないマネキンSVG・頭部サイズ |
| `app/components/HeaderTools.tsx` / `app/data/updates.json` | 右上メニュー・ヘルプ・更新履歴 |
| `app/components/CharacterMaker.tsx` | 状態・保存一覧・画面構成 |
| `app/lib/export-card.ts` | SVGのスタイル解決・PNG書き出し |
| `app/globals.css` / `app/maker-expansion.css` | 共通デザイン・拡張UI・レスポンシブ |

PNGではhtml2canvasが複製したSVGの固定スタイルを解除し、書き出し幅と透過設定を適用してから画像化します。

## 検証

`pnpm test` は本番ビルド後、計算・固定・入力検証・旧版移行・日本語URLの復元・非表示情報の除外・保存件数・サーバーレンダリングを検査します。
画面確認では名前/身長/体重編集、固定、保存と再読込、共有URL、PC/スマホ幅、ダークモード、PNGを確認します。

## 制約と次の段階

身体比率はイラスト用の近似で、身体測定や医学的な推定ではありません。
マネキンは頭頂から足底までを表示身長に合わせます。標準の成人は約7.5頭身、幼児・小学生は頭を大きめにし、頭部サイズ調整後も身体ガイドと同じ比率で配置します。
胴体・左右の腕・左右の脚を別々の輪郭で描画します。脚は中央の細い境界で分け、足をそろえた姿勢を保ちます。
年齢は描画に反映しますが、体重計算は全年齢共通の創作向けテーブルです。
体重を手動変更しても、シルエットは選択した体型に従います。
比較対象の寸法は代表例で、製品・地域等により異なります。

3人以上の比較、種族、姿勢調整、PDF、作品単位の管理などは未実装です。
第1段階の使い勝手を確認しながら、比較人数や表現の拡張へ進めます。

## マネキンの参考資料

2026-11-07の形状修正では、[CLIP STUDIO PAINT公式の3Dデッサン人形ガイド](https://help.clip-studio.com/en-us/manual_en/660_3d/Adjusting_a_3D_Drawing_Figure_Body_Shape.htm)に掲載された正面図と体格別の画像を参照しました。
肩から上腕への丸み、胴と骨盤のつながり、太もも・膝・ふくらはぎの太さの変化を参考にしています。公開画像や3Dモデルのデータは組み込まず、既存SVGの制御点を調整しました。
表示は正面・閉脚の簡略化した輪郭です。3D表示やポーズ編集は追加していません。頭頂・足底・身体位置ガイドの基準は維持しています。

## 配信

GitHub Pages版は `web/` を入口に既存Reactコンポーネントをそのまま使用します。
`pnpm build:pages` の出力は `dist-pages/`。サーバーや認証・データベースは不要です。
`vite.pages.config.ts` は `PAGES_BASE_PATH` で公開先のサブパスに対応します。
GitHubのSettings → PagesでSourceをGitHub Actionsにすると、`.github/workflows/pages.yml`がmain更新時に検証・公開します。
公式資料：[ViteのGitHub Pages設定](https://vite.dev/guide/static-deploy#github-pages)、[GitHub Pagesのワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

Sites の既存プロジェクトIDは `.openai/hosting.json` で管理します。
本番出力は `dist/`。ソースをコミット・送信してから、その状態で生成したビルドを配信します。
ログイン・データベースはアプリ機能には不要です。配信先のアクセス制限はホスティング側で独立して管理します。
