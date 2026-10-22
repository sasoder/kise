// ---------------------------------------------------------------------------
// LurksInYourChest (kyle-pandemics, cut 32). Dwarkesh map style (styles/dwarkesh-map.md), the umber page with no map
// (kits/maps TexcocoPage), drawn in the London clip's depth manner (DEPTH.md: one camera, one VP, a ground plane,
// volumes, one light from the upper left, contact and form shadows, parallax): londonDepth.tsx and the cast
// londonCastV2.tsx (Worker), both imported read-only; the anatomy is this clip's own lurksAnatomy.tsx.
// Opaque 1080x1920, 29.97 fps, 173 frames.
//
// CHECK LINE: a viewer with the sound off can say "TB settles in the lungs and sits there quietly, then spreads and
// eats the body away from inside — a poor man in a cold room wasting away."
//
// THE LINE: "And so it gets in your chest and it just lurks. And then it'll just waste you away, particularly if
// you're poor and you're stressed."
// WORD -> FRAME: so 2 · it 5 · gets 8 · in 16 · your 19 · CHEST 22 · and 30 · it 43 · just 47 · LURKS 50 · and 66 ·
// then 75 · it'll 82 · just 86 · WASTE 92 · you 102 · AWAY 108 · particularly 112 · if 122 · you're 128 · POOR 133 ·
// and 141 · you're 153 · STRESSED 158 · (slot ends 173)
// DURATION: the slot 32.699 -> 38.472 s = 5.773 s x 29.97 = 173 frames (f0..f172).
//
// V3 ENVIRONMENT (pandemicAir.tsx, palette A, mood interior; prop `look`, default "A"; "old" = the delivered V3,
// pixel for pixel): the garret inside the clip's medium (AirRoom: warm umber plaster, boards and straw fogged by
// distance, thin darker-local joints, a continuous floor tone) lit by its one window: bright panes, a soft glow round
// them and a soft beam falling forward and down through the air onto the floor behind him (gradients only, no SVG
// blur filters: they cost seconds per frame at this zoom); motes, grade, grain, vignette; no bloom (render cost).
// THE MAN AND HIS LUNGS ARE UNTOUCHED (the cast builder replaces him).
//
// THE MOTION: one camera in a bare, cold garret (one-point perspective: boards to the VP, a back wall with one small
// window at the upper left as the light, a sloping roof on the right, a straw pallet). f0: a poor labourer (the
// Worker: knitted cap, shirt sleeves, waistcoat) stands slack in the middle, breathing; the camera is already
// pushing in (a dolly, parallax on the room) and lands on his chest by "CHEST" (f22-30), then keeps creeping in.
// f18-44 his body goes to ~50 % (one eased change): his engraved hatching fades under one flat translucent body tone
// with a clean contour (the face keeps its lines), and inside him there are only the two lungs (V2: no ribcage), as
// glass (V3: a thin light contour, a faint fill, the cardiac notch, fine fissures and bronchi, the windpipe), so his
// back and the room show through them; the disease is the only opaque thing inside him. Three orange
// specks come down the windpipe (f26-48) and lodge in the upper lobes, where they settle as three tubercles by
// "LURKS" (f50); they sit still while the lungs breathe slowly round them (f50-80). From f80 ("then it'll just WASTE
// you AWAY") the orange spreads out of them through the upper and middle lobes (a crisp, ragged, monotonic front:
// consolidation hatched along the lung's form, irregular patches, five dark-rimmed cavities eaten out) while he
// wastes, with the body only: he stoops forward, the head drops (a nod), the shoulders round, the chest narrows; two
// cough jolts of the whole torso (f104, f113) open his mouth a little; the hands hang at his sides. The camera tilts
// down his body with the stoop, keeping the lungs big (no pull-back). f118-172 ("POOR ... STRESSED"): the settled,
// living picture, a slow creep in, slow laboured breathing. Nothing new arrives.
// CONTINUITY (V2): londonCastV2's sleeve hatching (braceletD) picks its side from the sign of n0 + 0.6 n1 of the limb
// direction, so a forearm near 31 deg below horizontal flips its stripes; in V1 the far forearm crossed that angle at
// f116 / f124 (the cough's lean). The far hand now hangs lower and further out so every limb stays clear of it on every
// frame (checked per frame on the rig: no sign change; the thumb side of both hands stable too).
// Orange = the disease only (the bacilli, the tubercles, the spread). The body cream, the anatomy cream / umber,
// the room umber.
// CAUSE BEFORE EFFECT: each speck reaches its site on f46 / f48 / f50 and its tubercle forms from it (f45-54); the
// spread starts at the tubercles (f80) and only travels outward from them.
//
// DEPTH: eye y -215 (his chest), the VP on the camera's centre line; dRef 1000 at kRef 3.55, dolly 0.55 (the push-in
// is part dolly: the room parallaxes behind him). Floor Y 0, the room X -215..215, the back wall Z 380, the ceiling
// Y -425 sloping down on the right to a knee wall (X 215, Y -250). He stands at X 0, Z 0 (the front plane). Light: one,
// the window (upper left). Contact shadow under him; the cast's form shadow; the anatomy lit from the upper left.
//
// SOURCES: anatomy proportions (lung apices ~2-3 cm above the clavicles, bases at the 6th rib level in front, lower at the
// sides; the right lung three lobes, the left two with the cardiac notch; reactivation TB in the apical / posterior
// upper lobe segments, cavitation) from standard references (Gray's Anatomy; Cecil / Harrison on post-primary TB).
// No figures, dates or text on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg, makeCamera } from "../kits/maps/texcocoShared";
import { swayCam } from "../kits/maps/incaShared";
import { figureRig } from "../kits/maps/texcocoFigures";
import { STAND, Worker, idle, lerpFig, specOf, type FigPose } from "../kyle-london/londonCastV2";
import { Box, ContactShadow, GroundPlane, perspective, type DepthOpts, type Persp } from "../kyle-london/londonDepth";
import { AirStage, fogHex, makeAirView, type AirScene } from "./pandemicAir";

// V3 the medium: palette A, mood interior (cast units: a man ~310 = 1.75 m)
const AIR_SCENE: AirScene = { look: "A", mood: "interior", F: 1000, fogNear: 400, fogVis: 2400, fogMax: 0.9, hLow: 0, hHigh: 500, moteUnit: 177 };
import { ChestAnatomy, N_NODULES, type ChestState } from "./lurksAnatomy";
import { FolkWorker, STAND as FOLK_STAND, buildWorker, type ArmPose, type WorkerPose } from "./pandemicFolk";
import { FolkChestAnatomy } from "./pandemicFolkLungs";

export const FPS = 30000 / 1001;
export const DURATION = 173;
/** V3 (pandemicAir.tsx): "A" = the garret inside the clip's medium (interior); "old" = the delivered V3, pixel for pixel */
export const schema = z.object({ look: z.enum(["old", "A"]).default("A") });
export const defaultProps = schema.parse({});

type P2 = [number, number];
type V3 = [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const PP = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const DARK = "#17120D";
const INK = "#E9DDBF";
// architecture: dark umber planes in cream line (styles/dwarkesh-map.md); the garret is colder and barer than a cellar
const ARCH = { lit: "#58493A", mid: "#47392C", dark: "#2E261D" };

// ---------------------------------------------------------------------------
// THE ROOM
// ---------------------------------------------------------------------------
export const DEPTH: DepthOpts = { eyeY: -215, dRef: 1000, kRef: 3.55, dolly: 0.55 };
const WALL_L = -215;
const WALL_R = 215;
const BACK_Z = 380;
const FRONT_Z = -900;
const CEIL = -425;
/** the roof slope on the right: from the knee wall's top (X WALL_R, Y KNEE) up to the ceiling at X SLOPE_X */
const KNEE = -250;
const SLOPE_X = 70;
/** the window in the back wall (upper left): X0, X1, Y top, Y bottom; its reveal depth */
const WIN = { x0: -168, x1: -96, y0: -352, y1: -262, depth: 26 };

const quad = (P: Persp, pts: V3[]) => `M${pts.map(([x, y, z2]) => PP(P.p(x, y, z2))).join("L")}Z`;

const Room: React.FC<{ P: Persp }> = ({ P }) => {
  const backPoly: V3[] = [
    [WALL_L, 0, BACK_Z],
    [WALL_R, 0, BACK_Z],
    [WALL_R, KNEE, BACK_Z],
    [SLOPE_X, CEIL, BACK_Z],
    [WALL_L, CEIL, BACK_Z],
  ];
  // the back wall's boards (vertical, cream joints), and a few cracks in the plaster above the window
  let boards = "";
  for (let X = WALL_L + 34; X < WALL_R; X += 34) {
    const yTop = X > SLOPE_X ? mix(CEIL, KNEE, (X - SLOPE_X) / (WALL_R - SLOPE_X)) : CEIL;
    boards += `M${PP(P.p(X, 0, BACK_Z))}L${PP(P.p(X, yTop, BACK_Z))}`;
  }
  // the left wall's boards: horizontal courses receding to the VP
  let lboards = "";
  for (let Y = -32; Y > CEIL; Y -= 40) lboards += `M${PP(P.p(WALL_L, Y, FRONT_Z))}L${PP(P.p(WALL_L, Y, BACK_Z))}`;
  // the roof's rafters (to the VP) and the knee wall's boards
  let rafters = "";
  for (let Z = BACK_Z; Z > FRONT_Z; Z -= 150) rafters += `M${PP(P.p(WALL_R, KNEE, Z))}L${PP(P.p(SLOPE_X, CEIL, Z))}`;
  let knee = "";
  for (let Y = -32; Y > KNEE; Y -= 40) knee += `M${PP(P.p(WALL_R, Y, FRONT_Z))}L${PP(P.p(WALL_R, Y, BACK_Z))}`;
  const w = WIN;
  // the window's light falling forward onto the floor (from the upper left behind him): a pale patch, cold
  const lightPatch: V3[] = [
    [-150, 0, 250],
    [-70, 0, 250],
    [-20, 0, 70],
    [-120, 0, 70],
  ];
  return (
    <g>
      {/* the ceiling (above the eye: its underside) and its joists to the VP */}
      <path d={quad(P, [[WALL_L, CEIL, FRONT_Z], [SLOPE_X, CEIL, FRONT_Z], [SLOPE_X, CEIL, BACK_Z], [WALL_L, CEIL, BACK_Z]])} fill={ARCH.dark} />
      <path d={[-150, -80, -10].map((X) => `M${PP(P.p(X, CEIL, FRONT_Z))}L${PP(P.p(X, CEIL, BACK_Z))}`).join("")} fill="none" stroke={INK} strokeWidth={2.2 * P.r(200)} strokeOpacity={0.08} />
      {/* the back wall and its boards */}
      <path d={quad(P, backPoly)} fill="#3C3126" />
      <path d={boards} fill="none" stroke={INK} strokeWidth={1.2 * P.r(BACK_Z)} strokeOpacity={0.13} />
      <path d={boards} transform="translate(2.4 0)" fill="none" stroke={DARK} strokeWidth={1.2 * P.r(BACK_Z)} strokeOpacity={0.35} />
      {/* the window: a recess (its reveal lit on the right, dark on the top), four panes of cold sky, the bars */}
      <path d={quad(P, [[w.x0, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z], [w.x1, w.y1, BACK_Z], [w.x0, w.y1, BACK_Z]])} fill={ARCH.dark} />
      <path d={quad(P, [[w.x0, w.y0, BACK_Z + w.depth], [w.x1, w.y0, BACK_Z + w.depth], [w.x1, w.y1, BACK_Z + w.depth], [w.x0, w.y1, BACK_Z + w.depth]])} fill="#C9C3AE" />
      <path d={quad(P, [[w.x1, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z + w.depth], [w.x1, w.y1, BACK_Z + w.depth], [w.x1, w.y1, BACK_Z]])} fill="#8E846C" />
      <path d={quad(P, [[w.x0, w.y1, BACK_Z], [w.x1, w.y1, BACK_Z], [w.x1, w.y1, BACK_Z + w.depth], [w.x0, w.y1, BACK_Z + w.depth]])} fill="#A49A80" />
      <path d={quad(P, [[w.x0, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z + w.depth], [w.x0, w.y0, BACK_Z + w.depth]])} fill={ARCH.dark} />
      <path
        d={`M${PP(P.p((w.x0 + w.x1) / 2, w.y0, BACK_Z + w.depth))}L${PP(P.p((w.x0 + w.x1) / 2, w.y1, BACK_Z + w.depth))}M${PP(P.p(w.x0, (w.y0 + w.y1) / 2, BACK_Z + w.depth))}L${PP(P.p(w.x1, (w.y0 + w.y1) / 2, BACK_Z + w.depth))}`}
        stroke={DARK}
        strokeWidth={4 * P.r(BACK_Z)}
      />
      <path d={quad(P, [[w.x0, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z], [w.x1, w.y1, BACK_Z], [w.x0, w.y1, BACK_Z]])} fill="none" stroke={DARK} strokeWidth={2.4 * P.r(BACK_Z)} />
      {/* the sill: a small volume below the window */}
      <Box P={P} X0={w.x0 - 8} X1={w.x1 + 8} Y0={w.y1} Y1={w.y1 + 9} Z0={BACK_Z - 9} Z1={BACK_Z} ink={{ lit: "#7A6A50", mid: ARCH.lit, dark: ARCH.dark }} uid="lk-sill" />
      {/* the floor */}
      <GroundPlane P={P} kind="boards" x0={WALL_L} x1={WALL_R} z0={FRONT_Z} zFar={BACK_Z} plank={38} course={300} uid="lk-gp" tone={0.95} />
      <path d={quad(P, lightPatch)} fill={INK} opacity={0.07} />
      {/* the left wall (lit, it faces the window's side of the room) and the knee wall + roof slope on the right */}
      <path d={quad(P, [[WALL_L, 0, FRONT_Z], [WALL_L, 0, BACK_Z], [WALL_L, CEIL, BACK_Z], [WALL_L, CEIL, FRONT_Z]])} fill={ARCH.lit} />
      <path d={lboards} fill="none" stroke={INK} strokeWidth={1.2 * P.r(0)} strokeOpacity={0.1} />
      <path d={quad(P, [[WALL_R, 0, FRONT_Z], [WALL_R, 0, BACK_Z], [WALL_R, KNEE, BACK_Z], [WALL_R, KNEE, FRONT_Z]])} fill={ARCH.mid} />
      <path d={knee} fill="none" stroke={INK} strokeWidth={1.2 * P.r(0)} strokeOpacity={0.08} />
      <path d={quad(P, [[WALL_R, KNEE, FRONT_Z], [WALL_R, KNEE, BACK_Z], [SLOPE_X, CEIL, BACK_Z], [SLOPE_X, CEIL, FRONT_Z]])} fill={ARCH.dark} />
      <path d={rafters} fill="none" stroke={INK} strokeWidth={2.6 * P.r(0)} strokeOpacity={0.09} />
      {/* the corners in cream line */}
      <path
        d={
          [
            [WALL_L, 0],
            [WALL_L, CEIL],
            [WALL_R, 0],
            [WALL_R, KNEE],
            [SLOPE_X, CEIL],
          ]
            .map(([x, y]) => `M${PP(P.p(x, y, FRONT_Z))}L${PP(P.p(x, y, BACK_Z))}`)
            .join("") + `M${backPoly.map(([x, y, z2]) => PP(P.p(x, y, z2))).join("L")}Z`
        }
        fill="none"
        stroke={INK}
        strokeWidth={1.3 * P.r(300)}
        strokeOpacity={0.2}
      />
      {/* the straw pallet against the back wall, right: a low volume, straw ends, a rough blanket */}
      <ContactShadow P={P} X={120} Z={300} w={110} d={70} uid="lk-pcs" amt={0.7} />
      <Box P={P} X0={30} X1={200} Y0={-20} Y1={0} Z0={230} Z1={370} ink={{ lit: "#7C6B4C", mid: "#5F5038", dark: "#3A3024" }} uid="lk-pal" />
      <path
        d={Array.from({ length: 26 }, (_, i) => {
          const X = 32 + i * 6.5;
          const a = P.p(X, -20, 230);
          const b = P.p(X + 3 * Math.sin(i * 1.7), -6 + 3 * Math.sin(i * 2.3), 230);
          return `M${PP(a)}L${PP(b)}`;
        }).join("")}
        fill="none"
        stroke={INK}
        strokeWidth={0.9 * P.r(230)}
        strokeOpacity={0.22}
      />
      <path d={quad(P, [[60, -21, 235], [175, -21, 240], [190, -21, 360], [80, -21, 365]])} fill="#3E3428" stroke={DARK} strokeWidth={1.4 * P.r(300)} />
      <path d={`M${PP(P.p(70, -21.5, 270))}Q${PP(P.p(120, -21.5, 250))} ${PP(P.p(170, -21.5, 285))}`} fill="none" stroke={INK} strokeWidth={1 * P.r(300)} strokeOpacity={0.2} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MAN: slack, facing a little to the left (toward the window's light); the near arm is armR (his left)
// ---------------------------------------------------------------------------
const SPEC = specOf("worker");
const BASE: FigPose = {
  ...STAND,
  yaw: -0.42,
  headYaw: -0.38,
  pitch: 5,
  lean: -1,
  crouch: 2,
  armL: { w: [-46, -131], elbow: [-0.3, 1], fist: 0.35, hand: 4 },
  armR: { w: [44, -141], elbow: [0.4, 1], fist: 0.35, hand: -4 },
  footL: [-9, 0],
  footR: [7, -1],
  brow: 0.25,
  lids: 0.2,
  mouth: -0.35,
};
/** wasted: the shoulders down and forward (a lean toward the way he faces), the knees give, the head hangs */
const WASTED: FigPose = {
  ...BASE,
  yaw: -0.5,
  headYaw: -0.46,
  // (rev 2) the head drops by PITCH (a nod, chin to the chest); the roll cancels the lean's tilt so the features
  // stay level, never skewed into a smirk; heavy lids; the mouth turned down
  pitch: 30,
  roll: 6.5,
  lean: -13,
  crouch: 15,
  armL: { w: [-58, -122], elbow: [-0.2, 1], fist: 0.25, hand: 6 },
  brow: 0.35,
  lids: 0.62,
  mouth: -1,
};
/** the breathing: a phase that slows as it labours (period 66 -> 76 frames), the depth growing */
const breathAt = (f: number) => {
  // integral of 1 / period
  const P0 = 66;
  const P1 = 76;
  const ph = f <= 90 ? f / P0 : 90 / P0 + (f - 90) / P1;
  const amp = mix(0.7, 1, ease((f - 90) / 40));
  return amp * Math.sin(2 * Math.PI * (ph - 0.15));
};
/** the cough: two jolts (a sharp in, a slower recovery) */
const jolt = (f: number, f0: number) => {
  const t = f - f0;
  if (t < 0) return 0;
  return t < 4 ? ease(t / 4) : Math.exp(-(t - 4) / 5);
};
const coughAt = (f: number) => jolt(f, 104) + 0.8 * jolt(f, 113);

export const poseAt = (f: number): { q: FigPose; waste: number } => {
  const waste = ease((f - 80) / 44);
  let q = lerpFig(BASE, WASTED, waste);
  const br = breathAt(f);
  const cg = coughAt(f);
  // the cough is the whole torso (rev 1: no arm): it folds forward and down, the head jerks, then recovers
  q = { ...q, crouch: q.crouch - 0.9 * br + 2.2 * cg, pitch: q.pitch - 1.2 * br + 7 * cg, lean: q.lean - 4 * cg, lids: Math.min(0.68, q.lids + 0.1 * cg), brow: q.brow + 0.2 * cg };
  return { q: idle(q, f, 2, 0.8), waste };
};

// ---------------------------------------------------------------------------
// CAMERA (rev 1): the push in to the chest (f0-30), a slow creep (f30-80), then, as he stoops, a tilt down his body
// that keeps the payoff big (f80-126: the cage stays >= ~70 % of the frame width), and a creep in to the end. Keys are
// on the sternal angle of the KEY POSES (static, never the moving subject): the slack stance, then the wasted stoop.
// ---------------------------------------------------------------------------
/** the sternal angle (torso-local 0, -89 at the chest's front, Z ~20; the anatomy's AX 1.12) of a pose, figure-local: the camera's anchor */
const sternalAngle = (q: FigPose, nar = 1): P2 => {
  const r = figureRig(SPEC, q);
  const p = r.toFig([1.12 * 20 * Math.sin(q.yaw), -89]);
  return [p[0] * nar, p[1]];
};
const SA0 = sternalAngle(BASE);
const SA1 = sternalAngle(WASTED, 0.94);
const camAt = makeCamera([
  { f: 0, k: 3.55, wx: 0, wy: -160, sy: 1050 },
  { f: 30, k: 10.0, wx: SA0[0], wy: SA0[1], sy: 850 },
  { f: 80, k: 10.4, wx: SA0[0], wy: SA0[1], sy: 842 },
  { f: 118, k: 10.62, wx: SA1[0], wy: SA1[1], sy: 708 },
  { f: 172, k: 11.0, wx: SA1[0], wy: SA1[1], sy: 696 },
]);
const camOf = (f: number) => swayCam(camAt(f), f);

/** the open mouth in the head's frame (londonCastV2's headTf + FaceArt: the lips at y 17.4 + the nod, x 20.2 sin yaw) */
const OpenMouth: React.FC<{ q: FigPose; at: P2; scale: number; amt: number }> = ({ q, at, scale, amt }) => {
  const r = figureRig(SPEC, q);
  const nod = Math.max(0, r.nodF);
  const s = Math.sin(q.headYaw);
  const c = Math.cos(q.headYaw);
  // centred on the visible (near) half of the cast's mouth line, the upper edge on it, tilted with its turned-down slope
  const cx = 20.2 * s * 1.02 + 3.2 * c;
  const cy = 17.4 + 3 * nod - 0.2;
  const a = Math.min(1, amt);
  const w = 5.4 * (0.55 + 0.45 * c);
  const tf = `translate(${at[0].toFixed(3)} ${at[1].toFixed(3)}) scale(${scale.toFixed(5)}) translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${SPEC.headScale})`;
  return (
    <g transform={`${tf} rotate(9 ${cx.toFixed(2)} ${cy.toFixed(2)})`}>
      {/* (rev 3) a small open mouth, wider than tall: the dark opening between the lips, and the lower lip's line */}
      <path d={`M${(cx - w).toFixed(2)},${cy.toFixed(2)}Q${cx.toFixed(2)},${(cy - 0.9 * a).toFixed(2)} ${(cx + w).toFixed(2)},${cy.toFixed(2)}Q${cx.toFixed(2)},${(cy + 4 * a).toFixed(2)} ${(cx - w).toFixed(2)},${cy.toFixed(2)}Z`} fill={DARK} opacity={0.95} />
      <path d={`M${(cx - w * 0.75).toFixed(2)},${(cy + 2 * a + 2).toFixed(2)}Q${cx.toFixed(2)},${(cy + 4 * a + 2.4).toFixed(2)} ${(cx + w * 0.75).toFixed(2)},${(cy + 2 * a + 2).toFixed(2)}`} fill="none" stroke={DARK} strokeWidth={1.5} strokeOpacity={0.75 * a} strokeLinecap="round" />
    </g>
  );
};

/** the head's silhouette (face and skull, head-local, before headScale) in black: cuts the anatomy out of the face */
const HeadShape: React.FC<{ q: FigPose; at: P2; scale: number; fill?: string }> = ({ q, at, scale, fill = "#000" }) => {
  const r = figureRig(SPEC, q);
  const tf = `translate(${at[0].toFixed(3)} ${at[1].toFixed(3)}) scale(${scale.toFixed(5)}) translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${SPEC.headScale})`;
  return (
    <g transform={tf}>
      <ellipse cx={3 * Math.sin(q.headYaw)} cy={-1} rx={24} ry={31.5} fill={fill} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// V3: THE GARRET INSIDE THE CLIP'S MEDIUM (pandemicAir.tsx, palette A, mood interior; look "A"). The same room as
// Room above (which stays the delivered picture) in local colours (warm umber plaster, boards, straw) fogged by their
// distance into the air; thin darker-local joints instead of dark casings, cream edges fading with the fog; the
// window the room's one light: bright panes, a soft beam falling forward and down through the air onto the floor
// behind him (behind him in depth, so it is drawn before him). The man and his lungs are not touched.
// ---------------------------------------------------------------------------
type Tone = (hex: string, Z: number, height?: number) => string;
const AIR_ROOM = {
  ceiling: "#3A3128",
  back: "#5E5040",
  left: "#6E5E4A",
  knee: "#4F4336",
  slope: "#3A3129",
  floor: "#62523F",
  joint: "#2E251C",
  line: "#2A2119",
  pane: "#E8E2CC",
  reveal: "#9C9179",
  sill: { lit: "#8A7859", mid: "#665640", dark: "#3A3026" },
  pallet: { lit: "#8E7C58", mid: "#6A5A40", dark: "#3E3428" },
  blanket: "#4A3E30",
  cream: "#E9DDBF",
};
const AirRoom: React.FC<{ P: Persp; tone: Tone; fogOf: (Z: number) => number; shadow: string }> = ({ P, tone, fogOf, shadow }) => {
  const A = AIR_ROOM;
  const backPoly: V3[] = [
    [WALL_L, 0, BACK_Z],
    [WALL_R, 0, BACK_Z],
    [WALL_R, KNEE, BACK_Z],
    [SLOPE_X, CEIL, BACK_Z],
    [WALL_L, CEIL, BACK_Z],
  ];
  let boards = "";
  for (let X = WALL_L + 34; X < WALL_R; X += 34) {
    const yTop = X > SLOPE_X ? mix(CEIL, KNEE, (X - SLOPE_X) / (WALL_R - SLOPE_X)) : CEIL;
    boards += `M${PP(P.p(X, 0, BACK_Z))}L${PP(P.p(X, yTop, BACK_Z))}`;
  }
  let lboards = "";
  for (let Y = -32; Y > CEIL; Y -= 40) lboards += `M${PP(P.p(WALL_L, Y, FRONT_Z))}L${PP(P.p(WALL_L, Y, BACK_Z))}`;
  let rafters = "";
  for (let Z = BACK_Z; Z > FRONT_Z; Z -= 150) rafters += `M${PP(P.p(WALL_R, KNEE, Z))}L${PP(P.p(SLOPE_X, CEIL, Z))}`;
  let knee = "";
  for (let Y = -32; Y > KNEE; Y -= 40) knee += `M${PP(P.p(WALL_R, Y, FRONT_Z))}L${PP(P.p(WALL_R, Y, BACK_Z))}`;
  const w = WIN;
  const fb = fogOf(BACK_Z);
  const lineB = tone(A.line, BACK_Z, 200);
  // a surface running in depth (a wall, the floor, the ceiling): bands from front to back, each its fogged tone
  const depthBands = (key: string, corners: (za: number, zb: number) => V3[], hex: string, height: number, n = 10) =>
    Array.from({ length: n }, (_, i) => {
      const za = mix(FRONT_Z, BACK_Z, i / n);
      const zb = mix(FRONT_Z, BACK_Z, (i + 1) / n);
      return <path key={`${key}${i}`} d={quad(P, corners(za, zb + 1))} fill={tone(hex, (za + zb) / 2, height)} />;
    });
  // the floor boards: joints to the VP, butt joints staggered
  let fj = "";
  for (let X = WALL_L + 38; X < WALL_R; X += 38) fj += `M${PP(P.p(X, 0, FRONT_Z))}L${PP(P.p(X, 0, BACK_Z))}`;
  let fx = "";
  for (let X = WALL_L, i = 0; X < WALL_R; X += 38, i++) {
    for (let Z = FRONT_Z + ((i * 137) % 300); Z < BACK_Z; Z += 300) fx += `M${PP(P.p(X, 0, Z))}L${PP(P.p(Math.min(WALL_R, X + 38), 0, Z))}`;
  }
  // the window's beam: from the window's opening forward and down to the patch it lights on the floor
  const patch: V3[] = [
    [-150, 0, 250],
    [-70, 0, 250],
    [-20, 0, 70],
    [-120, 0, 70],
  ];
  const win: V3[] = [
    [w.x0, w.y0, BACK_Z],
    [w.x1, w.y0, BACK_Z],
    [w.x1, w.y1, BACK_Z],
    [w.x0, w.y1, BACK_Z],
  ];
  const beam = [
    [win[0], win[1], patch[2], patch[3]],
    [win[3], win[2], patch[1], patch[0]],
    [win[0], win[3], patch[0], patch[3]],
  ];
  const wc = P.p((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, BACK_Z);
  const pc = P.p(-70, 0, 160);
  return (
    <g>
      <defs>
        <linearGradient id="lka-beam" gradientUnits="userSpaceOnUse" x1={wc[0]} y1={wc[1]} x2={pc[0]} y2={pc[1]}>
          <stop offset="0" stopColor={A.cream} stopOpacity={0.34} />
          <stop offset="0.6" stopColor={A.cream} stopOpacity={0.12} />
          <stop offset="1" stopColor={A.cream} stopOpacity={0.04} />
        </linearGradient>
        <radialGradient id="lka-soft">
          <stop offset="0" stopColor={A.cream} stopOpacity={1} />
          <stop offset="0.5" stopColor={A.cream} stopOpacity={0.45} />
          <stop offset="1" stopColor={A.cream} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lka-sh">
          <stop offset="0" stopColor={shadow} stopOpacity={1} />
          <stop offset="1" stopColor={shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {depthBands("c", (za, zb) => [[WALL_L, CEIL, za], [SLOPE_X, CEIL, za], [SLOPE_X, CEIL, zb], [WALL_L, CEIL, zb]], A.ceiling, 425)}
      <path d={[-150, -80, -10].map((X) => `M${PP(P.p(X, CEIL, FRONT_Z))}L${PP(P.p(X, CEIL, BACK_Z))}`).join("")} fill="none" stroke={A.cream} strokeWidth={1.6 * P.r(200)} strokeOpacity={0.07} />
      <path d={quad(P, backPoly)} fill={tone(A.back, BACK_Z, 200)} />
      <path d={boards} fill="none" stroke={A.cream} strokeWidth={1 * P.r(BACK_Z)} strokeOpacity={0.1 * (1 - fb)} />
      <path d={boards} transform="translate(2 0)" fill="none" stroke={lineB} strokeWidth={1 * P.r(BACK_Z)} strokeOpacity={0.35} />
      {/* the window: a recess, bright panes (the room's light), the reveal lit, thin bars */}
      <path d={quad(P, win)} fill={tone(A.line, BACK_Z, 300)} />
      <path d={quad(P, [[w.x0, w.y0, BACK_Z + w.depth], [w.x1, w.y0, BACK_Z + w.depth], [w.x1, w.y1, BACK_Z + w.depth], [w.x0, w.y1, BACK_Z + w.depth]])} fill={A.pane} />
      <path d={quad(P, [[w.x1, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z + w.depth], [w.x1, w.y1, BACK_Z + w.depth], [w.x1, w.y1, BACK_Z]])} fill={tone(A.reveal, BACK_Z, 300)} />
      <path d={quad(P, [[w.x0, w.y1, BACK_Z], [w.x1, w.y1, BACK_Z], [w.x1, w.y1, BACK_Z + w.depth], [w.x0, w.y1, BACK_Z + w.depth]])} fill={tone(A.reveal, BACK_Z, 270)} />
      <path d={quad(P, [[w.x0, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z], [w.x1, w.y0, BACK_Z + w.depth], [w.x0, w.y0, BACK_Z + w.depth]])} fill={tone(A.line, BACK_Z, 350)} />
      <path
        d={`M${PP(P.p((w.x0 + w.x1) / 2, w.y0, BACK_Z + w.depth))}L${PP(P.p((w.x0 + w.x1) / 2, w.y1, BACK_Z + w.depth))}M${PP(P.p(w.x0, (w.y0 + w.y1) / 2, BACK_Z + w.depth))}L${PP(P.p(w.x1, (w.y0 + w.y1) / 2, BACK_Z + w.depth))}`}
        stroke={tone("#3A3027", BACK_Z, 300)}
        strokeWidth={3 * P.r(BACK_Z)}
      />
      {/* the window's glow in the air round it (a soft disc, no filter: cheap at every zoom) */}
      <ellipse cx={wc[0]} cy={wc[1]} rx={(w.x1 - w.x0) * 1.6 * P.r(BACK_Z)} ry={(w.y1 - w.y0) * 1.5 * P.r(BACK_Z)} fill="url(#lka-soft)" opacity={0.3} />
      <Box P={P} X0={w.x0 - 8} X1={w.x1 + 8} Y0={w.y1} Y1={w.y1 + 9} Z0={BACK_Z - 9} Z1={BACK_Z} ink={{ lit: tone(A.sill.lit, BACK_Z, 260), mid: tone(A.sill.mid, BACK_Z, 260), dark: tone(A.sill.dark, BACK_Z, 260) }} uid="lka-sill" />
      {/* the floor: one continuous tone by distance, thin darker-local joints */}
      {depthBands("f", (za, zb) => [[WALL_L, 0, za], [WALL_R, 0, za], [WALL_R, 0, zb], [WALL_L, 0, zb]], A.floor, 0, 14)}
      <path d={fj} fill="none" stroke={tone(A.joint, 0, 0)} strokeWidth={1.1 * P.r(0)} strokeOpacity={0.5} />
      <path d={fx} fill="none" stroke={tone(A.joint, 0, 0)} strokeWidth={1 * P.r(0)} strokeOpacity={0.4} />
      {(() => {
        const c = P.p(-85, 0, 160);
        const rx = 95 * P.r(160);
        const ry = Math.max(1, (P.p(-85, 0, 70)[1] - P.p(-85, 0, 250)[1]) / 2) * 1.2;
        return <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="url(#lka-soft)" opacity={0.2} />;
      })()}
      {/* the walls */}
      {depthBands("l", (za, zb) => [[WALL_L, 0, za], [WALL_L, 0, zb], [WALL_L, CEIL, zb], [WALL_L, CEIL, za]], A.left, 200)}
      <path d={lboards} fill="none" stroke={A.cream} strokeWidth={1 * P.r(0)} strokeOpacity={0.08} />
      {depthBands("k", (za, zb) => [[WALL_R, 0, za], [WALL_R, 0, zb], [WALL_R, KNEE, zb], [WALL_R, KNEE, za]], A.knee, 120)}
      <path d={knee} fill="none" stroke={A.cream} strokeWidth={1 * P.r(0)} strokeOpacity={0.06} />
      {depthBands("s", (za, zb) => [[WALL_R, KNEE, za], [WALL_R, KNEE, zb], [SLOPE_X, CEIL, zb], [SLOPE_X, CEIL, za]], A.slope, 340)}
      <path d={rafters} fill="none" stroke={A.cream} strokeWidth={2 * P.r(0)} strokeOpacity={0.07} />
      <path
        d={
          [
            [WALL_L, 0],
            [WALL_L, CEIL],
            [WALL_R, 0],
            [WALL_R, KNEE],
            [SLOPE_X, CEIL],
          ]
            .map(([x, y]) => `M${PP(P.p(x, y, FRONT_Z))}L${PP(P.p(x, y, BACK_Z))}`)
            .join("") + `M${backPoly.map(([x, y, z2]) => PP(P.p(x, y, z2))).join("L")}Z`
        }
        fill="none"
        stroke={A.cream}
        strokeWidth={1.1 * P.r(300)}
        strokeOpacity={0.14}
      />
      {/* the pallet */}
      <ellipse cx={P.p(125, 0, 300)[0]} cy={P.p(125, 0, 300)[1]} rx={120 * P.r(300)} ry={Math.max(1, (P.p(0, 0, 230)[1] - P.p(0, 0, 380)[1]) / 2)} fill="url(#lka-sh)" opacity={0.4} />
      <Box P={P} X0={30} X1={200} Y0={-20} Y1={0} Z0={230} Z1={370} ink={{ lit: tone(A.pallet.lit, 300, 20), mid: tone(A.pallet.mid, 300, 20), dark: tone(A.pallet.dark, 300, 20) }} uid="lka-pal" />
      <path
        d={Array.from({ length: 26 }, (_, i) => {
          const X = 32 + i * 6.5;
          const a = P.p(X, -20, 230);
          const b = P.p(X + 3 * Math.sin(i * 1.7), -6 + 3 * Math.sin(i * 2.3), 230);
          return `M${PP(a)}L${PP(b)}`;
        }).join("")}
        fill="none"
        stroke={A.cream}
        strokeWidth={0.9 * P.r(230)}
        strokeOpacity={0.2}
      />
      <path d={quad(P, [[60, -21, 235], [175, -21, 240], [190, -21, 360], [80, -21, 365]])} fill={tone(A.blanket, 300, 21)} stroke={tone(A.line, 300, 21)} strokeWidth={0.9 * P.r(300)} />
      <path d={`M${PP(P.p(70, -21.5, 270))}Q${PP(P.p(120, -21.5, 250))} ${PP(P.p(170, -21.5, 285))}`} fill="none" stroke={A.cream} strokeWidth={1 * P.r(300)} strokeOpacity={0.18} />
      {/* the beam through the air, last of the room (behind him) */}
      {/* soft-edged by layering: the full beam faint, then a narrower core */}
      <g>
        {beam.map((q, i) => (
          <path key={i} d={quad(P, q as V3[])} fill="url(#lka-beam)" opacity={i === 2 ? 0.3 : 0.45} />
        ))}
        {(() => {
          const shrink = (pts: V3[], k: number): V3[] => {
            const c = pts.reduce((a, b) => [a[0] + b[0] / 4, a[1] + b[1] / 4, a[2] + b[2] / 4] as V3, [0, 0, 0] as V3);
            return pts.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k, c[2] + (p[2] - c[2]) * k] as V3);
          };
          return beam.slice(0, 2).map((q, i) => <path key={`c${i}`} d={quad(P, shrink(q as V3[], 0.7))} fill="url(#lka-beam)" opacity={0.4} />);
        })()}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// V3 CAST TAKE 2 (look "A"): THE DRAWN WORKER (pandemicFolk FolkWorker, the approved gouache picture-book cast) in
// place of the londonCastV2 Worker, at the same physical height in the room (FOLK_S: folk units -> cast units, his
// skull top 494 folk = 310 cast). Slack, breathing (the same labouring breath), turned a little toward the window
// (yaw -12); he wastes with the body only, as before: the shoulders drop (slump), the head nods forward (pitch), the
// chest narrows, heavy lids and worried brows, two cough jolts of the whole torso (f104, f113) that open a small dark
// mouth; the hands hang at his sides. The see-through is FolkWorker's: the body fades as one layer to ~35 % with a soft
// band of its own colour kept at the outer edge, and inside him the lungs as glass in the gouache hand with the disease
// the only opaque thing (pandemicFolkLungs, the same ChestState timing as before). His big picture-book head sets the
// framing: the push lands head to waist with the sternum at y ~930 (the cap may crop at the top), the lungs ~60 % of
// the frame's width, the diseased upper lobes ~y 690-1020 (above the caption band), the lower lobes run into it.
// ---------------------------------------------------------------------------
const FOLK_S = 310 / 494;
const ARM_SLACK: ArmPose = { abd: 9, flex: 5, abd2: -6, flex2: 7, droop: 3, thumb: 0 };
const ARM_WASTED: ArmPose = { abd: 6, flex: 3, abd2: -3, flex2: 4, droop: 2, thumb: 0 };
const FOLK_BASE: WorkerPose = { ...FOLK_STAND, yaw: -12, headYaw: -5, headPitch: 9, headRoll: 3, bodyRoll: -1.2, slump: 4, armR: ARM_SLACK, armL: { ...ARM_SLACK, abd: 10 }, brows: 2.5, lids: 0.22 };
export const folkPoseAt = (f: number): { pose: WorkerPose; waste: number; cough: number } => {
  const waste = ease((f - 80) / 44);
  const br = breathAt(f);
  const cg = coughAt(f);
  const sway = Math.sin((f / 190) * 2 * Math.PI);
  const pose: WorkerPose = {
    ...FOLK_BASE,
    headPitch: mix(9, 25, waste) + 7 * cg - 1.2 * br,
    headRoll: mix(3, 1.5, waste) + 0.7 * sway,
    bodyRoll: -1.2 + 0.5 * sway,
    slump: mix(4, 12, waste) + 3.5 * cg - 0.9 * br,
    breath: 0.5 + 0.5 * br,
    armR: mixArmP(ARM_SLACK, ARM_WASTED, waste),
    armL: mixArmP({ ...ARM_SLACK, abd: 10 }, ARM_WASTED, waste),
    brows: mix(2.5, 4, waste) + 1.2 * cg,
    lids: Math.min(0.7, mix(0.22, 0.58, waste) + 0.12 * cg),
    mouth: 0,
  };
  return { pose, waste, cough: cg };
};
const mixArmP = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({ abd: mix(a.abd, b.abd, t), flex: mix(a.flex, b.flex, t), abd2: mix(a.abd2, b.abd2, t), flex2: mix(a.flex2, b.flex2, t), droop: mix(a.droop, b.droop, t), thumb: mix(a.thumb, b.thumb, t) });
/** the sternum of a key pose in world (cast) units, feet at the origin: the camera's anchor (static key poses only) */
const folkSternum = (f: number, nar = 1): P2 => {
  const a = buildWorker(folkPoseAt(f).pose).anchors.sternum;
  return [a[0] * FOLK_S * nar, a[1] * FOLK_S];
};
const FSA0 = folkSternum(40);
const FSA1 = folkSternum(140, 0.94);
const folkCamAt = makeCamera([
  { f: 0, k: 3.55, wx: 0, wy: -160, sy: 1050 },
  { f: 30, k: 8.6, wx: FSA0[0], wy: FSA0[1], sy: 930 },
  { f: 80, k: 8.85, wx: FSA0[0], wy: FSA0[1], sy: 926 },
  { f: 118, k: 9.2, wx: FSA1[0], wy: FSA1[1], sy: 900 },
  { f: 172, k: 9.5, wx: FSA1[0], wy: FSA1[1], sy: 892 },
]);
const folkCamOf = (f: number) => swayCam(folkCamAt(f), f);

const LurksFolk: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = folkCamOf(frame);
  const P = perspective(cam, DEPTH);
  const c0 = folkCamOf(0);
  const P0 = perspective(c0, DEPTH);
  const hz = 960 + (P.vp[1] - cam.cy) * cam.k;
  const air = makeAirView({ scene: { ...AIR_SCENE, F: P.Dc * cam.k }, frame, horizon: hz, cam: { x: cam.cx, y: -DEPTH.eyeY, z: -P.Dc }, rest: { x: c0.cx, y: -DEPTH.eyeY, z: -P0.Dc } });
  const { pose, waste, cough } = folkPoseAt(frame);
  // the mouth opens a little with each cough and is closed again by f125
  const mouth = Math.min(1, cough * 1.2) * (1 - ease((frame - 117) / 8));
  const at: P2 = P.p(0, 0, 0);
  const scale = P.r(0) * FOLK_S;
  const nar = 1 - 0.06 * waste;
  const bodyTf = `translate(${at[0].toFixed(3)} 0) scale(${nar.toFixed(5)} 1) translate(${(-at[0]).toFixed(3)} 0)`;
  const reveal = ease((frame - 18) / 26);
  const ARR = [46, 48, 50];
  const specks = ARR.map((fa, i) => {
    const f0 = 26 + i * 2;
    if (frame < f0 || frame > fa) return null;
    return ease((frame - f0) / (fa - f0)) * 0.6 + 0.4 * ((frame - f0) / (fa - f0));
  });
  const nodules = ARR.map((fa) => ease((frame - (fa - 1)) / 8));
  const st: ChestState = { breath: breathAt(frame), waste, nodules: nodules.slice(0, N_NODULES), specks, spread: c01((frame - 80) / 48) };
  const fpose: WorkerPose = { ...pose, mouth };
  return (
    <AirStage v={air} bloom={0} shafts={0}>
      <WorldSvg cam={cam}>
        <AirRoom P={P} tone={(hex, Z, h = 0) => fogHex(air, hex, P.Dc + Z, h)} fogOf={(Z) => air.fogAt(P.Dc + Z)} shadow={air.pal.shadow} />
        <ContactShadow P={P} X={0} Z={0} w={62} d={36} uid="lkf-mcs" />
        <g transform={bodyTf}>
          <FolkWorker pose={fpose} x={at[0]} y={at[1]} scale={scale} uid="lkf-man" unitPx={cam.k} see={reveal} inside={reveal > 0.001 ? <FolkChestAnatomy pose={fpose} st={st} uid="lkf-an" /> : null} />
        </g>
      </WorldSvg>
    </AirStage>
  );
};

const LurksInYourChest: React.FC<z.infer<typeof schema>> = ({ look }) => (look === "A" ? <LurksFolk /> : <LurksV3 look={look} />);
/** look "old": the delivered V3 picture (the londonCastV2 Worker and lurksAnatomy), unchanged */
const LurksV3: React.FC<z.infer<typeof schema>> = ({ look }) => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const P = perspective(cam, DEPTH);
  // V3: the medium (only for look "A")
  const air = (() => {
    if (look !== "A") return null;
    const c0 = camOf(0);
    const P0 = perspective(c0, DEPTH);
    const hz = 960 + (P.vp[1] - cam.cy) * cam.k;
    return makeAirView({ scene: { ...AIR_SCENE, F: P.Dc * cam.k }, frame, horizon: hz, cam: { x: cam.cx, y: -DEPTH.eyeY, z: -P.Dc }, rest: { x: c0.cx, y: -DEPTH.eyeY, z: -P0.Dc } });
  })();
  const { q, waste } = poseAt(frame);
  // the mouth opens with each cough and is closed again by f125
  const cough = coughAt(frame) * (1 - ease((frame - 117) / 8));
  const at: P2 = P.p(0, 0, 0);
  const scale = P.r(0);
  // the wasting narrows him a little (a horizontal squeeze about his own axis)
  const nar = 1 - 0.06 * waste;
  const bodyTf = `translate(${at[0].toFixed(3)} 0) scale(${nar.toFixed(5)} 1) translate(${(-at[0]).toFixed(3)} 0)`;
  // the see-through: one eased change, f18-44
  const reveal = ease((frame - 18) / 26);
  // V2 (harmony): as he turns see-through his engraved hatching fades out under ONE flat translucent body tone with a
  // clean contour, so two layers of hatching never fight over the lungs; the face keeps its lines (a feathered head
  // layer) so the sick face still reads
  const flatA = 0.5 * reveal;
  const detA = 1 - 0.8 * reveal;
  const headA = 0.42 * reveal;
  const rig = figureRig(SPEC, q);
  // the specks (f26-50) and the tubercles they form
  const ARR = [46, 48, 50];
  const specks = ARR.map((fa, i) => {
    const f0 = 26 + i * 2;
    if (frame < f0 || frame > fa) return null;
    return ease((frame - f0) / (fa - f0)) * 0.6 + 0.4 * ((frame - f0) / (fa - f0));
  });
  const nodules = ARR.map((fa) => ease((frame - (fa - 1)) / 8));
  const st: ChestState = { breath: breathAt(frame), waste, nodules: nodules.slice(0, N_NODULES), specks, spread: c01((frame - 80) / 48) };

  const world = (
      <WorldSvg cam={cam}>
        <defs>
          <filter id="lk-white" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
          </filter>
          <filter id="lk-flat" x="-10%" y="-10%" width="120%" height="120%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={2.4 / cam.k} result="dil" />
            <feFlood floodColor={DARK} result="ink" />
            <feComposite in="ink" in2="dil" operator="in" result="edge" />
            <feFlood floodColor="#CDBF9C" result="cream" />
            <feComposite in="cream" in2="SourceAlpha" operator="in" result="fill" />
            <feMerge>
              <feMergeNode in="edge" />
              <feMergeNode in="fill" />
            </feMerge>
          </filter>
          <filter id="lk-feather" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={3.2} />
          </filter>
          <mask id="lk-head" maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
            <g filter="url(#lk-feather)">
              <HeadShape q={q} at={at} scale={scale} fill="#fff" />
            </g>
          </mask>
          {/* the anatomy shows only inside him (over the sleeves too: the body is see-through) */}
          <mask id="lk-body" maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
            <g filter="url(#lk-white)">
              <Worker pose={q} at={at} scale={scale} uid="lk-mw" />
            </g>
            {/* (rev 2) never over his face: when the head drops forward it is in front of the upper chest */}
            <HeadShape q={q} at={at} scale={scale} />
          </mask>
        </defs>
        {air ? <AirRoom P={P} tone={(hex, Z, h = 0) => fogHex(air, hex, P.Dc + Z, h)} fogOf={(Z) => air.fogAt(P.Dc + Z)} shadow={air.pal.shadow} /> : <Room P={P} />}
        <ContactShadow P={P} X={0} Z={0} w={62} d={36} uid="lk-mcs" />
        <g transform={bodyTf}>
          {flatA > 0.001 ? (
            <g opacity={flatA} filter="url(#lk-flat)">
              <Worker pose={q} at={at} scale={scale} uid="lk-mf" />
            </g>
          ) : null}
          <g opacity={detA}>
            <Worker pose={q} at={at} scale={scale} uid="lk-man" shade={1} />
          </g>
          {headA > 0.001 ? (
            <g opacity={headA} mask="url(#lk-head)">
              <Worker pose={q} at={at} scale={scale} uid="lk-mh" shade={1} />
            </g>
          ) : null}
          {/* (rev 2/3) the mouth opens a little on each cough (the cast has no open mouth: a dark opening drawn in the
              head's own frame, where its FaceArt puts the lips) */}
          {cough > 0.04 ? (
            <g opacity={detA + headA * (1 - detA)}>
              <OpenMouth q={q} at={at} scale={scale} amt={cough} />
            </g>
          ) : null}
          {reveal > 0.001 ? (
            <g opacity={reveal} mask="url(#lk-body)">
              <ChestAnatomy view={{ rig, at, scale, yaw: q.yaw }} st={st} uid="lk-an" />
            </g>
          ) : null}
        </g>
      </WorldSvg>
  );
  if (air)
    return (
      <AirStage v={air} bloom={0} shafts={0}>
        {world}
      </AirStage>
    );
  return (
    <TexcocoPage cam={cam} vignette={0.85}>
      {world}
    </TexcocoPage>
  );
};

export default LurksInYourChest;
