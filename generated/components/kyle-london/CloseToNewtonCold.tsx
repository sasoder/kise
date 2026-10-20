// ---------------------------------------------------------------------------
// CloseToNewtonCold (kyle-london, cut 22, the cold-review copy of V2; round 1). Dwarkesh map style
// (styles/dwarkesh-map.md), the umber page with no map (kits/maps TexcocoPage), the engraved London cast (londonCast.tsx).
// Opaque 1080x1920, 29.97 fps, 148 frames.
//
// CHECK LINE: "Pepys, the diarist, stood shoulder to shoulder with Newton in the Royal Society's circle."
//
// THE LINE: "[...the very famous Diary of Samuel Pepys, who's this incredible] figure and is like very close to
// Newton and that social group. And his"
// WORD -> FRAME: incredible 4 · figure 15 · and 37 · is 50 · like 53 · very 62 · close 71 · to 81 · Newton 88 ·
// and 95 · that 103 · social 109 · group 119 · And 131 · his 142 (cut back to the speaker at 148)
// DURATION: the slot 22.155 -> 27.094 s (in frame 664 -> out frame 812 at 29.97) = 148 frames (f0..f147).
//
// THE MOTION (round 3): a room with a boarded floor in perspective and a tall panelled wainscot, in world space.
// f0: Newton (the only orange coat) in profile at his reflecting telescope on the Society's table, his eye at its
// eyepiece, one hand on the tube; Pepys (cream) strides in from the left (feet planted on the boards) and stops at his
// side by f50; PEPYS rides above his head. On "very close" (f62 -> f82) the camera pushes into a tight two-shot while
// Newton straightens and turns to him; then Newton lays his near hand on Pepys's shoulder, his arm across (f74 -> f86),
// and Pepys turns his head up to him, heads leaning in; held warm to ~f95. NEWTON rides above his head from f78.
// "that social group": the camera pulls back (f95 -> f118) while the four Fellows (cream at the context level: the
// stooped elder, a young man, one with a paper, one with his hat) turn and step a pace in toward Newton, one bending
// to the reflector he left: a ring closing round the orange centre. At the end Pepys looks round at the circle and the
// camera creeps back in a touch. Orange = the new science: Newton's coat only. Labels pinned above their own heads.
//
// SOURCES: costume after Hayls's Pepys (1666), Kneller's Newton (1689), Kneller's Wren (1711), Murray's Halley
// (c.1690), Kerseboom's Boyle (1689) and Hollar's frontispiece to Sprat's History of the Royal Society (1667), as
// listed in <working>/animation_source/refs/refs_sources.txt and images/image_sources.txt; the reflector after
// Newton's 1668 telescope (images/42.5_FundamentalDiscoveries_NewtonReflectingTelescope1668.jpg). No figures or dates.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg, makeCamera, type Cam } from "../kits/maps/texcocoShared";
import { INK, fellSC, swayCam } from "../kits/maps/incaShared";
import {
  DARK,
  Fellow,
  Globe,
  Newton,
  ORANGE,
  POSES,
  Pepys,
  Reflector,
  TABLE,
  Table,
  WALK_CYCLE,
  castAnchors,
  idle,
  lerpFig,
  shadeInk,
  tableTop,
  walkPose,
  type FigPose,
} from "./londonCast";
import { toLocal } from "../kits/maps/texcocoFigures";

export const FPS = 30000 / 1001;
export const DURATION = 148;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const easeOut = (v: number) => 1 - Math.pow(1 - c01(v), 3);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
type P2 = [number, number];

// ---------------------------------------------------------------------------
// WORLD: world px = figure units (a man ~310 tall, scale 1 in the front row); the front row's floor is y = 0, figures
// further back stand higher (y < 0) and smaller. The floor's boards run toward a vanishing point above the room.
// ---------------------------------------------------------------------------
const WALL_Y = -330;
const WAIN_TOP = -800;
const FLOOR_FRONT = 160;
const VP: P2 = [40, -1250];

// Newton bent at the reflector's eyepiece (facing screen right); the reflector and the table are placed FROM his eye
const NEWTON_X = 26;
// in profile, bent to the tabletop reflector, his eye at its eyepiece; his hands on the tube and the table, below and
// to the right of his face, so the face and the tube read from f0
const NEWTON_EYE_BASE: FigPose = { ...POSES.stand(1), yaw: 1.22, headYaw: 1.42, lean: 20, crouch: 10, pitch: 8, footL: [-24, 0], footR: [20, 0], lids: 0.55, brow: 0.55 };
const nEye0 = castAnchors("newton", NEWTON_EYE_BASE, [NEWTON_X, 0], 1).headC;
const EYE: P2 = [nEye0[0] + 18, nEye0[1] - 2];
const TABLE_S = 0.95;
// the reflector (dir -1: its eyepiece at the high left end, at local (-34, -99) x scale)
const REFL_AT: P2 = [EYE[0] + 34 * TABLE_S + 2, EYE[1] + 105 * TABLE_S];
const NEWTON_EYE_Q: FigPose = {
  ...NEWTON_EYE_BASE,
  armL: { w: toLocal([REFL_AT[0] + 2, REFL_AT[1] - 58], [NEWTON_X, 0], 1), elbow: [0.2, 1], fist: 0.6, hand: -20 },
  armR: { w: toLocal([REFL_AT[0] + 34, REFL_AT[1] - 6], [NEWTON_X, 0], 1), elbow: [-0.1, 1], fist: 0.4, hand: 0 },
};
const TABLE_AT: P2 = [REFL_AT[0] + 118, REFL_AT[1] + 14 * TABLE_S + 140 * TABLE_S];

/** a walker that comes in at speed v (units / frame) and slows to a stop at xEnd on fStop over `brake` frames */
const walker = (xEnd: number, dir: 1 | -1, fStop: number, v: number, brake: number) => {
  const dBrake = (v * brake) / 2;
  const dist = (f: number) => {
    if (f >= fStop) return 0;
    if (f >= fStop - brake) {
      const u = (fStop - f) / brake;
      return dBrake * u * u;
    }
    return dBrake + v * (fStop - brake - f);
  };
  return {
    x: (f: number) => xEnd - dir * dist(f),
    amount: (f: number) => (f >= fStop ? 0 : f >= fStop - brake ? Math.sqrt((fStop - f) / brake) : 1),
    covered: (f: number) => -dist(f),
  };
};

// Pepys strides in (a longer stride than the stroll) and stops behind Newton by f50
const PEPYS_X = NEWTON_X - 84;
const PEPYS_STRIDE = 46;
// PEPYS slides in once he (and the whole word) is in frame
const PEPYS_LABEL_F = 26;
const pepysWalk = walker(PEPYS_X, 1, 50, (2 * PEPYS_STRIDE) / WALK_CYCLE, 14);
const GENT_BASE = POSES.strollGent(1, 0, 0);

// the Fellows, already in the room; they turn and lean in toward Newton
type Held = "paper" | undefined;
type FellowSpec = { variant: number; x: number; y: number; s: number; held?: Held; start: FigPose; fTurn: number; end: FigPose };
const toward = (q: FigPose, dir: 1 | -1, yaw: number, headYaw: number, lean: number, pitch: number): FigPose => ({ ...q, yaw: dir * yaw, headYaw: dir * headYaw, lean: dir * lean, pitch });
// each Fellow ends at x and steps IN toward the pair from STEP units further out (f100 -> fStop)
const STEP = 46;
const FELLOWS: (FellowSpec & { dir: 1 | -1; fStop: number })[] = [
  // the stooped elder, left, just behind the pair's line
  { variant: 3, x: -248, y: -30, s: 0.97, dir: 1, fStop: 118, start: { ...POSES.front(), headYaw: -0.3 }, fTurn: 98, end: POSES.stoop(toward(POSES.stand(1), 1, 0.7, 0.9, 4, 6), 1) },
  // a younger man at the back left, quill in hand
  { variant: 0, x: -204, y: -150, s: 0.84, dir: 1, fStop: 124, start: toward(POSES.stand(-1), -1, 0.3, 0.25, 0, 10), fTurn: 102, end: toward(POSES.stand(1), 1, 0.66, 0.92, 5, 4) },
  // with a paper, behind the table
  { variant: 1, x: 216, y: -170, s: 0.84, dir: -1, fStop: 126, held: "paper", start: { ...toward(POSES.stand(1), 1, 0.4, 0.3, 0, 12), armL: { w: [30, -204], elbow: [-0.4, 1], fist: 0.7, hand: -10 } }, fTurn: 104, end: { ...toward(POSES.stand(-1), -1, 0.66, 0.94, 6, 6), armR: { w: [-30, -204], elbow: [0.4, 1], fist: 0.7, hand: 10 } } },
];
const stepIn = FELLOWS.map((F) => walker(F.x, F.dir, F.fStop, ((2 * 40) / WALK_CYCLE) * F.s, 12));
const CONTEXT_COAT = shadeInk(0.66);
const CONTEXT_INK = shadeInk(0.72);

// ---------------------------------------------------------------------------
// CAMERA: close on the two (Newton busy at the table, Pepys striding in), a slow push through the meeting, then a short
// pull-back to the ring (f128) and a creep. (wx, wy) lands on screen (540, sy) at zoom k.
// ---------------------------------------------------------------------------
const HEAD_Y = -292;
const camAt = makeCamera([
  { f: 0, k: 2.8, wx: -50, wy: HEAD_Y, sy: 770 },
  { f: 50, k: 2.95, wx: -34, wy: HEAD_Y, sy: 770 },
  { f: 62, k: 3.02, wx: -26, wy: HEAD_Y, sy: 762 },
  { f: 86, k: 3.4, wx: -18, wy: HEAD_Y, sy: 728 },
  { f: 98, k: 3.36, wx: -18, wy: HEAD_Y, sy: 734 },
  { f: 128, k: 2.66, wx: -14, wy: HEAD_Y, sy: 858 },
  { f: 147, k: 2.7, wx: -14, wy: HEAD_Y, sy: 856 },
]);
const camOf = (frame: number): Cam => swayCam(camAt(frame), frame);

// ---------------------------------------------------------------------------
// LABEL: IM Fell English SC, cream, in world space, pinned over a man's head; slides up while it fades in (10 frames)
// ---------------------------------------------------------------------------
const NameLabel: React.FC<{ text: string; x: number; y: number; size: number; frame: number; f0: number }> = ({ text, x, y, size, frame, f0 }) => {
  const u = c01((frame - f0) / 10);
  if (u <= 0) return null;
  const e = easeOut(u);
  return (
    <g opacity={ease(u)}>
    <ellipse cx={x} cy={y + size * 0.45 * (1 - e) - size * 0.34} rx={size * text.length * 0.5} ry={size * 0.62} fill={DARK} fillOpacity={0.6} style={{ filter: `blur(${size * 0.28}px)` }} />
    <text
      x={x + size * 0.07}
      y={y + size * 0.45 * (1 - e)}
      textAnchor="middle"
      opacity={ease(u)}
      fill={INK}
      stroke={DARK}
      strokeOpacity={0.8}
      strokeWidth={size * 0.14}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * 0.13 }}
    >
      {text}
    </text>
    </g>
  );
};

/** the ground shadow under a standing man: short hatched strokes in a flat ellipse */
const GroundShadow: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  let d = "";
  const n = 13;
  const hw = 62 * s;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const l = hw * 0.2 * Math.sqrt(Math.max(0.08, 1 - u * u));
    const px = x + u * hw;
    d += `M${(px - l).toFixed(1)},${(y + 4 * s + l * 0.4).toFixed(1)}L${(px + l).toFixed(1)},${(y + 4 * s - l * 0.4).toFixed(1)}`;
  }
  return <path d={d} fill="none" stroke={INK} strokeWidth={1.6 * s} strokeOpacity={0.32} strokeLinecap="round" />;
};

// ---------------------------------------------------------------------------
// THE ROOM (world space, static): the boarded floor in perspective, the skirting and a tall panelled wainscot
// ---------------------------------------------------------------------------
const floorX = (xFront: number, y: number) => VP[0] + (xFront - VP[0]) * ((y - VP[1]) / (FLOOR_FRONT - VP[1]));
const ROOM = (() => {
  const boards: string[] = [];
  const joints: string[] = [];
  const BW = 44;
  for (let i = -40; i <= 40; i++) {
    const xf = VP[0] + i * BW;
    boards.push(`M${floorX(xf, FLOOR_FRONT).toFixed(1)},${FLOOR_FRONT}L${floorX(xf, WALL_Y).toFixed(1)},${WALL_Y}`);
    for (let j = 0; j < 4; j++) {
      const y = mix(WALL_Y + 20, FLOOR_FRONT - 10, ((j + 0.37 * ((i * 7 + 40) % 5)) % 4) / 4);
      joints.push(`M${floorX(xf, y).toFixed(1)},${y.toFixed(1)}L${floorX(xf + BW, y).toFixed(1)},${y.toFixed(1)}`);
    }
  }
  const panels: string[] = [];
  for (let x = -1800; x <= 1800; x += 150) {
    panels.push(`M${x + 14},${WALL_Y - 30}L${x + 136},${WALL_Y - 30}L${x + 136},${WALL_Y - 190}L${x + 14},${WALL_Y - 190}Z`);
    panels.push(`M${x + 14},${WALL_Y - 222}L${x + 136},${WALL_Y - 222}L${x + 136},${WAIN_TOP + 26}L${x + 14},${WAIN_TOP + 26}Z`);
  }
  return { boards: boards.join(""), joints: joints.join(""), panels: panels.join("") };
})();
const Room: React.FC = () => (
  <g>
    <rect x={-2000} y={WAIN_TOP} width={4000} height={WALL_Y - WAIN_TOP} fill={DARK} fillOpacity={0.3} />
    <path d={ROOM.panels} fill="none" stroke={INK} strokeWidth={1.3} strokeOpacity={0.16} />
    <path d={ROOM.panels} fill="none" stroke={DARK} strokeWidth={2.2} strokeOpacity={0.35} transform="translate(2 2)" />
    <rect x={-2000} y={WALL_Y - 214} width={4000} height={14} fill={DARK} fillOpacity={0.4} />
    <path d={`M-2000,${WALL_Y - 214}L2000,${WALL_Y - 214}`} stroke={INK} strokeWidth={1.2} strokeOpacity={0.22} />
    <rect x={-2000} y={WAIN_TOP - 10} width={4000} height={12} fill={DARK} fillOpacity={0.45} />
    <path d={`M-2000,${WAIN_TOP - 10}L2000,${WAIN_TOP - 10}`} stroke={INK} strokeWidth={1.4} strokeOpacity={0.3} />
    <rect x={-2000} y={WALL_Y - 16} width={4000} height={16} fill={DARK} fillOpacity={0.5} />
    <path d={`M-2000,${WALL_Y - 16}L2000,${WALL_Y - 16}`} stroke={INK} strokeWidth={1.3} strokeOpacity={0.28} />
    <path d={`M-2400,${WALL_Y}L2400,${WALL_Y}L2400,${FLOOR_FRONT + 400}L-2400,${FLOOR_FRONT + 400}Z`} fill={INK} fillOpacity={0.035} />
    <path d={ROOM.boards} fill="none" stroke={DARK} strokeWidth={2} strokeOpacity={0.4} />
    <path d={ROOM.boards} fill="none" stroke={INK} strokeWidth={0.9} strokeOpacity={0.16} transform="translate(1.6 0)" />
    <path d={ROOM.joints} fill="none" stroke={DARK} strokeWidth={1.6} strokeOpacity={0.35} />
  </g>
);

const CloseToNewtonCold: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const g = frame;

  // ---- Pepys: striding in, stopping beside him; on the gesture he turns his head up to Newton; at the end he looks
  //      round at the circle -------------------------------------------------------------------------------------
  const pX = pepysWalk.x(frame);
  const pAmt = pepysWalk.amount(frame);
  const pPhase = pepysWalk.covered(frame) / (2 * PEPYS_STRIDE) + 0.15;
  const pw = walkPose(GENT_BASE, pPhase, pAmt, PEPYS_STRIDE);
  const pWalk: FigPose = { ...pw, crouch: pw.crouch - 2.6 * pAmt };
  const pWait: FigPose = { ...POSES.stand(1), yaw: 0.8, headYaw: 0.9, pitch: 3 };
  const pWarm: FigPose = { ...pWait, yaw: 0.46, headYaw: 0.62, pitch: 2, roll: 9, lean: 4, mouth: 0.45, brow: -0.4 };
  let pPose = lerpFig(pWalk, pWait, ease((frame - 38) / 14));
  pPose = lerpFig(pPose, pWarm, ease((frame - 76) / 12));
  const look = ease((frame - 122) / 16);
  pPose = { ...pPose, headYaw: mix(pPose.headYaw, -0.95, look), pitch: mix(pPose.pitch, 2, look), roll: mix(pPose.roll, 0, look) };
  pPose = idle(pPose, g, 1, ease((frame - 50) / 16));
  const pAnch = castAnchors("pepys", pPose, [pX, 0], 1);

  // ---- Newton: at the eyepiece (he lifts his head from it briefly ~f26-f50, so his face reads); on "very close" he
  //      straightens and turns to Pepys, then puts his far arm round Pepys's shoulders, behind his back, the hand on
  //      Pepys's FAR shoulder (f74 -> f86); both turn a touch to camera, heads inclined together; held to the end -------
  const nTurn = ease((frame - 62) / 16);
  const nHead = ease((frame - 60) / 14);
  const lift = ease((frame - 24) / 9) * (1 - ease((frame - 44) / 10));
  const pFar = pAnch.shoulderL[0] < pAnch.shoulderR[0] ? pAnch.shoulderL : pAnch.shoulderR;
  const HAND_AT: P2 = [pFar[0] - 2, pFar[1] - 14];
  const nFace: FigPose = { ...POSES.stand(-1), yaw: -0.5, headYaw: -0.66, pitch: 6, roll: -9, lean: -3, brow: -0.35, mouth: 0.4 };
  const nRound: FigPose = { ...nFace, armL: { w: toLocal(HAND_AT, [NEWTON_X, 0], 1), elbow: [0, 1], fist: 0.2, hand: -105 } };
  const eyeQ: FigPose = { ...NEWTON_EYE_Q, headYaw: mix(1.15, 0.55, lift), pitch: mix(8, -4, lift), lids: mix(0.55, 0, lift), brow: mix(0.55, -0.1, lift) };
  let nPose = lerpFig(eyeQ, nFace, nTurn);
  nPose = lerpFig(nPose, nRound, ease((frame - 72) / 14));
  nPose = { ...nPose, headYaw: mix(eyeQ.headYaw, nFace.headYaw, nHead) };
  nPose = idle(nPose, g, 2, 0.5 + 0.5 * ease((frame - 86) / 12));
  const nAnch = castAnchors("newton", nPose, [NEWTON_X, 0], 1);
  const armBehind = ease((frame - 72) / 14) > 0.02;
  const hand = castAnchors("newton", nPose, [NEWTON_X, 0], 1).handL;
  // the hand shows on top of Pepys only once it has come to rest on his far shoulder (never across his chest)
  const handOn = ease((frame - 72) / 14) > 0.9;

  // ---- the Fellows: in the room; they turn and lean in toward Newton ---------------------------------------
  const fellows = FELLOWS.map((F, i) => {
    const w = stepIn[i];
    const d = Math.min(STEP, F.dir * (F.x - w.x(frame)));
    const x = F.x - F.dir * d;
    const amt = d >= STEP ? 0 : w.amount(frame);
    const turned = lerpFig(F.start, F.end, ease((frame - F.fTurn) / 14));
    let q = amt > 0 ? walkPose({ ...turned, yaw: F.dir * Math.max(Math.abs(turned.yaw), 0.7) }, (STEP - d) / (2 * 40 * F.s) + 0.2 * i, amt, 40) : turned;
    if (F.variant === 3) q = POSES.stoop(q, F.dir);
    q = idle(q, g, 3 + i, 1);
    return { F, q, x };
  });
  const byDepth = [...fellows].sort((a, b) => a.F.y - b.F.y);
  const fellowEl = (o: (typeof fellows)[number], i: number) => (
    <g key={`f${o.F.variant}`}>
      <GroundShadow x={o.x} y={o.F.y} s={o.F.s} />
      <Fellow variant={o.F.variant} pose={o.q} at={[o.x, o.F.y]} scale={o.F.s} uid={`flr${i}${o.F.variant}`} coat={CONTEXT_COAT} ink={CONTEXT_INK} held={o.F.held} />
    </g>
  );
  const behindTable = byDepth.filter((o) => o.F.y < TABLE_AT[1]);
  const midRow = byDepth.filter((o) => o.F.y >= TABLE_AT[1] && o.F.y <= 0);
  const frontRow = byDepth.filter((o) => o.F.y > 0);
  const top = tableTop(TABLE_AT, TABLE_S);

  // labels pinned just above their own men's heads (nudged outward so the two never touch)
  const LS = 27;
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <Room />
        <defs>
          <radialGradient id="ctnc-floor">
            <stop offset="0" stopColor={DARK} stopOpacity={0.42} />
            <stop offset="1" stopColor={DARK} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={0} cy={6} rx={300} ry={40} fill="url(#ctnc-floor)" />
        <ellipse cx={-140} cy={-170} rx={160} ry={30} fill="url(#ctnc-floor)" />
        {behindTable.map(fellowEl)}
        <GroundShadow x={TABLE_AT[0] - 140 * TABLE_S} y={TABLE_AT[1]} s={TABLE_S} />
        <GroundShadow x={TABLE_AT[0] + 140 * TABLE_S} y={TABLE_AT[1]} s={TABLE_S} />
        <Table at={TABLE_AT} scale={TABLE_S} uid="ctnc-tbl" w={TABLE.w * 0.86} />
        <Reflector at={REFL_AT} scale={TABLE_S} uid="ctnc-rfl" dir={-1} />
        <Globe at={[top[0] + 120 * TABLE_S, top[1] - 14 * TABLE_S]} scale={TABLE_S} uid="ctnc-glb" turn={18 + frame * 0.12} />
        {midRow.map(fellowEl)}
        {/* Newton's far arm goes behind Pepys's back; his hand shows again on Pepys's far shoulder */}
        {armBehind ? <Newton pose={nPose} at={[NEWTON_X, 0]} scale={1} uid="ctnc-nwa" coat={ORANGE} onlyArm="L" /> : null}
        <GroundShadow x={pX} y={0} s={1} />
        <Pepys pose={pPose} at={[pX, 0]} scale={1} uid="ctnc-pep" />
        {handOn ? (
          <>
            <clipPath id="ctnc-hand">
              <circle cx={hand[0] + 6} cy={hand[1] - 4} r={27} />
            </clipPath>
            <g clipPath="url(#ctnc-hand)">
              <Newton pose={nPose} at={[NEWTON_X, 0]} scale={1} uid="ctnc-nwh" coat={ORANGE} onlyArm="L" />
            </g>
          </>
        ) : null}
        <GroundShadow x={NEWTON_X} y={0} s={1} />
        <Newton pose={nPose} at={[NEWTON_X, 0]} scale={1} uid="ctnc-nwt" coat={ORANGE} hideArm={armBehind ? "L" : undefined} />
        {frontRow.map(fellowEl)}
        <NameLabel text="PEPYS" x={pAnch.headTop[0] - 50} y={pAnch.headTop[1] - 16} size={LS} frame={frame} f0={PEPYS_LABEL_F} />
        <NameLabel text="NEWTON" x={nAnch.headTop[0] + 52} y={nAnch.headTop[1] - 18} size={LS} frame={frame} f0={78} />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default CloseToNewtonCold;
