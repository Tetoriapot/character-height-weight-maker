import profiles from "../data/bmi-profiles.json" with { type: "json" };
import comparisons from "../data/comparisons.json" with { type: "json" };

export { profiles, comparisons };
export const STORAGE_KEY = "character-maker-settings-v2";
export const LEGACY_KEY = "character-maker-settings-v1";
export const LIBRARY_KEY = "character-maker-library-v1";
export const MAX_SAVED = 40;
export const genders = [{ id: "male", label: "男性" }, { id: "female", label: "女性" }, { id: "neutral", label: "中性的" }];
export const ages = [
  { id: "toddler", label: "幼児" }, { id: "elementary", label: "小学生" },
  { id: "junior-high", label: "中学生" }, { id: "high-school", label: "高校生" },
  { id: "18-24", label: "18〜24歳" }, { id: "25-39", label: "25〜39歳" },
  { id: "40-59", label: "40〜59歳" }, { id: "senior", label: "60歳以上" },
];
export type Character = {
  name: string; height: number; gender: string; age: string; bodyType: string; headScale: number;
  seed: number; weightMode: "auto" | "manual"; manualWeight: number; lockedWeight: number | null;
};
export type MakerState = {
  version: 2; characters: [Character, Character]; mode: "pair" | "object";
  comparisonId: string; showGuides: boolean; showWeight: boolean; showBmi: boolean;
};
export type SavedCharacter = { id: string; character: Character; savedAt: string };

export function newCharacter(second = false): Character {
  return { name: "", height: second ? 158 : 172, gender: "neutral", age: "18-24", bodyType: "average", headScale: 1, seed: 0.34, weightMode: "auto", manualWeight: second ? 52 : 61, lockedWeight: null };
}
export function initialState(): MakerState {
  return { version: 2, characters: [newCharacter(), newCharacter(true)], mode: "pair", comparisonId: "average-man", showGuides: false, showWeight: true, showBmi: true };
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
function numeric(value: unknown, fallback: number, min: number, max: number, precision = 1) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(clamp(value, min, max) * precision) / precision : fallback;
}
function choice(value: unknown, values: { id: string }[], fallback: string) {
  return typeof value === "string" && values.some(({ id }) => value === id) ? value : fallback;
}
export function normalizeCharacter(value: unknown, fallback = newCharacter()): Character {
  const v = record(value);
  return {
    name: typeof v.name === "string" ? v.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 40) : fallback.name,
    height: numeric(v.height, fallback.height, 100, 230),
    headScale: numeric(v.headScale, fallback.headScale, 0.8, 1.2, 100),
    gender: choice(v.gender, genders, fallback.gender), age: choice(v.age, ages, fallback.age),
    bodyType: choice(v.bodyType, profiles, fallback.bodyType),
    seed: numeric(v.seed, fallback.seed, 0, 1, 1000000),
    weightMode: v.weightMode === "manual" ? "manual" : "auto",
    manualWeight: numeric(v.manualWeight, fallback.manualWeight, 1, 500, 10),
    lockedWeight: typeof v.lockedWeight === "number" && Number.isFinite(v.lockedWeight) ? numeric(v.lockedWeight, 61, 1, 500, 10) : null,
  };
}
export function normalizeState(value: unknown): MakerState {
  const v = record(value);
  const d = initialState();
  const chars = Array.isArray(v.characters) ? v.characters : [v]; // Migrate the original single-character draft.
  return {
    version: 2,
    characters: [normalizeCharacter(chars[0]), normalizeCharacter(chars[1], newCharacter(true))],
    mode: Array.isArray(v.characters) && v.mode !== "object" ? "pair" : "object",
    comparisonId: choice(v.comparisonId, comparisons, d.comparisonId),
    showGuides: v.showGuides === true,
    showWeight: v.showWeight !== false,
    showBmi: v.showBmi !== false,
  };
}
export function normalizeLibrary(value: unknown): SavedCharacter[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.slice(0, MAX_SAVED).flatMap((entry) => {
    const v = record(entry);
    if (typeof v.id !== "string" || !v.id || !v.character || typeof v.character !== "object" || Array.isArray(v.character)) return [];
    const id = v.id.slice(0, 80);
    if (ids.has(id)) return [];
    ids.add(id);
    return [{ id, character: normalizeCharacter(v.character), savedAt: typeof v.savedAt === "string" ? v.savedAt.slice(0, 40) : "" }];
  });
}
export function profileFor(character: Character) {
  return profiles.find(({ id }) => id === character.bodyType) ?? profiles[2];
}
export function weightFor(character: Character) {
  if (character.lockedWeight !== null) return character.lockedWeight;
  if (character.weightMode === "manual") return character.manualWeight;
  const profile = profileFor(character);
  return Math.round((profile.min + (profile.max - profile.min) * character.seed) * (character.height / 100) ** 2);
}
export function bmiFor(character: Character) {
  return weightFor(character) / (character.height / 100) ** 2;
}
export function lockWeight(character: Character, locked: boolean): Character {
  return { ...character, lockedWeight: locked ? weightFor(character) : null };
}
export function regenerate(character: Character, random: () => number = Math.random): Character {
  return character.lockedWeight !== null || character.weightMode === "manual" ? character : { ...character, seed: clamp(random(), 0, 1) };
}
export function characterName(character: Character, slot = 0) {
  return character.name.trim() || `キャラクター${slot === 0 ? "A" : "B"}`;
}

// Normalized illustration proportions, shared by the silhouette, guides and prose.
// These are drawing aids, not measurements inferred from BMI or medical reference values.
export function proportions(age: string, headScale = 1) {
  const toddler = age === "toddler";
  const child = age === "elementary";
  const junior = age === "junior-high";
  const size = Number.isFinite(headScale) ? clamp(headScale, 0.8, 1.2) : 1;
  const radius = (toddler ? 24 : child ? 19.5 : junior ? 16 : 14.7) * size;
  return {
    radius, headCenter: 220 - radius, eyes: 220 - radius * 1.18,
    shoulder: 220 - radius * 2 - 12,
    waist: toddler ? 119 : child ? 125 : 132,
    hip: toddler ? 96 : child ? 104 : 112,
    knee: toddler ? 43 : child ? 49 : 57,
    shoulderScale: toddler ? 0.84 : child ? 0.9 : junior ? 0.95 : age === "senior" ? 0.98 : 1,
  };
}
export function landmarks(character: Character) {
  const p = proportions(character.age, character.headScale);
  return [
    { id: "eyes", label: "目", ratio: p.eyes / 220 },
    { id: "shoulder", label: "肩", ratio: p.shoulder / 220 },
    { id: "waist", label: "腰", ratio: p.waist / 220 },
    { id: "knee", label: "膝", ratio: p.knee / 220 },
  ].map((point) => ({ ...point, height: Math.round(character.height * point.ratio * 10) / 10 }));
}
export function pairNotes(a: Character, b: Character) {
  const diff = a.height - b.height;
  const an = characterName(a, 0), bn = characterName(b, 1);
  const eyeDiff = Math.abs(landmarks(a)[0].height - landmarks(b)[0].height).toFixed(1);
  const taller = diff >= 0 ? a : b;
  const shorter = diff >= 0 ? b : a;
  const tn = diff >= 0 ? an : bn, sn = diff >= 0 ? bn : an;
  const closest = [{ label: "頭頂", height: taller.height }, ...landmarks(taller)]
    .reduce((best, p) => Math.abs(p.height - shorter.height) < Math.abs(best.height - shorter.height) ? p : best);
  return [
    diff === 0 ? `${an}と${bn}は同じ身長` : `${tn}は${sn}より${Math.abs(diff)}cm高い`,
    `目の位置の差は約${eyeDiff}cm`,
    Math.abs(closest.height - shorter.height) <= 10 ? `${sn}の頭頂は${tn}の${closest.label}付近` : `${sn}の頭頂は${tn}の${closest.label}から約${Math.round(Math.abs(closest.height - shorter.height))}cm${shorter.height > closest.height ? "上" : "下"}`,
  ];
}

// Only the displayed cast goes into a share URL. The local character library never does.
// When both weight and BMI are hidden, no seed or exact weight is serialized.
export function sharePayload(state: MakerState) {
  return {
    v: 2, mode: state.mode, comparisonId: state.comparisonId, showGuides: state.showGuides,
    showWeight: state.showWeight, showBmi: state.showBmi,
    characters: state.characters.slice(0, state.mode === "pair" ? 2 : 1).map((c) => ({
      name: c.name, height: c.height, gender: c.gender, age: c.age, bodyType: c.bodyType, headScale: c.headScale,
      ...(state.showWeight || state.showBmi ? { weight: weightFor(c) } : {}),
    })),
  };
}
export function encodeShare(state: MakerState) {
  const bytes = new TextEncoder().encode(JSON.stringify(sharePayload(state)));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function decodeShare(hash: string): MakerState | null {
  if (!hash.startsWith("#c=")) return null;
  const encoded = hash.slice(3);
  if (encoded.length > 6000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error("共有URLの形式を確認してください。");
  try {
    const bytes = Uint8Array.from(atob(encoded.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
    const parsed = record(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    if (parsed.v !== 2 || !["pair", "object"].includes(String(parsed.mode)) || !Array.isArray(parsed.characters) || parsed.characters.length !== (parsed.mode === "pair" ? 2 : 1)) throw new Error();
    const characters = parsed.characters.map((entry: unknown) => {
      const c = record(entry);
      if (typeof c.height !== "number" || !Number.isFinite(c.height) || c.height < 100 || c.height > 230) throw new Error();
      const showExact = parsed.showWeight !== false || parsed.showBmi !== false;
      if (showExact && (typeof c.weight !== "number" || !Number.isFinite(c.weight) || c.weight < 1 || c.weight > 500)) throw new Error();
      return normalizeCharacter({ ...c, weightMode: showExact ? "manual" : "auto", manualWeight: showExact ? c.weight : 61, lockedWeight: showExact ? c.weight : null });
    });
    return normalizeState({ ...parsed, characters });
  } catch {
    throw new Error("共有URLを読み込めませんでした。リンクが途中で切れていないか確認してください。");
  }
}
