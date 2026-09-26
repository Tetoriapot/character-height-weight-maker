import { useId } from "react";
import { characterName, landmarks, profileFor, type Character } from "../lib/character";
import Silhouette from "./MannequinSilhouette";

export type Comparison = {
  id: string;
  label: string;
  shortLabel: string;
  height: number;
  kind: string;
  group: string;
};

type ObjectShapeProps = {
  kind: string;
  x: number;
  baseY: number;
  pixelHeight: number;
  className?: string;
};

const objectWidths: Record<string, number> = {
  door: 118,
  doorKnob: 92,
  vending: 116,
  traffic: 72,
  shelf: 126,
  desk: 170,
  chair: 108,
  keiCar: 218,
  car: 225,
  sofa: 190,
  fridge: 116,
  bed: 210,
};

function ObjectShape({ kind, x, baseY, pixelHeight, className }: ObjectShapeProps) {
  const width = className === "mini-object" ? 38 : (objectWidths[kind] ?? 120);
  const common = { className, "aria-hidden": true };
  const frame = { x: x - width / 2, y: baseY - pixelHeight, width, height: pixelHeight };

  return (
    <svg {...common} {...frame} viewBox="0 0 100 100" preserveAspectRatio="none">
      {kind === "door" && (
        <>
          <rect className="object-fill" x="13" y="2" width="74" height="98" rx="3" />
          <rect className="object-detail" x="21" y="8" width="58" height="86" rx="2" />
          <circle className="object-accent" cx="69" cy="52" r="3.5" />
        </>
      )}
      {kind === "doorKnob" && (
        <>
          <rect className="object-line" x="49" y="3" width="3" height="97" rx="1.5" />
          <circle className="object-fill" cx="50" cy="7" r="10" />
          <rect className="object-accent" x="49" y="5" width="30" height="5" rx="2.5" />
        </>
      )}
      {kind === "vending" && (
        <>
          <rect className="object-fill" x="8" y="2" width="84" height="98" rx="5" />
          <rect className="object-detail" x="16" y="10" width="68" height="34" rx="3" />
          {[0, 1, 2].map((row) => (
            <g key={row}>
              {[0, 1, 2, 3].map((col) => (
                <rect className="object-can" key={col} x={20 + col * 15} y={15 + row * 9} width="8" height="5" rx="2" />
              ))}
            </g>
          ))}
          <rect className="object-accent" x="62" y="53" width="18" height="12" rx="2" />
          <rect className="object-dark" x="22" y="78" width="56" height="11" rx="2" />
        </>
      )}
      {kind === "traffic" && (
        <>
          <rect className="object-line" x="46" y="16" width="8" height="84" rx="3" />
          <rect className="object-fill" x="24" y="1" width="52" height="36" rx="7" />
          <circle className="object-accent" cx="50" cy="19" r="9" />
        </>
      )}
      {kind === "shelf" && (
        <>
          <rect className="object-fill" x="6" y="2" width="88" height="98" rx="3" />
          {[20, 39, 58, 77].map((y) => <rect className="object-detail" key={y} x="13" y={y} width="74" height="4" rx="1" />)}
          {[13, 31, 49, 67].map((xPos) => <rect className="object-accent-soft" key={xPos} x={xPos} y="7" width="13" height="11" rx="2" />)}
        </>
      )}
      {kind === "desk" && (
        <>
          <rect className="object-fill" x="5" y="10" width="90" height="24" rx="3" />
          <path className="object-line" d="M18 30 L13 100 M82 30 L87 100" />
          <rect className="object-detail" x="16" y="37" width="68" height="10" rx="2" />
        </>
      )}
      {kind === "chair" && (
        <>
          <rect className="object-fill" x="18" y="3" width="64" height="45" rx="8" />
          <rect className="object-fill" x="13" y="48" width="74" height="17" rx="4" />
          <path className="object-line" d="M23 61 L16 100 M77 61 L84 100" />
        </>
      )}
      {(kind === "keiCar" || kind === "car") && (
        <>
          <path className="object-fill" d={kind === "keiCar" ? "M7 46 Q12 20 31 13 L72 13 Q88 23 94 48 L97 78 Q92 87 80 87 L18 87 Q5 84 4 73 Z" : "M3 55 Q8 37 25 31 L43 14 L72 16 L88 37 Q96 45 98 63 L94 81 L7 81 Z"} />
          <path className="object-window" d={kind === "keiCar" ? "M25 25 L44 20 L68 20 Q77 26 82 43 L20 43 Z" : "M31 34 L47 20 L69 21 L81 38 Z"} />
          <circle className="object-dark" cx="24" cy="82" r="12" />
          <circle className="object-dark" cx="78" cy="82" r="12" />
          <circle className="object-wheel" cx="24" cy="82" r="5" />
          <circle className="object-wheel" cx="78" cy="82" r="5" />
        </>
      )}
      {kind === "sofa" && (
        <>
          <rect className="object-fill" x="5" y="27" width="90" height="55" rx="13" />
          <rect className="object-detail" x="13" y="8" width="74" height="53" rx="15" />
          <path className="object-line" d="M50 13 V61" />
          <rect className="object-dark" x="16" y="81" width="8" height="19" rx="2" />
          <rect className="object-dark" x="76" y="81" width="8" height="19" rx="2" />
        </>
      )}
      {kind === "fridge" && (
        <>
          <rect className="object-fill" x="8" y="2" width="84" height="98" rx="6" />
          <path className="object-line" d="M9 40 H91" />
          <rect className="object-accent" x="74" y="11" width="5" height="22" rx="2.5" />
          <rect className="object-accent" x="74" y="49" width="5" height="18" rx="2.5" />
        </>
      )}
      {kind === "bed" && (
        <>
          <rect className="object-fill" x="3" y="38" width="94" height="45" rx="8" />
          <rect className="object-detail" x="8" y="14" width="30" height="30" rx="10" />
          <rect className="object-line" x="7" y="79" width="5" height="21" rx="2" />
          <rect className="object-line" x="88" y="79" width="5" height="21" rx="2" />
        </>
      )}
    </svg>
  );
}

export function ComparisonIcon({ comparison }: { comparison: Comparison }) {
  if (["person", "child"].includes(comparison.kind)) {
    return (
      <svg className="comparison-icon" viewBox="0 0 48 48" aria-hidden="true">
        <Silhouette x={24} baseY={45} pixelHeight={39} widthScale={comparison.kind === "child" ? 0.82 : 0.92} gender={comparison.id === "average-woman" ? "female" : comparison.id === "average-man" ? "male" : "neutral"} age={comparison.kind === "child" ? "elementary" : "adult"} muted />
      </svg>
    );
  }

  return (
    <svg className="comparison-icon" viewBox="0 0 48 48" aria-hidden="true">
      <ObjectShape kind={comparison.kind} x={24} baseY={45} pixelHeight={38} className="mini-object" />
    </svg>
  );
}

export function ScaleScene({
  character, partner, comparison, showGuides = false,
}: {
  character: Character;
  partner?: Character;
  comparison: Comparison;
  showGuides?: boolean;
}) {
  const baseY = 416;
  const pixelsPerCm = 1.55;
  const { height, gender, age } = character;
  const widthScale = profileFor(character).width;
  const characterHeight = height * pixelsPerCm;
  const referenceHeight = partner?.height ?? comparison.height;
  const comparisonHeight = referenceHeight * pixelsPerCm;
  const difference = height - referenceHeight;
  const relativeText = difference === 0 ? "同じ高さ" : `身長差 ${Math.abs(difference)}cm`;
  const firstName = characterName(character, 0);
  const secondName = partner ? characterName(partner, 1) : comparison.shortLabel;
  const gradientId = `glow-${useId().replaceAll(":", "")}`;

  return (
    <div className="scene-wrap">
      <svg
        className="scale-scene"
        viewBox="0 0 800 470"
        role="img"
        aria-label={`${firstName} ${height}cmと${secondName} ${referenceHeight}cmの比較`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--scene-glow-start)" />
            <stop offset="1" stopColor="var(--scene-glow-end)" />
          </linearGradient>
        </defs>
        <rect className="scene-background" x="0" y="0" width="800" height="470" rx="22" />
        <circle className="scene-glow" cx="400" cy="198" r="178" fill={`url(#${gradientId})`} />
        {[50, 100, 150, 200].map((mark) => {
          const y = baseY - mark * pixelsPerCm;
          return (
            <g className="height-grid" key={mark}>
              <line x1="62" y1={y} x2="746" y2={y} />
              <text x="42" y={y + 4}>{mark}</text>
            </g>
          );
        })}
        <line className="ground-line" x1="48" y1={baseY} x2="752" y2={baseY} />

        <g className="character-figure">
          <Silhouette x={270} baseY={baseY} pixelHeight={characterHeight} widthScale={widthScale} gender={gender} age={age} headScale={character.headScale} />
        </g>
        {partner ? (
          <g className="partner-figure">
            <Silhouette x={566} baseY={baseY} pixelHeight={comparisonHeight} widthScale={profileFor(partner).width} gender={partner.gender} age={partner.age} headScale={partner.headScale} />
          </g>
        ) : ["person", "child"].includes(comparison.kind) ? (
          <g className="comparison-figure">
            <Silhouette
              x={566}
              baseY={baseY}
              pixelHeight={comparisonHeight}
              widthScale={comparison.kind === "child" ? 0.82 : 0.94}
              gender={comparison.id === "average-woman" ? "female" : comparison.id === "average-man" ? "male" : "neutral"}
              age={comparison.kind === "child" ? "elementary" : "adult"}
              muted
            />
          </g>
        ) : (
          <g className="comparison-object">
            <ObjectShape kind={comparison.kind} x={566} baseY={baseY} pixelHeight={comparisonHeight} />
          </g>
        )}

        <g className="measurement character-measurement">
          <line x1="188" y1={baseY - characterHeight} x2="188" y2={baseY} />
          <line x1="180" y1={baseY - characterHeight} x2="196" y2={baseY - characterHeight} />
          <line x1="180" y1={baseY} x2="196" y2={baseY} />
          <rect x="145" y={baseY - characterHeight / 2 - 17} width="86" height="34" rx="17" />
          <text x="188" y={baseY - characterHeight / 2 + 5}>{height}cm</text>
        </g>
        <g className="measurement comparison-measurement">
          <line x1="666" y1={baseY - comparisonHeight} x2="666" y2={baseY} />
          <line x1="658" y1={baseY - comparisonHeight} x2="674" y2={baseY - comparisonHeight} />
          <line x1="658" y1={baseY} x2="674" y2={baseY} />
          <rect x="627" y={baseY - comparisonHeight / 2 - 15} width="78" height="30" rx="15" />
          <text x="666" y={baseY - comparisonHeight / 2 + 5}>{referenceHeight}cm</text>
        </g>
        {showGuides && [character, ...(partner ? [partner] : [])].map((c, index) => (
          <g className={`body-guides guides-${index}`} key={index}>
            {landmarks(c).map((point) => {
              const cx = index === 0 ? 270 : 566;
              const y = baseY - c.height * point.ratio * pixelsPerCm;
              return <g key={point.id}>
                <line x1={cx - 53} x2={cx + 68} y1={y} y2={y} />
                <circle cx={cx} cy={y} r="2.6" />
                <text x={cx + 73} y={y + 4}>{point.label}</text>
              </g>;
            })}
          </g>
        ))}
        <text className="figure-label character-label" x="270" y="449">{firstName.length > 14 ? `${firstName.slice(0, 13)}…` : firstName}</text>
        <text className="figure-label" x="566" y="449">{secondName.length > 14 ? `${secondName.slice(0, 13)}…` : secondName}</text>
      </svg>
      <div className="scene-difference" aria-label={`比較結果：${relativeText}`}>
        <span>{partner ? "A × B" : comparison.shortLabel}</span>
        <strong>{relativeText}</strong>
      </div>
    </div>
  );
}
