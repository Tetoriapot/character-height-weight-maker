import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import * as character from "../app/lib/character.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the character maker", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /身長・体重メーカー/);
  assert.match(html, /キャラクター設定/);
  assert.match(html, /ふたりの身長比較/);
  assert.equal((html.match(/data-silhouette-style="mannequin"/g) ?? []).length, 2);
  assert.equal((html.match(/data-pose="feet-together"/g) ?? []).length, 2);
  assert.match(html, /身体位置ガイド/);
  assert.match(html, /顔・頭の大きさ/);
  assert.match(html, /サイトメニュー/);
  assert.match(html, /更新情報/);
  assert.match(html, /Help/);
  assert.match(html, /ライトモード/);
  assert.match(html, /ダークモード/);
  assert.match(html, /保存したキャラ/);
  assert.match(html, /比較URLをコピー/);
  assert.match(html, /結果をPNGで保存/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("uses hairless mannequins for every gender and keeps height fixed for all head sizes", async () => {
  const source = await readFile(new URL("../app/components/MannequinSilhouette.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const require = createRequire(import.meta.url);
  const componentModule = { exports: {} };
  const resolve = (id) => id === "../lib/character" ? character : require(id);
  new Function("require", "module", "exports", outputText)(resolve, componentModule, componentModule.exports);
  const Silhouette = componentModule.exports.default;

  for (const { id: gender } of character.genders) {
    for (const { id: age } of character.ages) {
      for (const { width: widthScale } of character.profiles) {
        for (const headScale of [0.8, 1, 1.2]) {
          const html = renderToStaticMarkup(Silhouette({ x: 100, baseY: 300, pixelHeight: 220, gender, age, widthScale, headScale }));
          assert.match(html, /data-pose="feet-together"/);
          assert.match(html, /data-silhouette-style="mannequin"/);
          assert.doesNotMatch(html, /data-hairstyle|NaN|Infinity|undefined/);
          assert.equal((html.match(/<path /g) ?? []).length, 6);
          assert.match(html, /translate\(100 300\) scale\(1\)/);
          const p = character.proportions(age, headScale);
          assert.equal(p.headCenter + p.radius, 220);
          assert.ok(p.shoulder > p.waist);
        }
      }
    }
  }
});

test("keeps editable BMI and comparison data external", async () => {
  const [bmiSource, comparisonSource, packageSource] = await Promise.all([
    readFile(new URL("../app/data/bmi-profiles.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/comparisons.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const bmiProfiles = JSON.parse(bmiSource);
  const comparisons = JSON.parse(comparisonSource);

  assert.equal(bmiProfiles.length, 7);
  assert.ok(bmiProfiles.every((item) => item.min < item.max && item.width > 0));
  assert.ok(comparisons.length >= 15);
  assert.ok(comparisons.every((item) => item.id && item.height > 0 && item.kind));
  assert.match(packageSource, /"html2canvas": "1\.4\.1"/);
});
