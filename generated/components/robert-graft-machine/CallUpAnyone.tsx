// ---------------------------------------------------------------------------
// CallUpAnyone (robert-graft-machine, cut 62). The rest of the show's own Moses pictogram, re-staged 9:16, as the
// continuation of GraftMachine (cut 47): same parts (graftShared.tsx), same look (the original 16:9 graphic in
// Robert_Graft_machine_media.mov, src 66.96-76.4). Opaque 1080x1920, 24 fps, 227 frames.
//
// CHECK LINE: "Moses' beneficiaries all lean on whoever is in his way — first a borough president, then the
// governor himself."
//
// THE LINE: "Moses could then rely on these beneficiaries to call up anyone who stood in the way of one of his
// projects, whether that was a borough president or the governor himself."
// WORD -> FRAME: (Moses -4) · could 4 · then 10 · rely 15 · on 22 · these 32 · beneficiaries 40 · to 52 · call 69 ·
// up 75 · anyone 80 · who 86 · stood 96 · in 100 · the 105 · way 107 · of 111 · one 116 · of 121 · his 123 ·
// projects 125 · whether 138 · that 151 · was 158 · a 162 · borough 166 · president 172 · or 178 · the 194 ·
// governor 200 · himself 208.
// DURATION: the slot 62.3333 -> 71.7917 s = 9.4583 s x 24 = 227 frames (f0..f226).
//
// THE MOTION (rev 1, the user's notes of Nov 5: keep everything to the centre, no fades): f0 is GraftMachine's last
// frame exactly (Moses, label, the row of four; the shared layout constants in graftShared.tsx; grain and breathe
// continue in GraftMachine time F = 285 + f). f15-50 a soft lift runs left to right along the row ("rely on these
// beneficiaries"). f69 "call up": the desk with the borough man and the black rotary phone pops in right under the
// row; f69-86 four short coiled phone cords draw from the four slots down to the handset, staggered, fanning in
// over the man's head without crossing. The phone rings in bursts (the handset rattles, three white ring marks
// that grow out from short to full, no fade) on "anyone" f80-90, "stood in the way" f100-112 and "projects"
// f125-135. BOROUGH types on the desk front f166-171, PRESIDENT f172-179. "the governor": the man swells f196-200,
// and at f200 the heavier governor takes his place (pop 0.87 -> 1) as the desk widens 460 -> 510 and the label
// swaps to THE GOVERNOR (types f200-207); the phone rings hard f201-214. f215-226 a settled, living hold (grain,
// the row's faint breathe); no fade to black.
//
// FRAMING: Moses/label/row exactly as GraftMachine's last frame (row baseline y 955). The desk scene sits right
// under the row, centred on x 540: slab top y 1223, desk front y 1238-1372; the governor's head top y ~1018, the
// borough man's y ~1068, the phone's handset y ~1144. The desk label (caps 36 px) sits in the gap between the
// caption bands, y 1263-1348. The man, the phone and the short cords sit in caption band 1 (no text there).
//
// SOURCES: none (no figures). Artwork traced/measured from notes/reference/picto_src70.0.png (desk man, phone),
// picto_src76.2.png (the governor), picto_src74.0.png (ring marks), picto_src72.0.png (cords).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Boss,
  CoiledCord,
  Desk,
  DeskLabel,
  G_ROW_BASE,
  G_SLOTS,
  GLOW_ID,
  GM_FINAL_FRAME,
  GlowDefs,
  GraftGrain,
  GraftGround,
  GraftMosesFinal,
  GraftRowFinal,
  Phone,
  RingMarks,
} from "./graftShared";

export const FPS = 24;
export const DURATION = 227;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- layout -------------------------------------------------------------------------------------------------
const S_D = 0.34; // the desk scene's scale (world px per 4K px), borough man and governor alike
const PX = 409; // the phone dial's x; the men stand at the same anchor (as in the originals)
const SLAB_Y = 1223.4; // top of the desk slab; the front runs from 1238 to the floor
const FLOOR = 1372;
const DESK_X = 540;
const DESK_W0 = 460;
const DESK_W1 = 510;
const LABEL_S = 36 / 84; // cap 36 px, pitch 49
const LABEL_Y = 1263; // caps 1263-1348, centred on the front, in the gap between the caption bands
const SLOT_X = [G_SLOTS.vault.x, G_SLOTS.worker.x, G_SLOTS.scales.x, G_SLOTS.hat.x];
const CORD_TOP = G_ROW_BASE + 7; // just under the row's baseline (the icons cover the cords' first turns)

// ---- helpers ------------------------------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp01((f - a) / (b - a)));
const inOut = Easing.inOut(Easing.cubic);
const in2 = Easing.in(Easing.quad);
const pop = (f: number, f0: number, damping = 11, stiffness = 190) =>
  f < f0 ? 0 : spring({ frame: f - f0, fps: FPS, config: { damping, stiffness, mass: 0.6 } });

// the wave along the row: each slot lifts and swells softly, left to right
const WAVE_T0 = [15, 22, 29, 36];
const WAVE_DUR = 14;
// ring bursts: [start, end, strength]
const BURSTS: [number, number, number][] = [
  [80, 90, 1],
  [100, 112, 1],
  [125, 135, 1],
  [201, 214, 1.4],
];
// cords: drawn one after another (2-frame stagger), each 11 frames
const CORD_T0 = [69, 71, 73, 75];
const CORD_DUR = 11;
const CORD_PITCH = 17;
const CORD_AMP = 6;
const CORD_W = 3.8;
// The cords fan in onto the handset's top edge (4K, from the dial), in the same left-to-right order as their slots,
// so they never cross. The two right-hand cords thread over the men's heads (the governor's head top is y ~1018):
// they run through the via points (world px), clear of the heads and of each other.
const LAND_4K: [number, number][] = [
  [-170, -190],
  [-80, -222],
  [10, -227],
  [100, -216],
];
const toWorld = ([x, y]: [number, number]): [number, number] => [PX + x * S_D, SLAB_Y + y * S_D];
const CORD_VIA: [number, number][][] = [
  [[316, 1060]],
  [[414, 1055]],
  [
    [520, 1010],
    [460, 1080],
  ],
  [
    [655, 976],
    [585, 990],
    [535, 1035],
    [490, 1095],
  ],
];
const CORD_PTS: [number, number][][] = SLOT_X.map((x, i) => [[x, CORD_TOP], ...CORD_VIA[i], toWorld(LAND_4K[i])]);
// The ring marks sit only in the gaps the cords leave around the handset (checked against the cords and both men)
const RING_ANGLES = [-170, -118, -71];

const CallUpAnyone: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const F = GM_FINAL_FRAME + f; // GraftMachine time: grain seed and the row's breathe carry straight on

  const wave = WAVE_T0.map((t0) => Math.sin(Math.PI * prog(f, t0, t0 + WAVE_DUR, inOut)));
  const lift = wave.map((w) => 8 * w);
  const bump = wave.map((w) => 0.05 * w);

  // the desk scene pops in about its middle
  const p = pop(f, 69);
  const sceneOn = f >= 69 && p > 0.001;
  const PIV: [number, number] = [DESK_X, SLAB_Y + 20];
  // the cords' points; the phone end is carried by the scene's pop (weight grows along the cord)
  const cords = CORD_PTS.map((pts) =>
    pts.map(([u, v], j): [number, number] => {
      const w = (j / (pts.length - 1)) ** 2;
      const pu = PIV[0] + (u - PIV[0]) * p;
      const pv = PIV[1] + (v - PIV[1]) * p;
      return [u + (pu - u) * w, v + (pv - v) * w];
    }),
  );

  // the governor
  const isGov = f >= 200;
  const swell = 1 + 0.15 * prog(f, 196, 200, in2);
  const govK = isGov ? 0.87 + 0.13 * pop(f, 200, 9, 200) : 1;
  const deskW = DESK_W0 + (DESK_W1 - DESK_W0) * pop(f, 198, 12, 170);

  // phone rings: the marks grow out from short (no opacity)
  const burst = BURSTS.find(([a, b]) => f >= a && f <= b);
  let hLift = 0;
  let hTilt = 0;
  let ringK = 0;
  let ringSpread = 1;
  if (burst) {
    const [a, b, k] = burst;
    const ph = f - a;
    const odd = ph % 2 === 1;
    hLift = (odd ? 10 : 18) * k;
    hTilt = (odd ? -3.5 : 3) * k;
    const grow = Math.min(1, (f - a + 1) / 2, (b - f + 1) / 2); // 0.5 on the first and last frame
    ringK = 1.35 * grow * (odd ? 0.85 : 1.05) * (k > 1 ? 1.25 : 1);
    ringSpread = (odd ? 0.97 : 1.03) * (k > 1 ? 1.1 : 1);
  }

  // labels
  const typedB = f < 166 ? 0 : Math.min(7, Math.floor(((f - 166) / 6) * 7) + 1);
  const typedP = f < 172 ? 0 : Math.min(9, Math.floor(((f - 172) / 8) * 9) + 1);
  const typedG = f < 200 ? 0 : Math.min(11, Math.floor(((f - 200) / 8) * 11) + 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <GraftGround />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <GlowDefs />
        <g filter={`url(#${GLOW_ID})`}>
          {/* the cords run from the slots down to the handset's top edge (the handset covers their ends) */}
          {cords.map((c, i) => (
            <CoiledCord
              key={`cord${i}`}
              p0={c[0]}
              p3={c[c.length - 1]}
              via={c.slice(1, -1)}
              drawn={prog(f, CORD_T0[i], CORD_T0[i] + CORD_DUR, inOut)}
              pitch={CORD_PITCH}
              amp={CORD_AMP}
              width={CORD_W}
            />
          ))}

          {/* the desk scene */}
          {sceneOn && (
            <g transform={`translate(${PIV[0]} ${PIV[1]}) scale(${p}) translate(${-PIV[0]} ${-PIV[1]})`}>
              {isGov ? (
                <Boss x={PX} y={SLAB_Y} s={S_D * govK} kind="governor" />
              ) : (
                <Boss x={PX} y={SLAB_Y} s={S_D * swell} kind="borough" />
              )}
              <Desk x={DESK_X} y={SLAB_Y} s={S_D} w={deskW} bottom={FLOOR}>
                {typedB > 0 && !isGov && (
                  <DeskLabel x={DESK_X} y={LABEL_Y} s={LABEL_S} lines={["BOROUGH", "PRESIDENT"]} shown={typedB + typedP} />
                )}
                {typedG > 0 && <DeskLabel x={DESK_X} y={LABEL_Y} s={LABEL_S} lines={["THE", "GOVERNOR"]} shown={typedG} />}
              </Desk>
              <Phone x={PX} y={SLAB_Y} s={S_D} lift={hLift} tilt={hTilt} />
              {ringK > 0 && (
                <RingMarks x={PX} y={SLAB_Y} s={S_D} k={ringK} spread={ringSpread} angles={RING_ANGLES} />
              )}
            </g>
          )}

          {/* GraftMachine's last picture: the row (breathing on in GraftMachine time) and Moses with his label */}
          <GraftRowFinal F={F} lift={lift} bump={bump} />
          <GraftMosesFinal />
        </g>
      </svg>
      <GraftGrain frame={F} />
    </AbsoluteFill>
  );
};

export default CallUpAnyone;
