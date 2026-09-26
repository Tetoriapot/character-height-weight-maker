import { proportions } from "../lib/character";

type SilhouetteProps = {
  x: number;
  baseY: number;
  pixelHeight: number;
  widthScale?: number;
  gender?: string;
  age?: string;
  headScale?: number;
  className?: string;
  muted?: boolean;
};

// Filled contours keep wrists, ankles and hands tapered at every output scale.
// Hairless mannequin: the crown stays at -220 and the soles at 0 at every head size.
export default function MannequinSilhouette({ x, baseY, pixelHeight, widthScale = 1, gender = "neutral", age = "adult", headScale = 1, className, muted }: SilhouetteProps) {
  const p = proportions(age, headScale);
  const w = widthScale;
  const young = age === "toddler" || age === "elementary";
  const feminine = gender === "female" && !young;
  const masculine = gender === "male" && !young;
  const shoulder = 22 * w * p.shoulderScale * (masculine ? 1.1 : feminine ? 0.92 : 1);
  const chest = shoulder * (young ? 0.95 : feminine ? 0.88 : 0.84);
  const waist = (young ? 17.5 : feminine ? 13 : masculine ? 15.5 : 14.5) * w;
  const hip = (young ? 19 : feminine ? 21.5 : masculine ? 18.8 : 20) * w;
  const neck = (masculine ? 5.5 : 4.7) * (0.86 + w * 0.14);
  const chin = 220 - p.radius * 2;
  const chestY = p.waist + (p.shoulder - p.waist) * 0.55;
  const crotch = p.hip - 12;
  const kneeWidth = 4.1 * w;
  const kneeX = kneeWidth + 0.55;
  const calfY = p.knee * 0.57;
  const ankleWidth = 2.6 * (0.7 + w * 0.3);
  const ankleX = ankleWidth + 0.65;
  const elbowY = p.waist + 5;
  const elbowX = shoulder + 6.5 * w;
  const wristY = p.hip - 12;
  const wristX = shoulder + 9 * w;
  const wristWidth = 2.1 * (0.8 + w * 0.2);
  const fingerY = wristY - 13;

  const torso = `M ${-neck} ${-chin - 3}
    L ${-neck} ${-p.shoulder - 7} Q ${-neck - 2} ${-p.shoulder - 3} ${-shoulder} ${-p.shoulder}
    Q ${-shoulder - 2} ${-p.shoulder + 8} ${-chest} ${-chestY}
    Q ${-waist} ${-p.waist - 8} ${-waist} ${-p.waist}
    Q ${-waist} ${-p.hip - 9} ${-hip} ${-p.hip}
    Q ${-hip - 1} ${-crotch - 3} ${-hip + 2} ${-crotch + 3}
    Q 0 ${-crotch + 7} ${hip - 2} ${-crotch + 3}
    Q ${hip + 1} ${-crotch - 3} ${hip} ${-p.hip}
    Q ${waist} ${-p.hip - 9} ${waist} ${-p.waist}
    Q ${waist} ${-p.waist - 8} ${chest} ${-chestY}
    Q ${shoulder + 2} ${-p.shoulder + 8} ${shoulder} ${-p.shoulder}
    Q ${neck + 2} ${-p.shoulder - 3} ${neck} ${-p.shoulder - 7}
    L ${neck} ${-chin - 3} Z`;

  const arm = `M ${shoulder - 3 * w} ${-p.shoulder - 1}
    C ${shoulder + 5 * w} ${-p.shoulder} ${elbowX + 3.8 * w} ${-elbowY - 11} ${elbowX + 3.5 * w} ${-elbowY}
    Q ${elbowX + 4 * w} ${-elbowY + 12} ${wristX + wristWidth} ${-wristY}
    Q ${wristX + 3.5} ${-wristY + 5} ${wristX + 2.5} ${-fingerY - 1}
    Q ${wristX + 1.5} ${-fingerY + 2} ${wristX - 1} ${-fingerY}
    Q ${wristX - 4} ${-fingerY - 4} ${wristX - 3} ${-fingerY - 8}
    L ${wristX - wristWidth} ${-wristY - 2}
    Q ${elbowX - 3.6 * w} ${-elbowY + 8} ${elbowX - 3.5 * w} ${-elbowY}
    Q ${shoulder - 5 * w} ${-p.shoulder + 17} ${shoulder - 3 * w} ${-p.shoulder - 1} Z`;

  // Thighs meet, with a narrow central separation below the knees and adjacent heels.
  const legPath = `M ${hip - 1} ${-p.hip - 2}
    Q ${hip + 3 * w} ${-crotch + 7} ${kneeX + kneeWidth} ${-p.knee - 3}
    Q ${kneeX + kneeWidth - 0.5} ${-p.knee + 3} ${kneeX + kneeWidth} ${-p.knee + 8}
    Q ${kneeX + 6 * w} ${-calfY} ${ankleX + ankleWidth} -9
    Q ${ankleX + ankleWidth + 1} -5 ${ankleX + 7 * w} -3
    Q ${ankleX + 9 * w} 0 ${ankleX + 5 * w} 0 L 0.65 0
    Q 0.4 -2 0.65 -10
    Q 1.1 ${-calfY} 0.55 ${-p.knee + 4}
    Q 0.35 ${-p.knee - 2} 0.35 ${-p.knee - 5}
    Q ${-0.8 * w} ${-crotch + 14} ${-0.25 * w} ${-crotch - 2} Z`;

  // One smooth, featureless head for every gender, including reference people/icons.
  const head = "M 0 -1 C -.55 -1 -.76 -.57 -.74 -.1 C -.72 .4 -.42 1 0 1 C .42 1 .72 .4 .74 -.1 C .76 -.57 .55 -1 0 -1 Z";

  return <g className={className} data-muted={muted ? "true" : undefined} data-silhouette-style="mannequin" data-pose="feet-together" transform={`translate(${x} ${baseY}) scale(${pixelHeight / 220})`} aria-hidden="true">
    <path d={legPath} />
    <path d={legPath} transform="scale(-1 1)" />
    <path d={arm} />
    <path d={arm} transform="scale(-1 1)" />
    <path d={torso} />
    <path data-part="head" d={head} transform={`translate(0 ${-p.headCenter}) scale(${p.radius})`} />
  </g>;
}
