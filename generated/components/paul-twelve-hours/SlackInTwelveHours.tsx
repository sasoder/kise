// ---------------------------------------------------------------------------
// SlackInTwelveHours (paul-twelve-hours, cut 34). Paul world, Look C "Graphite air" (styles/dwarkesh-3d.md medium,
// styles/dwarkesh.md vocabulary; the shared world paulWorld / paulWorldSets / paulFolk, imported, never edited).
// Opaque 1080x1920, 23.976 fps, 91 frames.
//
// CHECK LINE: "half a day was enough to get into Anthropic's Slack."
//
// THE LINE: "...within 12 hours was able to get access to all of Anthropic Slack."
// WORD -> FRAME (Whisper, from f0; true onsets ~5-9 f later): within -4 · 12 2 · hours 9 · was 20 · able 30 · to 33 ·
//   get 37 · access 40 · to 47 · all 54 · of 65 · Anthropic 67 · Slack 74 · So 89
// DURATION: the slot 34.284 -> 38.080 s = 3.796 s x 23.976 = 91 frames (f0..f90).
//
// THE MOTION: close on the 12-hour dial standing on its "12 HOURS" block, set back on the left of the stage; its hand is
// already moving at f0 and sweeps the face cream in one eased move (sweep = lobe f-8..45: ~1/3 at "hours", full at f45).
// The camera pulls back and swings right in the same lobe (dolly f0-46, pan/orbit f2-56) and the outsider (rev 1: the
// world's 3D clay figure, typing on his open laptop, its lid toward him), the CATHEDRAL plate and the Anthropic Slack stack come in from the right, landing on the two-shot.
// The cause is the sweep closing: the moment it reaches 12 (f45, "get access" true ~f46) the stack's channel tiles
// slide out like drawers one after another, bottom up (first moves f46, then every 5 f, 13 f each, last settled f79):
// each front's # and message bar turn orange and glowing message bars show on the drawer's top. Five of the seven
// open; the bottom tile (behind the plate) and the fifth stay shut with their slate bars. The outsider turns his head
// up from his screen to the drawers (f44-68). From f56 only a slow continuing orbit + creep in (to f120) and the living drift.
// Orange = the American labs' algorithmic secrets: here the messages inside Anthropic's Slack (and the stack's core).
// The dial, outsider and plate are neutral.
//
// CAMERA: the world's orbit camera (camTrack + living), fov 28. Opening ~378 px/m at the dial (dial ~630 px wide, the
// "12 HOURS" block above y 1070; camera yaw -10, so the nearer outsider and plate start off frame right); one dolly
// lobe f0-46 to dist 18.5 and one pan/orbit lobe f2-56 (yaw -10 -> 6, pitch 4 -> 15) to the end two-shot: Slack cap
// top ~y 320, stack base ~y 1015, dial ~325 px wide (x ~85-410), outsider feet ~y 1040, plate y ~950-1040,
// x ~515-1010 (caps ~49 px). The plate crosses the lower edge of the keep-in only while sliding in (f25-35).
//
// REV 1 (user notes): the outsider is the 3D clay figure (paulOutsider3d) built in the spec, in place of the SVG;
// the Slack mark on the cap is black like the Anthropic one (makeSlackStack mark "black").
//
// SOURCES: Cathedral, reported by the Washington Post (Oct 26 2026): its AI agents got in within 12 hours via
// third-party tools and reached Slack messages (COMMON.md facts). NOT "all of Slack": nothing says ALL and two of the
// seven channel tiles stay shut. Marks: public/paul-twelve-hours/slack_black.svg (rev 1, black) and the Anthropic glyph on
// the world's stack cap; public/paul-twelve-hours/cathedral.png (the wordmark, white on a slate plate).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C, D2R, PaulStage, THREE, camTrack, clamp01, ease01, living, orbitCam, type Any, type Orbit, type V3, type WorldSpec } from "./paulWorld";
import { makeDial, makeSlackStack, yawTo } from "./paulWorldSets";
import { makeOutsider3D, outsiderCarry3D, type OutsiderPose3D } from "./paulOutsider3d";

export const FPS = 24000 / 1001;
export const DURATION = 91;
export const schema = z.object({ debug: z.boolean(), pick: z.array(z.number()) });
export const defaultProps = schema.parse({ debug: false, pick: [] });

// ===================================================================================================================
// THE SET
// ===================================================================================================================
const STACK = { X: 1.2, Z: 0 };
const DIAL: V3 = [-1.65, 1.19, -2.0]; // the dial's centre (its block then stands on the floor)
const DIAL_YAW = 0;
const PLATE_AT: V3 = [1.16, 0, 0.98]; // the CATHEDRAL plate's foot, centred under the stack
const WM = { W: 1.92, ASPECT: 1928 / 268, CAP: 0.83 }; // the wordmark: width (m), image aspect, cap height / image height
const OUT_AT: V3 = [-0.12, 0, 1.25];

// the sweep: one eased move already under way at f0, the 12 h full at f45
const sweepAt = (f: number) => ease01(-8, 45, f);
// the drawers that open (bottom = 0), in order, with how far each slides out (m). Tiles 0 and 4 stay shut.
const DRAWERS: { i: number; out: number }[] = [
  { i: 1, out: 0.68 },
  { i: 2, out: 0.5 },
  { i: 3, out: 0.36 },
  { i: 5, out: 0.64 },
  { i: 6, out: 0.42 },
];
const D_START = 46; // the first drawer moves as the sweep closes (12 h) and on "access" (true ~f46-49)
const D_STEP = 5;
const D_LEN = 13;
const drawerOpen = (k: number, f: number) => ease01(D_START + k * D_STEP, D_START + k * D_STEP + D_LEN, f);

const SPEC: WorldSpec = {
  fog: { near: 12, far: 40 },
  light: { center: [0, 1.5, 0.3], span: 7 },
  build: (w) => {
    const { K, T } = w;
    const Dl = makeDial(w, { pos: DIAL, yaw: DIAL_YAW });
    const Sl = makeSlackStack(w, { x: STACK.X, z: STACK.Z, mark: "black" });
    // the outsider: the world's 3D clay figure (rev 1), at the stack's foot beside the plate, typing on his laptop
    const Out = makeOutsider3D(w);
    // the CATHEDRAL plate: a slate slab with the white wordmark, tight round it so it fits under the stack's width;
    // sized so its caps are ~50 px in the end two-shot (w.legible only as a floor), turned to the final camera
    const plateRoot = K.group(w.scene, PLATE_AT, yawTo(camOf(80), PLATE_AT));
    const plate = K.group(plateRoot);
    const wmT = T.image("paul-twelve-hours/cathedral.png", WM.ASPECT, { px: 1600 });
    const wmH = WM.W / WM.ASPECT;
    const PW = WM.W + 0.16;
    const PH = wmH + 0.15;
    const slab = K.group(plate, [0, 0.04 + PH / 2, 0]);
    slab.rotation.x = -6 * D2R;
    K.box([PW, PH, 0.09], K.clay(C.slateDeep), [0, 0, 0], { r: 0.035, parent: slab });
    K.print(wmT, WM.W, [0, 0, 0.047], [0, 0, 0], { parent: slab, trueColour: true });
    [-0.75, 0.75].forEach((x) => K.box([0.14, 0.06, 0.22], K.clay(C.stone), [x, 0.03, 0.02], { r: 0.02, parent: plate }));
    // a fixed world size: caps ~49 px at the end two-shot (bigger on the way there), so legible() never rescales it live
    {
      const ce = camOf(80);
      const fwd = [ce.target[0] - ce.pos[0], ce.target[1] - ce.pos[1], ce.target[2] - ce.pos[2]];
      const fl = Math.hypot(fwd[0], fwd[1], fwd[2]);
      const pc = [PLATE_AT[0], 0.3, PLATE_AT[2]];
      const depth = ((pc[0] - ce.pos[0]) * fwd[0] + (pc[1] - ce.pos[1]) * fwd[1] + (pc[2] - ce.pos[2]) * fwd[2]) / fl;
      const px = (wmH * WM.CAP * (1920 / 2 / Math.tan((ce.fov * D2R) / 2))) / depth;
      plate.scale.setScalar(Math.max(1, 49 / px));
    }
    w.legible(plate, wmH * WM.CAP);
    K.blob(PLATE_AT[0], PLATE_AT[2] + 0.05, PW + 0.3, 0.55, 0.5);
    // what each drawer holds: an orange # over the front one, and on its top (hidden under the tile above until it
    // slides out) a channel of glowing message bars
    const hashO = T.text("#", { px: 200, color: C.orange, pad: 0.1 });
    const extras = Sl.tiles.map((t: Any, i: number) => {
      const zf = 0.65 + 0.004;
      const hm = K.print(hashO, 0.2, [-0.62, 0, zf + 0.001], [0, 0, 0], { parent: t.tg, opacity: 0 });
      hm.material.emissive = new THREE.Color(C.orange);
      hm.material.emissiveMap = hashO.tex;
      hm.material.emissiveIntensity = 0;
      const top = K.group(t.tg, [0, 0.15 + 0.008, 0]);
      const glow = K.orange(0.9, true);
      const rows = [
        [-0.55, 0.62, 0.55],
        [-0.55, 0.48, 0.8],
        [-0.55, 0.34, 0.4],
        [-0.55, 0.2, 0.68],
      ];
      rows.forEach(([x0, zz, len], r) => {
        K.box([len * 1.1, 0.012, 0.06], glow, [x0 + 0.12 + (len * 1.1) / 2, 0, zz - 0.04], { r: 0.005, seg: 2, parent: top, shadow: false });
        if (r === 0) K.box([0.06, 0.012, 0.06], glow, [x0, 0, zz - 0.04], { r: 0.005, seg: 2, parent: top, shadow: false });
      });
      top.visible = false;
      return { hm, top, glow, i };
    });
    return (f) => {
      Dl.update({ sweep: sweepAt(f) });
      const open = Array.from({ length: Sl.tiles.length }, () => 0);
      const outs = Array.from({ length: Sl.tiles.length }, () => 0);
      DRAWERS.forEach((d, k) => {
        open[d.i] = drawerOpen(k, f);
        outs[d.i] = d.out;
      });
      Sl.update({ open });
      Sl.tiles.forEach((t: Any, i: number) => {
        const v = open[i];
        t.tg.position.z = STACK.Z + v * outs[i];
        t.tg.rotation.y = v * t.skew * 0.5 * D2R;
        const e = extras[i];
        e.hm.material.opacity = clamp01(v * 2);
        e.hm.material.emissiveIntensity = 0.55 * clamp01(v * 2);
        e.top.visible = v > 0.01;
        e.glow.emissiveIntensity = 0.9 * clamp01(v * 1.5);
      });
      Out.update(outPose(f), OUT_AT, 1.45);
    };
  },
};

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
const START: Orbit = { target: [-1.65, 0.3, -1.9], dist: 10.2, yaw: -10, pitch: 4, fov: 28 };
const TRACK = camTrack(START, [
  { from: 0, to: 46, key: { dist: 18.5 } },
  { from: 2, to: 56, key: { target: [0.03, 0.18, 0.4], yaw: 6, pitch: 15 } },
  { from: 44, to: 120, key: { target: [0.13, 0.13, 0.4], dist: 18.0, yaw: 4 } },
]);
const camOf = (f: number) => orbitCam(living(TRACK(f), f));

// his body: turned from the end camera a little toward the stack (world yaw, fixed so he does not swivel with the
// camera); the laptop opens toward him, so its lid faces him and its back faces us
const OUT_YAW = yawTo(camOf(80), OUT_AT) + 22;
const outPose = (f: number): OutsiderPose3D => {
  // typing, eyes on the screen; as the drawers open his head turns up and over to the stack (one lobe, f44-68)
  const look = ease01(44, 68, f);
  return outsiderCarry3D(f, "laptop", { yaw: OUT_YAW, typing: 1, headPitch: 14 - 26 * look, headYaw: 26 * look });
};

const SlackInTwelveHours: React.FC<z.infer<typeof schema>> = ({ debug, pick }) => {
  const cur = useCurrentFrame();
  const f = pick.length ? pick[Math.min(cur, pick.length - 1)] : cur;
  const cam = camOf(f);
  return (
    <PaulStage
      spec={SPEC}
      cam={cam}
      frame={f}
      overlay={(P) => {
        const capTop = P([STACK.X, 3.19, 0.87]);
        const base = P([STACK.X, 0, 0.75]);
        const dl = P([DIAL[0] - 0.86, DIAL[1], DIAL[2]]);
        const dr = P([DIAL[0] + 0.86, DIAL[1], DIAL[2]]);
        const ft = P(OUT_AT);
        const pl = P(PLATE_AT);
        return (
          <>
            {debug ? (
              <text x={20} y={60} fontSize={30} fill="red">{`f${f} cap ${capTop[1].toFixed(0)} base ${base[1].toFixed(0)} dial ${dl[0].toFixed(0)}-${dr[0].toFixed(0)} feet ${ft[1].toFixed(0)} plate ${P([PLATE_AT[0] - 1.13, 0, PLATE_AT[2]])[0].toFixed(0)}-${P([PLATE_AT[0] + 1.13, 0, PLATE_AT[2]])[0].toFixed(0)} y${pl[1].toFixed(0)}`}</text>
            ) : null}
            {debug ? (
              <text x={20} y={100} fontSize={30} fill="red">{`out ${P([OUT_AT[0] - 0.2, 0, OUT_AT[2]])[0].toFixed(0)}-${P([OUT_AT[0] + 0.2, 0, OUT_AT[2]])[0].toFixed(0)} dialTop ${P([DIAL[0], DIAL[1] + 0.86, DIAL[2]])[1].toFixed(0)} dialC ${P(DIAL)[0].toFixed(0)},${P(DIAL)[1].toFixed(0)} stackR ${P([STACK.X + 0.95, 0, 0.75])[0].toFixed(0)}`}</text>
            ) : null}
          </>
        );
      }}
    />
  );
};

export default SlackInTwelveHours;
