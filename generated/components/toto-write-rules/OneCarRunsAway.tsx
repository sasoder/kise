// ---------------------------------------------------------------------------
// OneCarRunsAway (toto-write-rules, cut 22), REV 1. Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 128 frames. World: toto-champion-eight/trackWorld.tsx (the side-view circuit, golden-hour
// sky, parallax), imported, never edited. Cars: rulesShared.tsx (builder A), imported.
//
// CHECK LINE: "With free rules, the richest team's car runs away and leaves the rest of the field far behind."
//
// THE LINE: "...in terms of infrastructure, will | come out with a car that is much superior than some of the other
// teams. And it would create a field | where the leading car could be five seconds quicker than the next one."
// WORD -> FRAME: come 7 · out 17 · with 21 · a 26 · car 29 · that 33 · is 38 · much 42 · superior 61 · than 72 ·
// some 79 · of 82 · the 86 · other 88 · teams 92 · And 100 · it 103 · would 104 · create 106 · a 116 · field 124.
// DURATION: the slot 22.680 -> 27.800 s = 5.12 s x 25 = 128 frames (f0..f127).
//
// THE MOTION (rev 1, the user: "the car looks super weird ... the way it drives out, it's not that natural"): mid-race,
// one continuous tracking shot on the hero (the upgraded cream car of cut 3). f0: a nose-to-tail train of four cars
// in the racing lane at one steady speed, the hero second (a rival ahead, two behind). From "come out" (f7) the hero
// accelerates on one smooth curve and pulls out of the slipstream with a gentle S into the overtaking lane (f8-24,
// nearer the camera, a small settle of the body as it straightens), runs up alongside the leader by "car", passes it on
// "much superior" and tucks back into the racing line once clear (a second gentle S), then draws away. The rivals hold a
// steady, slower pace (the two behind close up behind the leader while the camera is on the hero). From f72 an eased
// pull-out puts the hero on the right and shows the empty track between it and the train opening every frame.
// AMBER = engineering freedom: only the hero's upgraded parts (front wing, sidepod/floor, rear wing).
// CAUSE -> EFFECT: each car moves only under its own drive (hubs turn by the distance rolled, a small bob); the camera
// trucks with the hero. The hero changes lanes only while clear of the cars around it along the track (checked).
// FRAMING: composed in the keep-in box, then the whole picture 190 px lower (SHIFT_Y). The racing lane's ground line
// sits at y 1010 in the close and 1050 at the wide; the near kerb and verge below are moving context.
//
// SOURCES: none (no figures, no logos, no text). Car proportions: champShared F1 via rulesShared.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, amberBandFor, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { CAR, F1Car, M, type F1Tone } from "./rulesShared";
import { OnLane, TRACK, TRACK_COLOR, TrackStage, kartJitter, laneGroundY, laneK, planeCam, project, type TrackCam } from "../toto-champion-eight/trackWorld";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";

export const FPS = 25;
export const DURATION = 128;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the whole picture sits 190 px lower than its keep-in-box composition (COMMON.md, styles/cheeky-pint.md) */
export const SHIFT_Y = 190;

const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));
const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};

// --- the cars: builder A's F1Car (5.62 m, rulesShared CAR extents; metres from the cockpit's ground point) ---------
export const CAR_EXT = { rear: CAR.tail, nose: CAR.nose } as const;
const carLen = (CAR_EXT.nose - CAR_EXT.rear) * M;

// --- lanes (depth from the subject plane, world px; + = farther) ------------------------------------------------------
/** the racing line (the train, and the hero before and after its pass) and the overtaking lane, nearer the camera */
export const Z_RACE = -1.0 * M;
export const Z_PASS = -2.8 * M;
/** the pull-out into the overtaking lane and the tuck back in: gentle S curves (~16-18 frames, quintic ease) */
const OUT = [8, 24] as const;
export const IN = [91, 109] as const;
export const heroZ = (f: number) => Z_RACE + (Z_PASS - Z_RACE) * (ss5(OUT[0], OUT[1], f) - ss5(IN[0], IN[1], f));

// --- speeds (world px / frame) -----------------------------------------------------------------------------------------
/** the rivals: one steady race pace */
const VR = 135;
/** the hero: the same pace in the train, then one smooth acceleration from "come out" */
const VH_MAX = 214;
const ACC = [7, 48] as const;
export const vHero = (f: number) => VR + (VH_MAX - VR) * ss(ACC[0], ACC[1], f);
const SUB = 4;
const integ = (v: (f: number) => number) => {
  const out: number[] = [0];
  let d = 0;
  for (let f = -2; f < DURATION + 4; f++) {
    for (let s = 0; s < SUB; s++) d += v(f + (s + 0.5) / SUB) / SUB;
    out.push(d);
  }
  return (f: number) => {
    const g = f + 2;
    const i = Math.max(0, Math.min(out.length - 2, Math.floor(g)));
    return lerp(out[i], out[i + 1], g - i);
  };
};
const XH = integ(vHero);
export const heroX = (f: number) => XH(f) - XH(0);

// --- the rivals: the leader ahead of the hero, two behind; all in the racing lane at VR --------------------------------
/** cockpit-to-cockpit spacing in the train (5.62 m car + a slipstream gap of 0.8 m) */
const S0 = 6.4;
type Rival = { o0: number; o1: number; tone: F1Tone; driver: string; seed: number };
/** o0: cockpit x relative to the hero's at f0 (metres); o1: where the two behind close up to behind the leader (CLOSE,
 *  while the camera is on the hero; their extra pace is never more than the hero's lead over them grows) */
export const RIVALS: Rival[] = [
  { o0: S0, o1: S0, tone: "terracotta", driver: "#737D8A", seed: 2.9 },
  { o0: -S0, o1: 0, tone: "denim", driver: "#E2CFAA", seed: 4.4 },
  { o0: -2 * S0, o1: -S0, tone: "green", driver: "#C47B5A", seed: 5.3 },
];
const CLOSE = [40, 124] as const;
export const rivalX = (c: Rival, f: number) => VR * f + lerp(c.o0, c.o1, ss(CLOSE[0], CLOSE[1], f)) * M;

// --- the camera -------------------------------------------------------------------------------------------------------
// Framed on the racing lane, easing part-way with the hero into the overtaking lane (zRefAt). The pull-out runs linear in
// 1 / scale (eased at both ends), so the world's flow on screen falls smoothly (no stall).
const PULL = [72, 124] as const;
const L_END = 340;
const HX_END = 812;
const pullU = (f: number) => ss(PULL[0], PULL[1], f);
/** before the pull: ~500 px, so the train reads (the leader's tail on the right, the next car's nose on the left) */
const lenPre = (f: number) => lerp(500, 520, ss(0, 40, f));
/** before the pull: the hero's cockpit a touch left of centre, easing forward as it passes */
const sxPre = (f: number) => 520 + 40 * ss(30, 70, f);
const frameAt = (f: number) => {
  const u = pullU(f);
  const inv = lerp(1 / lenPre(f), 1 / L_END, u);
  const lag = lerp((sxPre(f) - 540) / lenPre(f), (HX_END - 540) / L_END, u) * carLen;
  return { len: 1 / inv, lag };
};
/** the racing lane's ground line on screen before the 190 px shift */
const heroGyAt = (f: number) => lerp(820, 860, pullU(f));
const D0 = 14 * M;
const K_REF = 0.38;
const DOLLY = 0.3;
const eyeAt = (f: number) => lerp(4.8, 5.8, pullU(f)) * M;

/** the plane the camera frames: the racing lane, following the hero 60% of the way into the overtaking lane (an
 *  operator's gentle zoom), so the hero grows only a little as it comes nearer */
const zRefAt = (f: number) => Z_RACE + 0.6 * (heroZ(f) - Z_RACE);
export const camAt = (f: number): TrackCam => {
  const zR = zRefAt(f);
  const fr = frameAt(f);
  const want = fr.len / carLen;
  let k = want;
  let D = D0;
  for (let i = 0; i < 30; i++) {
    D = D0 * Math.pow(K_REF / k, DOLLY);
    k = (want * (D + zR)) / D;
  }
  const eye = eyeAt(f);
  const kz = (k * D) / (D + zR);
  const hor = heroGyAt(f) - eye * kz;
  const groundY = hor + eye * k + SHIFT_Y;
  return { x: heroX(f) - fr.lag, k, D, eye, groundY };
};

// --- the grandstand close behind the far fence (director review 1: "the top is a crowd watching, not empty sky") ----
// One long card stand at STAND.z, just past the catch fence: a parapet, three rows of picture-book fans (a head, a body
// in a crowd tone, a few waving a scarf), the roof on pillars. Drawn over the stage (it is a child), so it is clipped
// below at the tyre wall's top line, and the stage's fence and marshal posts (both nearer) are drawn again over it
// with the stage's own recipe (colours, haze by depth, blur). Every fan is seeded by its seat (world x, row): a truck
// moves them, nothing re-deals. Pillars every 8 m: >= 3x the truck's step at that depth.
const STAND = { z: 11.8 * M, parapet: 1.4 * M, row: 1.75 * M, rows: 3, seat: 1.1 * M, fan: 1.65, roofY: 7.0 * M, roofT: 0.6 * M, pillar: 16 * M } as const;
const SKIN = ["#EBCDAE", "#D2A27F", "#A8775A", "#7E5640", "#F1DCC4"];
const HAIR = ["#5A4436", "#3F332C", "#8A6446", "#C9A37A", "#2F2925"];
const hash = (n: number) => {
  const s0 = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s0 - Math.floor(s0);
};
const fogOf = (zz: number) => (zz > 0 ? 0.62 * (1 - Math.exp(-zz / (26 * M))) : 0);
const hzOf = (col: string, zz: number) => mixHex(col, SKY.haze, fogOf(zz));
/** the stage's blur recipe at depth z (motion blur from the truck + depth of field off the subject lane) */
const stageBlur = (cam: TrackCam, v: number, zz: number) => {
  const mb = Math.min(44, 0.15 * Math.abs(v) * laneK(cam, zz));
  const dof = (3.2 * cam.k * Math.abs(zz)) / (cam.D + zz);
  return { sx: mb + dof, sy: dof };
};
const f2 = (n: number) => n.toFixed(2);

const Grandstand: React.FC<{ cam: TrackCam; v: number; S: number; quiet: number }> = ({ cam, v, S, quiet }) => {
  const uid = `ocrs${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const Z = STAND.z;
  const s = laneK(cam, Z);
  const P = (x: number, h: number, zz = Z) => project(cam, x, -h, zz);
  // review 2: hazed toward the stand's own colour (more in the close, `quiet` 1 -> 0 over the pull-out) so it sits back
  const hz = (col: string) => mixHex(mixHex(hzOf(col, Z), SKY.haze, 0.15), TRACK_COLOR.stand, lerp(0.38, 0.62, quiet));
  // visible world x at the stand's depth (+ margin)
  const half = (540 + 120) / s;
  const xa = cam.x - half;
  const xb = cam.x + half;
  // the clip: everything above the tyre wall's top line
  const tz = TRACK.tyreWall;
  const tyreTop = laneGroundY(cam, tz) - TRACK.tyreRows * TRACK.tyreH * laneK(cam, tz);
  const b = stageBlur(cam, v, Z);
  const yTop = P(0, STAND.roofY + STAND.roofT)[1];
  const yFoot = P(0, 0)[1];
  const X = (x: number) => P(x, 0)[0];
  const Y = (h: number) => P(0, h)[1];
  // rows of fans, back row first (each row's bodies overlap the bench behind)
  const fans: React.ReactNode[] = [];
  for (let r = STAND.rows - 1; r >= 0; r--) {
    const base = STAND.parapet + r * STAND.row;
    const i0 = Math.floor(xa / STAND.seat) - 1;
    const i1 = Math.ceil(xb / STAND.seat) + 1;
    for (let i = i0; i <= i1; i++) {
      const h1 = hash(i * 1.37 + r * 91.3);
      if (h1 < 0.14) continue; // an empty seat
      const h2 = hash(i * 2.71 + r * 57.1);
      const h3 = hash(i * 4.13 + r * 33.7);
      const wx = (i + 0.5 + (h2 - 0.5) * 0.36) * STAND.seat;
      const cx = X(wx);
      const tall = (0.9 + 0.2 * h3) * STAND.fan;
      const bw = 0.52 * STAND.fan * M * s;
      const bodyTop = Y(base + 0.5 * M * tall);
      const bodyBot = Y(base);
      const hr = 0.22 * STAND.fan * M * s;
      const sway = Math.sin(S * 0.21 + h2 * 40) * 0.05 * M * s;
      const hy = Y(base + 0.5 * M * tall + 0.2 * STAND.fan * M);
      const shirt = TRACK_COLOR.crowd[Math.floor(h2 * 6) % 6];
      const skin = SKIN[Math.floor(h3 * 5) % 5];
      const hair = HAIR[Math.floor(h1 * 5) % 5];
      const waving = h3 > 0.92;
      const wave = Math.sin(S * 0.42 + h1 * 30);
      fans.push(
        <g key={`${r}_${i}`}>
          <rect x={f2(cx - bw / 2 + sway * 0.5)} y={f2(bodyTop)} width={f2(bw)} height={f2(bodyBot - bodyTop + 0.1 * M * s)} rx={f2(bw * 0.42)} fill={hz(shirt)} />
          {waving ? (
            <path
              d={`M${f2(cx + bw * 0.35)} ${f2(bodyTop + hr * 0.4)}L${f2(cx + bw * 0.55 + wave * hr * 0.9)} ${f2(hy - hr * 2.4)}`}
              stroke={hz(skin)}
              strokeWidth={f2(Math.max(1, 0.1 * M * s))}
              strokeLinecap="round"
            />
          ) : null}
          {waving ? (
            <path
              d={`M${f2(cx + bw * 0.55 + wave * hr * 0.9)} ${f2(hy - hr * 2.4)}l${f2(hr * 2.2)} ${f2(hr * (0.3 + 0.4 * wave))}l${f2(-hr * 0.1)} ${f2(hr * 0.9)}l${f2(-hr * 2.1)} ${f2(-hr * (0.2 + 0.4 * wave))}Z`}
              fill={hz([TRACK_COLOR.tyreRed, COLOR.cream, TRACK_COLOR.boothRoof][Math.floor(h1 * 3) % 3])}
            />
          ) : null}
          <circle cx={f2(cx + sway)} cy={f2(hy)} r={f2(hr)} fill={hz(skin)} />
          <path d={`M${f2(cx + sway - hr)} ${f2(hy - hr * 0.05)}A${f2(hr)} ${f2(hr)} 0 0 1 ${f2(cx + sway + hr)} ${f2(hy - hr * 0.05)}Z`} fill={hz(hair)} />
        </g>,
      );
    }
  }
  const rowBands = Array.from({ length: STAND.rows }, (_, r) => {
    const base = STAND.parapet + r * STAND.row;
    return <rect key={`b${r}`} x={-100} y={f2(Y(base + STAND.row))} width={1280} height={f2(Y(base) - Y(base + STAND.row))} fill={hz(r % 2 ? TRACK_COLOR.seatsB : TRACK_COLOR.seatsA)} />;
  });
  const pillars: React.ReactNode[] = [];
  for (let n = Math.floor(xa / STAND.pillar) - 1; n <= Math.ceil(xb / STAND.pillar) + 1; n++) {
    const px = X(n * STAND.pillar + 3 * M);
    pillars.push(<rect key={`p${n}`} x={f2(px)} y={f2(yTop)} width={f2(0.32 * M * s)} height={f2(Y(STAND.parapet) - yTop)} fill={hz(TRACK_COLOR.standShade)} />);
  }
  // the stage's catch fence and marshal posts, again over the stand (same recipe as trackWorld's)
  const fz = TRACK.fence;
  const fs = laneK(cam, fz);
  const fTop = P(0, TRACK.fenceH, fz)[1];
  const fBase = laneGroundY(cam, fz);
  const fb = stageBlur(cam, v, fz);
  const fencePosts: React.ReactNode[] = [];
  {
    const h0 = (540 + 300) / fs;
    for (let n = Math.floor((cam.x - h0) / TRACK.fencePost) - 1; n <= Math.ceil((cam.x + h0) / TRACK.fencePost) + 1; n++) {
      const x0 = P(n * TRACK.fencePost, 0, fz)[0];
      const w = 0.1 * M * fs;
      fencePosts.push(
        <g key={`fp${n}`}>
          <rect x={f2(x0)} y={f2(fTop - 0.1 * M * fs)} width={f2(w)} height={f2(fBase - fTop + 0.1 * M * fs)} fill={hzOf(TRACK_COLOR.fence, fz)} />
          <rect x={f2(x0)} y={f2(fTop - 0.1 * M * fs)} width={f2(Math.max(0.8, w * 0.35))} height={f2(fBase - fTop + 0.1 * M * fs)} fill={hzOf(TRACK_COLOR.fenceLit, fz)} />
        </g>,
      );
    }
  }
  const mz = TRACK.marshal;
  const ms = laneK(cam, mz);
  const mb = stageBlur(cam, v, mz);
  const marshals: React.ReactNode[] = [];
  {
    const L = 46 * M;
    const h0 = (540 + 300) / ms;
    for (let n = Math.floor((cam.x - h0) / L) - 1; n <= Math.ceil((cam.x + h0) / L) + 1; n++) {
      const wx = n * L + 20 * M;
      const [x0, y0] = P(wx, 0, mz);
      const bw = 1.5 * M * ms;
      const bh = 2.1 * M * ms;
      const pole = 3.4 * M * ms;
      const wave = Math.sin(S * 0.45 + wx * 0.001);
      const fy = y0 - pole;
      const fl = 0.9 * M * ms;
      const ax = x0 + bw * 1.27;
      marshals.push(
        <g key={`m${n}`}>
          <rect x={f2(x0)} y={f2(y0 - bh)} width={f2(bw)} height={f2(bh)} fill={hzOf(TRACK_COLOR.booth, mz)} />
          <rect x={f2(x0 + bw * 0.2)} y={f2(y0 - bh * 0.78)} width={f2(bw * 0.6)} height={f2(bh * 0.3)} fill={hzOf(TRACK_COLOR.standShade, mz)} />
          <rect x={f2(x0 - bw * 0.08)} y={f2(y0 - bh - 0.18 * M * ms)} width={f2(bw * 1.16)} height={f2(0.2 * M * ms)} fill={hzOf(TRACK_COLOR.boothRoof, mz)} />
          <rect x={f2(x0 + bw * 1.25)} y={f2(fy)} width={f2(Math.max(1, 0.05 * M * ms))} height={f2(pole)} fill={hzOf(TRACK_COLOR.fence, mz)} />
          <path
            d={`M${f2(ax)} ${f2(fy)} C${f2(ax + fl * 0.4)} ${f2(fy - fl * 0.12 * wave)} ${f2(ax + fl * 0.7)} ${f2(fy + fl * 0.12 * wave)} ${f2(ax + fl)} ${f2(fy + fl * 0.04 * wave)} L${f2(ax + fl)} ${f2(fy + fl * 0.6 + fl * 0.04 * wave)} C${f2(ax + fl * 0.7)} ${f2(fy + fl * 0.6 + fl * 0.12 * wave)} ${f2(ax + fl * 0.4)} ${f2(fy + fl * 0.6 - fl * 0.12 * wave)} ${f2(ax)} ${f2(fy + fl * 0.6)} Z`}
            fill={hzOf(TRACK_COLOR.boothRoof, mz)}
          />
        </g>,
      );
    }
  }
  const filt = (id: string, bb: { sx: number; sy: number }) => (
    <filter id={id} filterUnits="userSpaceOnUse" x={-500} y={-300} width={2080} height={2600} colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${bb.sx.toFixed(3)} ${bb.sy.toFixed(3)}`} />
    </filter>
  );
  if (yFoot < -50) return null;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={-100} y={-400} width={1280} height={f2(tyreTop + 400)} />
        </clipPath>
        {filt(`${uid}s`, b)}
        {filt(`${uid}f`, fb)}
        {filt(`${uid}m`, mb)}
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <g filter={`url(#${uid}s)`}>
          {/* the back wall in shade, the benches, the fans, the parapet with its red trim, pillars, the roof */}
          <rect x={-100} y={f2(yTop)} width={1280} height={f2(yFoot - yTop)} fill={hz(TRACK_COLOR.standShade)} />
          {rowBands}
          {fans}
          <rect x={-100} y={f2(Y(STAND.parapet))} width={1280} height={f2(yFoot - Y(STAND.parapet) + 2)} fill={hz(TRACK_COLOR.stand)} />
          <rect x={-100} y={f2(Y(STAND.parapet * 0.78))} width={1280} height={f2(Y(STAND.parapet * 0.62) - Y(STAND.parapet * 0.78))} fill={hz(TRACK_COLOR.kerbRed)} />
          {pillars}
          <rect x={-100} y={f2(yTop)} width={1280} height={f2(Y(STAND.roofY) - yTop)} fill={hz(TRACK_COLOR.standRoof)} />
          <rect x={-100} y={f2(yTop)} width={1280} height={f2(Math.max(1, 0.12 * M * s))} fill={hz(TRACK_COLOR.checkCream)} />
          <rect x={-100} y={f2(Y(STAND.roofY))} width={1280} height={f2(Math.max(1, 0.25 * M * s))} fill={hz(mixHex(TRACK_COLOR.standShade, COLOR.shadow, 0.3))} opacity={0.6} />
        </g>
        <g filter={`url(#${uid}f)`}>
          <rect x={-100} y={f2(fTop)} width={1280} height={f2(fBase - fTop)} fill={hzOf(TRACK_COLOR.mesh, fz)} opacity={0.3} />
          {[1, 0.55, 0.08].map((h, i) => (
            <rect key={i} x={-100} y={f2(P(0, TRACK.fenceH * h, fz)[1])} width={1280} height={f2(Math.max(1, 0.045 * M * fs))} fill={hzOf(TRACK_COLOR.fence, fz)} />
          ))}
          {fencePosts}
        </g>
        <g filter={`url(#${uid}m)`}>{marshals}</g>
      </g>
    </g>
  );
};

// --- life ---------------------------------------------------------------------------------------------------------
/** the hero: cut 3's car, all three upgraded parts fitted (amber) */
const HERO_UPGRADE = { frontWing: 1, sidepod: 1, rearWing: 1 };
const HERO_DRIVER = "#C47B5A";
/** a car at speed: a small fast bob of the body on its tyres (world px), seeded per car */
const bobAt = (f: number, seed: number) => 0.012 * M * (0.5 + 0.5 * kartJitter(f, seed, 1).bob / 2.6);
/** the hero's settle as each lane change straightens: the body dips a touch on its springs and recovers */
const settleAt = (f: number) => {
  const dip = (t: number) => ss(t - 3, t + 1, f) * (1 - ss(t + 1, t + 9, f));
  return -0.035 * M * (dip(OUT[1] - 2) + dip(IN[1] - 2));
};

const OneCarRunsAway: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const vCam = camAt(f + 0.5).x - camAt(f - 0.5).x;
  const xh = heroX(f);
  const zh = heroZ(f);
  return (
    <TrackStage S={f} cam={cam} v={vCam}>
      <Grandstand cam={cam} v={vCam} S={f} quiet={1 - pullU(f)} />
      {/* far to near: the cars sorted by depth */}
      {[
        ...RIVALS.map((c, i) => {
          const x = rivalX(c, f);
          return { z: Z_RACE + 0.001 * (i + 1), node: (
            <OnLane key={`r${i}`} cam={cam} z={Z_RACE}>
              <F1Car x={x} y={0} k={laneK(cam, Z_RACE)} amberBand={amberBandFor(planeCam(cam, Z_RACE))} tone={c.tone} driver={c.driver} wheelSpin={x} bob={bobAt(f, c.seed)} />
            </OnLane>
          ) };
        }),
        { z: zh, node: (
          <OnLane key="h" cam={cam} z={zh}>
            <F1Car x={xh} y={0} k={laneK(cam, zh)} amberBand={amberBandFor(planeCam(cam, zh))} tone="cream" upgrade={HERO_UPGRADE} driver={HERO_DRIVER} wheelSpin={xh} bob={bobAt(f, 0.4) + settleAt(f)} />
          </OnLane>
        ) },
      ]
        .sort((a, b) => b.z - a.z)
        .map((e) => e.node)}
    </TrackStage>
  );
};

export default OneCarRunsAway;

/** for the probe scripts */
export const debugAt = (f: number) => {
  const cam = camAt(f);
  const box = (x: number, zz: number) => {
    const kz = laneK(cam, zz);
    const [rx] = project(cam, x + CAR_EXT.rear * M, 0, zz);
    const [nx] = project(cam, x + CAR_EXT.nose * M, 0, zz);
    return { rx, nx, gy: laneGroundY(cam, zz), len: nx - rx, kz };
  };
  return { cam, hero: box(heroX(f), heroZ(f)), rivals: RIVALS.map((c) => box(rivalX(c, f), Z_RACE)), v: vHero(f) };
};

// --- load-time checks (the self-audit: throw on a regression) ---------------------------------------------------------
const CHECKS = true;
(() => {
  if (!CHECKS) return;
  const fail = (m: string) => {
    throw new Error(`OneCarRunsAway: ${m}`);
  };
  const ext = (x: number) => [x + CAR_EXT.rear * M, x + CAR_EXT.nose * M] as const;
  const clear = (a: number, b: number, margin: number) => {
    const [a0, a1] = ext(a);
    const [b0, b1] = ext(b);
    return a1 + margin < b0 || b1 + margin < a0;
  };
  for (let f = 0; f < DURATION; f += 0.25) {
    // in the racing lane the hero never touches a rival (the train's slipstream gap is 0.8 m); while it leaves or
    // rejoins the lane it is clear of every rival along the track by >= 0.4 m
    const u = Math.abs(heroZ(f) - Z_RACE) / Math.abs(Z_PASS - Z_RACE);
    for (const c of RIVALS) {
      if (u < 0.6 && !clear(heroX(f), rivalX(c, f), 0.5 * M)) fail(`the hero touches a rival in the racing lane at f${f}`);
      if (u > 0.02 && u < 0.98 && !clear(heroX(f), rivalX(c, f), 0.4 * M)) fail(`the hero changes lane beside a rival at f${f}`);
    }
    // the rivals never touch
    for (const c of RIVALS) for (const d of RIVALS) if (c !== d && !clear(rivalX(c, f), rivalX(d, f), 0.4 * M)) fail(`two rivals touch at f${f}`);
    // no rival ever gains on the hero
    for (const c of RIVALS) if (rivalX(c, f + 0.25) - rivalX(c, f) > heroX(f + 0.25) - heroX(f) + 0.01) fail(`a rival gains on the hero at f${f}`);
  }
  for (let f = 0; f < DURATION; f++) {
    const d = debugAt(f);
    const vc = camAt(f + 0.5).x - camAt(f - 0.5).x;
    if (vc > 2 * TRACK.kerbBlock / 3.5) fail(`the truck is ${vc.toFixed(0)} world px/f at f${f}`);
    if (d.hero.rx < 65 || d.hero.nx > 1015) fail(`the hero leaves the keep-in box at f${f}`);
  }
  // the gap of empty track (hero's tail to the leader's nose, once passed) grows every frame from f86; the resolved wide
  const gapAt = (f: number) => {
    const d = debugAt(f);
    return d.hero.rx - Math.max(...d.rivals.map((b) => b.nx));
  };
  for (let f = 87; f < DURATION; f++) if (gapAt(f) <= gapAt(f - 1)) fail(`the gap stops growing at f${f}`);
  for (let f = 120; f < DURATION; f++) {
    const d = debugAt(f);
    if (d.hero.len < 330) fail(`the hero is ${d.hero.len.toFixed(0)} px at f${f}`);
    if (d.rivals[0].nx < 200) fail(`under 200 px of the leader in frame at f${f}`);
    if (gapAt(f) < 380) fail(`the gap is under 380 px at f${f}`);
  }
})();
