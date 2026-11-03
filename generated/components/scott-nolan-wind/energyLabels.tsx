// ===================================================================================================================
// energyLabels: the plants' name labels (v2, user note of Nov 3). OPT-IN: nothing else in energyWorld draws them, so a
// cut that does not mount <PlantLabels> renders exactly as before.
//
// Each label is a real object in the scene: Söhne Kräftig caps (+0.06 em, the house label), cream, standing on the board
// just in front of its plinth's front face, centred on the plinth and leaning back toward the camera so it reads from
// the high wides. Lit by the key light, fogged and grained with the rest; a faint contact shadow grounds it.
// The letters stay below the plinth's socket (cut C seats the plug there).
// ===================================================================================================================
import React, { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { continueRender, delayRender } from "remotion";
import { COLOR, FONT_LABEL, METRIC, TRACK } from "../kits/cheeky-pint/stoutShared";
import { SoftShadows, SHADOW_LEN, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { COMMON_GLSL, LINEUP, PLANTS, PLINTH, THREE, sharedUniforms, vec3Of, type PlantKind } from "./energyCore";

/** the five words, as printed */
export const LABEL_TEXT: Record<PlantKind, string> = { coal: "COAL", gas: "GAS", nuclear: "NUCLEAR", wind: "WIND", solar: "SOLAR" };
/**
 * World size and place (units). CAP = cap height; GAP = board between the plinth's front face and the label's foot;
 * LEAN = degrees the label leans back from upright (top toward +Z). NUCLEAR is about 179 units wide (plinth 204).
 */
export const LABEL = { CAP: 26, GAP: 55, LEAN: 30, FOOT: 1 } as const;

/** world point of a label's foot (centre of its baseline) */
export const labelFootOf = (kind: PlantKind): [number, number, number] => {
  const [X, Z] = LINEUP[kind];
  return [X, LABEL.FOOT, Z - PLINTH.D / 2 - LABEL.GAP];
};
/** world point of a label's cap-top centre (after the lean) */
export const labelTopOf = (kind: PlantKind): [number, number, number] => {
  const [x, y, z] = labelFootOf(kind);
  const a = (LABEL.LEAN * Math.PI) / 180;
  return [x, y + LABEL.CAP * Math.cos(a), z + LABEL.CAP * Math.sin(a)];
};
/** label width in world units (from the Söhne advance table) */
const ADV: Record<string, number> = { A: 0.709, C: 0.667, D: 0.701, E: 0.594, G: 0.727, I: 0.264, L: 0.549, N: 0.727, O: 0.73, R: 0.653, S: 0.59, U: 0.693, W: 0.932 };
export const labelWidthOf = (kind: PlantKind) => {
  const t = LABEL_TEXT[kind];
  const em = [...t].reduce((a, c) => a + (ADV[c] ?? 0.65), 0) + TRACK.label * (t.length - 1);
  return (em * LABEL.CAP) / METRIC.cap;
};

/** faint contact shadow along each label's foot: put these in your SoftShadows layer, or let <PlantLabels> draw them */
export const labelShadowItems = (kind: PlantKind, alpha = 0.32): ShadowItem[] => {
  const [x, , z] = labelFootOf(kind);
  const w = labelWidthOf(kind);
  const top = labelTopOf(kind);
  const out: ShadowItem[] = [];
  const n = Math.max(3, Math.round(w / 22));
  for (let i = 0; i < n; i++) out.push({ x: x - w / 2 + 8 + (i * (w - 16)) / (n - 1), z: z + 4, len: top[1] * SHADOW_LEN * 0.9, r: 7, soft: 6, alpha });
  return out;
};

// --- the texture: one canvas per word, drawn once the house font is in -----------------------------------------------
const PX = 220; // canvas font size
const PAD = 28;
const FONT_CSS = `500 ${PX}px ${FONT_LABEL}`;
type Glyphs = { tex: Any; w: number; h: number; base: number };
type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const drawWord = (text: string): Glyphs => {
  const c = document.createElement("canvas");
  const probe = c.getContext("2d") as CanvasRenderingContext2D;
  probe.font = FONT_CSS;
  const track = TRACK.label * PX;
  const adv = [...text].map((ch) => probe.measureText(ch).width);
  const width = adv.reduce((a, b) => a + b, 0) + track * (text.length - 1);
  const cap = METRIC.cap * PX;
  c.width = Math.ceil(width + PAD * 2);
  c.height = Math.ceil(cap + PAD * 2);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.font = FONT_CSS;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  let x = PAD;
  const base = PAD + cap;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, base);
    x += adv[i] + track;
  });
  const tex = new THREE.CanvasTexture(c);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return { tex, w: c.width, h: c.height, base };
};

const LB_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying vec2 vUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LB_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uMap;
uniform vec3 uInk;
uniform float uDim;
varying vec3 vW;
varying vec3 vN;
varying vec2 vUv;
void main() {
  float a = texture2D(uMap, vUv).a;
  if (a < 0.004) discard;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  vec3 base = mix(uInk, mix(uInk * 0.86, uBoardTone, 1.0), uDim);
  vec3 col = clayShade(base, n, V);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), a);
}`;

// ThreeCanvas renders with frameloop "never" (one advance per frame change), so once the words are mounted this draws the
// frame again before releasing the render; otherwise a tab's first frame would go out without its labels.
const useWords = () => {
  const [words, setWords] = useState<Record<string, Glyphs> | null>(null);
  const [handle] = useState(() => delayRender("energyLabels: font"));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (!words) return;
    advance(performance.now());
    requestAnimationFrame(() => continueRender(handle));
  }, [words, advance, handle]);
  useEffect(() => {
    let live = true;
    document.fonts
      .load(FONT_CSS, "COALGSNUCLEARWINDSOLAR")
      .then(() => {
        if (!live) return;
        const o: Record<string, Glyphs> = {};
        for (const k of PLANTS) o[k] = drawWord(LABEL_TEXT[k]);
        setWords(o);
      })
      .catch(() => continueRender(handle));
    return () => {
      live = false;
    };
  }, [handle]);
  return words;
};

const LabelMesh: React.FC<{ kind: PlantKind; g: Glyphs; dim: number }> = ({ kind, g, dim }) => {
  const o = useMemo(() => {
    const k = LABEL.CAP / (METRIC.cap * PX);
    const w = g.w * k;
    const h = g.h * k;
    const geo = new THREE.PlaneGeometry(w, h);
    // the plane's own frame: baseline at local y 0, centred in x
    geo.translate(0, h / 2 - (g.h - g.base) * k, 0);
    geo.rotateX((-LABEL.LEAN * Math.PI) / 180);
    const [x, y, z] = labelFootOf(kind);
    geo.translate(x, y, -z);
    const mat = new THREE.ShaderMaterial({
      vertexShader: LB_VERT,
      fragmentShader: LB_FRAG,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: { ...sharedUniforms(), uMap: { value: g.tex }, uInk: { value: vec3Of(COLOR.inkCream) }, uDim: { value: 0 } },
    });
    return { geo, mat };
  }, [kind, g]);
  o.mat.uniforms.uDim.value = dim;
  return <mesh geometry={o.geo} material={o.mat} renderOrder={5} />;
};

export type PlantLabelsProps = {
  /** which labels (default all five) */
  only?: PlantKind[];
  /** 0 normal .. 1 receded to the board tone, per plant (match the Lineup's dim) */
  dim?: Partial<Record<PlantKind, number>>;
  /** draw the faint contact shadows here (default true); false if you add labelShadowItems to your own layer */
  shadow?: boolean;
};
/** the plants' name labels, on the board in front of each plinth. Opt-in; mount inside the stage's world. */
export const PlantLabels: React.FC<PlantLabelsProps> = ({ only, dim = {}, shadow = true }) => {
  const words = useWords();
  const kinds = only ?? [...PLANTS];
  return (
    <>
      {shadow ? <SoftShadows items={kinds.flatMap((k) => labelShadowItems(k))} /> : null}
      {words ? kinds.map((k) => <LabelMesh key={k} kind={k} g={words[k]} dim={dim[k] ?? 0} />) : null}
    </>
  );
};
