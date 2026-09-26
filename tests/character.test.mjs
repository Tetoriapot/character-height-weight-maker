import assert from "node:assert/strict";
import test from "node:test";
import {
  initialState, newCharacter, normalizeCharacter, normalizeState, normalizeLibrary,
  weightFor, bmiFor, lockWeight, regenerate, landmarks, pairNotes,
  sharePayload, encodeShare, decodeShare, MAX_SAVED, proportions,
} from "../app/lib/character.ts";

test("head sizes migrate safely, round-trip and move guides without changing weight or height", () => {
  assert.equal(normalizeCharacter({}).headScale, 1);
  assert.equal(normalizeCharacter({ headScale: 2 }).headScale, 1.2);
  assert.equal(normalizeCharacter({ headScale: -1 }).headScale, 0.8);
  assert.equal(normalizeCharacter({ headScale: NaN }).headScale, 1);
  const state = initialState();
  const before = state.characters[0];
  state.characters[0] = { ...before, headScale: 1.2 };
  const after = state.characters[0];
  assert.equal(weightFor(before), weightFor(after));
  assert.equal(before.height, after.height);
  assert.ok(landmarks(after)[0].height < landmarks(before)[0].height);
  assert.equal(decodeShare(`#c=${encodeShare(state)}`).characters[0].headScale, 1.2);
  assert.equal(normalizeLibrary([{ id: "head", character: after }])[0].character.headScale, 1.2);
  assert.equal(proportions("18-24", 1.2).headCenter + proportions("18-24", 1.2).radius, 220);
});

test("normalizes untrusted input and preserves safe defaults", () => {
  const c = normalizeCharacter({ height: 999, manualWeight: -10, seed: NaN, age: "unknown", gender: "unknown", name: "テスト\u0000\nキャラ" });
  assert.equal(c.height, 230);
  assert.equal(c.manualWeight, 1);
  assert.equal(c.seed, 0.34);
  assert.equal(c.age, "18-24");
  assert.equal(c.gender, "neutral");
  assert.equal(c.name, "テストキャラ");
  assert.equal(normalizeCharacter({ height: -1 }).height, 100);
  assert.equal(normalizeCharacter({ height: Infinity }).height, 172);
});

test("migrates the previous single-character draft without losing weight", () => {
  const legacy = { height: 185, gender: "male", age: "25-39", bodyType: "muscular", seed: 0.8, comparisonId: "door" };
  const migrated = normalizeState(legacy);
  assert.equal(migrated.mode, "object");
  assert.equal(migrated.characters[0].height, 185);
  assert.equal(migrated.comparisonId, "door");
  assert.equal(weightFor(migrated.characters[0]), weightFor(normalizeCharacter(legacy)));
  assert.equal(migrated.characters[1].height, 158);
});

test("manual and locked weights survive regeneration and height/body edits", () => {
  const auto = newCharacter();
  assert.notEqual(weightFor(regenerate(auto, () => 0)), weightFor(regenerate(auto, () => 1)));
  const manual = { ...auto, weightMode: "manual", manualWeight: 72.3 };
  assert.equal(weightFor(regenerate(manual, () => 1)), 72.3);
  const locked = lockWeight(auto, true);
  const edited = { ...regenerate(locked, () => 1), height: 210, bodyType: "large" };
  assert.equal(weightFor(edited), weightFor(auto));
  assert.equal(bmiFor(edited), weightFor(auto) / 2.1 ** 2);
  assert.notEqual(weightFor(lockWeight(edited, false)), weightFor(auto));
});

test("landmark guides use the same drawing proportions for all ages", () => {
  for (const age of ["toddler", "elementary", "junior-high", "high-school", "18-24", "senior"]) {
    const points = landmarks({ ...newCharacter(), height: 100, age });
    assert.equal(points.length, 4);
    assert.ok(points.every((p) => p.height > 0 && p.height < 100));
    assert.ok(points[0].height > points[1].height && points[1].height > points[2].height && points[2].height > points[3].height);
  }
});

test("pair notes cover equal height and either character being taller", () => {
  const a = { ...newCharacter(), name: "アオ", height: 160 };
  const b = { ...newCharacter(), name: "レン", height: 185 };
  assert.equal(pairNotes(a, b)[0], "レンはアオより25cm高い");
  assert.equal(pairNotes(b, a)[0], "レンはアオより25cm高い");
  assert.match(pairNotes(a, { ...b, height: 160 })[0], /同じ身長/);
});

test("share links round-trip Japanese names, settings and exact weight", () => {
  const state = initialState();
  state.characters[0] = { ...state.characters[0], name: "蒼 & 月🌙", weightMode: "manual", manualWeight: 62.7 };
  state.showGuides = true;
  const shared = decodeShare(`#c=${encodeShare(state)}`);
  assert.equal(shared.characters[0].name, "蒼 & 月🌙");
  assert.equal(weightFor(shared.characters[0]), 62.7);
  assert.equal(weightFor(shared.characters[1]), weightFor(state.characters[1]));
  assert.equal(shared.showGuides, true);
  assert.equal(shared.mode, "pair");
});

test("hidden weight removes original weight and seed from share payload", () => {
  const state = initialState();
  state.showWeight = false; state.showBmi = false;
  state.characters[0] = { ...state.characters[0], manualWeight: 412.7, weightMode: "manual", lockedWeight: 412.7, seed: 0.99821 };
  const json = JSON.stringify(sharePayload(state));
  assert.doesNotMatch(json, /412\.7|0\.99821|"weight"|"seed"|lockedWeight|manualWeight/);
  const shared = decodeShare(`#c=${encodeShare(state)}`);
  assert.equal(shared.showWeight, false);
  assert.equal(shared.showBmi, false);
  assert.equal(shared.characters[0].weightMode, "auto");
  assert.notEqual(weightFor(shared.characters[0]), 412.7);
  state.showBmi = true;
  assert.equal(sharePayload(state).characters[0].weight, 412.7);
});

test("single-character links do not serialize the unused partner", () => {
  const state = initialState(); state.mode = "object"; state.characters[1].name = "非公開の相手";
  assert.equal(sharePayload(state).characters.length, 1);
  assert.doesNotMatch(JSON.stringify(sharePayload(state)), /非公開の相手/);
  assert.equal(decodeShare(`#c=${encodeShare(state)}`).mode, "object");
});

test("rejects malformed, oversized, unsupported and incomplete links", () => {
  assert.equal(decodeShare("#top"), null);
  for (const hash of ["#c=", "#c=%%%", `#c=${"x".repeat(6001)}`, "#c=e30"]) assert.throws(() => decodeShare(hash));
  const encode = (payload) => `#c=${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  const payload = sharePayload(initialState());
  assert.throws(() => decodeShare(encode({ ...payload, v: 99 })));
  assert.throws(() => decodeShare(encode({ ...payload, characters: [] })));
  assert.throws(() => decodeShare(encode({ ...payload, characters: [{ height: 240 }, payload.characters[1]] })));
  assert.throws(() => decodeShare(encode({ ...payload, characters: [{ ...payload.characters[0], weight: null }, payload.characters[1]] })));
});

test("saved library validates entries, deduplicates IDs and caps count", () => {
  const item = { id: "saved", character: newCharacter(), savedAt: "2026-09-25" };
  assert.deepEqual(normalizeLibrary(null), []);
  assert.equal(normalizeLibrary([null, item, item, { id: "bad", character: [] }]).length, 1);
  assert.equal(normalizeLibrary(Array.from({ length: 60 }, (_, i) => ({ ...item, id: String(i) }))).length, MAX_SAVED);
  assert.equal(normalizeLibrary([{ ...item, id: "x".repeat(81) }, { ...item, id: "x".repeat(82) }]).length, 1);
});
