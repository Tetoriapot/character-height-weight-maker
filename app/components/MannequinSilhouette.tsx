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
  const chest = shoulder * (young ? 0.93 : feminine ? 0.91 : 0.88);
  const waist = (young ? 17.5 : feminine ? 14.8 : masculine ? 17 : 16) * w;
  const hip = (young ? 19 : feminine ? 21 : masculine ? 19.5 : 20) * w;
  const neck = (masculine ? 5.5 : 4.7) * (0.86 + w * 0.14);
  const chin = 220 - p.radius * 2;
  const chestY = p.waist + (p.shoulder - p.waist) * 0.55;
  const crotch = p.hip - 8;
  const thighY = crotch - (crotch - p.knee) * 0.36;
  const kneeOuter = 10.3 * w;
  const calfOuter = 12.4 * w;
  const calfY = p.knee * 0.68;
  const ankleOuter = 6.4 * (0.7 + w * 0.3);
  const footOuter = 10 * (0.75 + w * 0.25);
  const elbowY = p.waist + 3;
  const elbowX = shoulder + 3.8 * w;
  const wristY = crotch - 5;
  const wristX = shoulder + 4.3 * w;
  const wristWidth = 2.35 * (0.8 + w * 0.2);
  const fingerY = wristY - 15;

  const torso = `M ${-neck} ${-chin - 3}
    L ${-neck} ${-p.shoulder - 7}
    C ${-neck - 1} ${-p.shoulder - 4} ${-shoulder + 5 * w} ${-p.shoulder - 3} ${-shoulder} ${-p.shoulder}
    C ${-shoulder - 3 * w} ${-p.shoulder + 6} ${-chest - w} ${-chestY - 8} ${-chest} ${-chestY}
    C ${-chest + w} ${-chestY + 10} ${-waist} ${-p.waist - 8} ${-waist} ${-p.waist}
    C ${-waist} ${-p.waist + 6} ${-hip} ${-p.hip - 8} ${-hip} ${-p.hip}
    Q ${-hip} ${-crotch - 3} ${-hip + 3 * w} ${-crotch + 1}
    Q ${-hip * 0.45} ${-crotch - 3} 0 ${-crotch}
    Q ${hip * 0.45} ${-crotch - 3} ${hip - 3 * w} ${-crotch + 1}
    Q ${hip} ${-crotch - 3} ${hip} ${-p.hip}
    C ${hip} ${-p.hip - 8} ${waist} ${-p.waist + 6} ${waist} ${-p.waist}
    C ${waist} ${-p.waist - 8} ${chest - w} ${-chestY + 10} ${chest} ${-chestY}
    C ${chest + w} ${-chestY - 8} ${shoulder + 3 * w} ${-p.shoulder + 6} ${shoulder} ${-p.shoulder}
    C ${shoulder - 5 * w} ${-p.shoulder - 3} ${neck + 1} ${-p.shoulder - 4} ${neck} ${-p.shoulder - 7}
    L ${neck} ${-chin - 3} Z`;

  const arm = `M ${shoulder - 3 * w} ${-p.shoulder - 1}
    C ${shoulder + 4 * w} ${-p.shoulder - 1} ${shoulder + 6.7 * w} ${-p.shoulder + 6} ${shoulder + 6.5 * w} ${-p.shoulder + 14}
    C ${shoulder + 7 * w} ${-p.shoulder + 23} ${elbowX + 3.2 * w} ${-elbowY - 7} ${elbowX + 3.5 * w} ${-elbowY}
    C ${elbowX + 5 * w} ${-elbowY + 8} ${wristX + wristWidth + 0.6} ${-wristY - 10} ${wristX + wristWidth} ${-wristY}
    C ${wristX + 3.6} ${-wristY + 4} ${wristX + 4.2} ${-fingerY - 6} ${wristX + 3} ${-fingerY - 1}
    Q ${wristX + 1.7} ${-fingerY + 1.5} ${wristX} ${-fingerY}
    L ${wristX - 2.4} ${-fingerY - 6}
    Q ${wristX - 5} ${-fingerY - 3} ${wristX - 4.5} ${-fingerY - 7}
    L ${wristX - wristWidth} ${-wristY}
    C ${wristX - wristWidth - 0.5} ${-wristY - 9} ${elbowX - 4.4 * w} ${-elbowY + 9} ${elbowX - 3.5 * w} ${-elbowY}
    C ${elbowX - 3.9 * w} ${-elbowY - 9} ${shoulder - 4.5 * w} ${-p.shoulder + 22} ${shoulder - 4 * w} ${-p.shoulder + 12}
    Q ${shoulder - 5 * w} ${-p.shoulder + 4} ${shoulder - 3 * w} ${-p.shoulder - 1} Z`;

  // Separate femur, knee and calf contours; a sub-unit seam keeps the stance closed.
  // The reference studies and intentional simplifications are recorded in README.
  const legPath = `M ${hip - 0.5 * w} ${-p.hip - 2}
    C ${hip + 1.2 * w} ${-p.hip + 8} ${hip - 0.8 * w} ${-thighY} ${hip - 3 * w} ${-thighY + 8}
    C ${hip - 5 * w} ${-p.knee - 11} ${kneeOuter + 0.3 * w} ${-p.knee - 7} ${kneeOuter} ${-p.knee}
    C ${kneeOuter - 0.3 * w} ${-p.knee + 5} ${calfOuter} ${-calfY - 7} ${calfOuter} ${-calfY}
    C ${calfOuter} ${-calfY + 9} ${ankleOuter + 0.3} -17 ${ankleOuter} -10
    C ${ankleOuter} -6 ${footOuter} -5 ${footOuter} -2
    Q ${footOuter} 0 ${footOuter - 2} 0 L 0.55 0
    Q 0.2 -3 0.8 -7
    C 1.7 -12 1.9 -17 1.2 -23
    C 0.4 -29 0.15 ${-calfY} 0.55 ${-p.knee + 5}
    Q 0.2 ${-p.knee} 0.55 ${-p.knee - 5}
    C 1 ${-p.knee - 15} 0.15 ${-thighY} 0.25 ${-crotch}
    Q ${hip * 0.45} ${-crotch - 8} ${hip - 0.5 * w} ${-p.hip - 2} Z`;

  // One smooth, featureless head for every gender, including reference people/icons.
  const head = "M 0 -1 C -.55 -1 -.76 -.57 -.74 -.1 C -.72 .4 -.42 1 0 1 C .42 1 .72 .4 .74 -.1 C .76 -.57 .55 -1 0 -1 Z";

  return <g className={className} data-muted={muted ? "true" : undefined} data-silhouette-style="mannequin" data-pose="feet-together" transform={`translate(${x} ${baseY}) scale(${pixelHeight / 220})`} aria-hidden="true">
    <path data-part="leg" d={legPath} />
    <path data-part="leg" d={legPath} transform="scale(-1 1)" />
    <path data-part="arm" d={arm} />
    <path data-part="arm" d={arm} transform="scale(-1 1)" />
    <path data-part="torso" d={torso} />
    <path data-part="head" d={head} transform={`translate(0 ${-p.headCenter}) scale(${p.radius})`} />
  </g>;
}
