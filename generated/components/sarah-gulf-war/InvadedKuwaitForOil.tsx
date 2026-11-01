// ---------------------------------------------------------------------------
// InvadedKuwaitForOil (sarah-gulf-war, cut 12). Dwarkesh 3D style (styles/dwarkesh-3d.md): a real baked map laid as the
// ground inside the teal air (the shared world gulfMapWorld.tsx, its header is the API). Opaque 1080x1920, 24 fps,
// 174 frames. RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: "On 2 August 1990 Saddam's tanks rolled south into Kuwait, wiping out the $14 billion Iraq owed it, and
// took Kuwait's oil fields."
//
// THE LINE: "(He wanted to do, and he did, he) invaded Kuwait because he wanted to eliminate his war debt, but also to
// take over Kuwait's oil fields,"
// WORD -> FRAME (Whisper, ~5-9 f early): invaded 0 · Kuwait 7 · because 25 · he 40 · wanted 57 · to 64 · eliminate 72 ·
//   his 84 · war 98 · debt 103 · but 111 · also 114 · to 119 · take 125 · over 130 · Kuwait's 137 · oil 154 · fields 160
//   (slot ends 174; she goes on, on camera).
// DURATION: the slot 12.708333 -> 19.958333 s = 7.25 s x 24 = 174 frames (f0..f173).
//
// THE MOTION (rev 2): one continuous camera over the map, looking south down the invasion route. From f0 an Iraqi
// armoured column (18 tanks, olive-khaki) is already rolling out of Safwan across the dashed border at one constant
// speed, the camera following it down the road past Raudhatain and Mutla to Jahra; IRAQ lies behind it (below the lower
// caption band, gone off the bottom by f8), KUWAIT slides up ahead on its word. At Kuwait City a cream stack of paper
// stands on the road under a plate "$14B owed to Kuwait" (up f68-80); the lead tank drives into it and the sheets
// burst away up into the air on an updraft and drain (mostly gone by "debt" ~f104, fully by f108) while the camera
// eases at the city. Then it pulls back and up over all of Kuwait with a small orbit (yaw 184 -> 176): the column fans
// out (the head south to Greater Burgan, the rear rows south-west from Jahra to Minagish and Umm Gudair, a second wave
// over the border into Raudhatain and Sabriya) and each field lights ORANGE in the ground as its tanks roll in, the
// glow spreading from its heart to its rim, oil derricks rising out of it as the glow passes ("take over Kuwait's oil
// fields" drives the lighting, f116-160). PERSIAN GULF slides up f138-150 and IRAQ (end) f159-170 in the gap between
// the caption bands. f160-173: a settled, living frame (a slow creep back toward Iraq, the air, idling tanks).
// CAUSE -> EFFECT: CONTACT = f88.6 (constant below): on f88 the lead's gun is at the stack's near face, on f89 it is
// in it and the bottom sheet lifts on that same frame (sheet 0 releases at CONTACT; the others follow by f91.4).
// A field's light starts the frame its first tank crosses its rim (FIELD_ENTRY in gulfMapCore: Minagish 115.75,
// Raudhatain 126.5, Burgan 127.75, Umm Gudair 133.5, Sabriya 139.75); every field fully lit by f160 (LIT_BY).
// Every tank parked by f158.3. Dust puffs only behind tanks that are driving (they settle with them).
// Orange = OIL only (the clip's prize): the fields' glow; tanks, paper, derricks, labels in muted earthy colours.
//
// DEPTH: gulfMapWorld's pinhole (F 1300) aimed at a target on the map from D 54 -> 56 (the follow, the camera a little
// slower than the column so the lead climbs the frame; lead tanks ~65-75 px long) -> 60 at the city -> 125 at the end
// (target (-12, -48.5), pitch 45 -> 54 deg, yaw 182 -> 180 -> 184 -> 176: looking a touch east of south, east is
// screen left, Iraq at the bottom; the five fields fill y ~330-1090, Kuwait City and the bay at y ~620, a thin haze at
// the top, no horizon). The map is the ground Y = 0 in world px (~1 km); tanks 3 km long (symbolic), growing
// 1 -> 1.4x as the camera rises (tankScaleAt in gulfMapCore), the labels' caps likewise (capAt). Fog: the ground's
// distance haze, every overlay the same. Dune ripples fade out as the camera rises.
//
// SOURCES: the invasion 2 Aug 1990, down the Safwan - Abdali - Mutla ridge - Jahra - Kuwait City road (Highway 80
//   corridor; the road here is approximate). Iraq owed Kuwait about US$14 billion borrowed during the Iran-Iraq War
//   (COMMON.md facts; Wikipedia, "Iraqi invasion of Kuwait"). Kuwait's fields: Greater Burgan (the world's second-largest
//   field), Minagish and Umm Gudair (west), Raudhatain and Sabriya (north); positions approximate centroids, honest blobs
//   (scripts/maps/configs/gulf.mjs). Map: Natural Earth 10m (land, borders).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, mixHex, formTone, AIR, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  Billboard,
  CUT12_DURATION,
  CUT12_REST,
  DERRICKS,
  GroundLabel,
  GulfGround,
  LEAD_STACK_S,
  LIGHT,
  PLACES,
  ROAD_PATH,
  STACK_AT,
  STACK_S,
  TANKS,
  TANK_L,
  TANK_MUZZLE,
  borderItems,
  c01,
  cityDot,
  cross,
  cut12Track,
  derrickItem,
  derrickRise,
  derrickShadowItem,
  distTo,
  dot,
  fieldLitAt,
  groundShadowItem,
  gulfAir,
  leadFrameAt,
  norm3,
  paint,
  pathAt,
  roadItem,
  sstep,
  sub3,
  tankAt,
  tankScaleAt,
  V,
  tankItems,
  groundBlobItem,
  tankShadowItem,
  toScreen,
  type Cam,
  type GulfAir,
  type Item,
  type P2,
  type V3,
} from "./gulfMapWorld";

export const FPS = 24;
export const DURATION = CUT12_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const f2 = (v: number) => v.toFixed(2);


// ---- dust behind the tracks --------------------------------------------------------------------------------------
const DUST_LIFE = 8;
const DUST = "#C9B48C";

// ---- the debt stack -----------------------------------------------------------------------------------------------
const STACK_N = 20;
const SHEET = { a: 3.2, b: 2.4, th: 0.13 };
const PAPER: Mat = { lit: "#F3EBDD", mid: "#D9CDB4", dark: "#8F846E" };
/** the road's direction at the stack (the lead tank's heading there) */
const STACK_DIR = (() => {
  const h = pathAt(ROAD_PATH, STACK_S).heading;
  return h;
})();
/** THE CONTACT: the lead's muzzle reaches the stack's near face (the stack's half length along the road) */
export const CONTACT = leadFrameAt(LEAD_STACK_S - TANK_MUZZLE * TANK_L - SHEET.a / 2);
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
type SheetState = { c: V3; R: [V3, V3, V3]; drain: number; op: number };
/** rotation matrix columns (a, b, y axes in world) from a heading, then tumble about the local axes */
const rotOf = (heading: number, pitch: number, roll: number, yawOff: number): [V3, V3, V3] => {
  const h = heading + yawOff;
  let a: V3 = [Math.sin(h), 0, -Math.cos(h)];
  let b: V3 = [Math.cos(h), 0, Math.sin(h)];
  let y: V3 = [0, 1, 0];
  // pitch: about b (nose up), roll: about a
  const rot = (v: V3, ax: V3, t: number): V3 => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    const d = dot(ax, v);
    const cr = cross(ax, v);
    return [v[0] * c + cr[0] * s + ax[0] * d * (1 - c), v[1] * c + cr[1] * s + ax[1] * d * (1 - c), v[2] * c + cr[2] * s + ax[2] * d * (1 - c)];
  };
  a = rot(a, b, pitch);
  y = rot(y, b, pitch);
  b = rot(b, a, roll);
  y = rot(y, a, roll);
  return [a, b, y];
};
const sheetAt = (i: number, frame: number): SheetState => {
  const jitA = (hash(i, 1) - 0.5) * 0.16;
  const jitB = (hash(i, 2) - 0.5) * 0.12;
  const yaw0 = (hash(i, 3) - 0.5) * 0.08;
  const fw: P2 = [Math.sin(STACK_DIR), -Math.cos(STACK_DIR)];
  const rt: P2 = [Math.cos(STACK_DIR), Math.sin(STACK_DIR)];
  const h0 = (i + 0.5) * SHEET.th;
  const c0: V3 = [STACK_AT[0] + fw[0] * jitA + rt[0] * jitB, h0, STACK_AT[1] + fw[1] * jitA + rt[1] * jitB];
  // release: the bottom sheets are shoved by the hull at once, the upper ones a beat later as the stack folds over
  const hn = i / (STACK_N - 1);
  const rel = CONTACT + 2.2 * hn * hn + (i === 0 ? 0 : 0.6 * hash(i, 4));
  const t = frame - rel;
  if (t <= 0) return { c: c0, R: rotOf(STACK_DIR, 0, 0, yaw0), drain: 0, op: 1 };
  const spd = 0.75 + 0.5 * hash(i, 5) + 0.3 * hn;
  const side = (hash(i, 6) - 0.5) * 1.6;
  const upV = 0.4 + 0.5 * hn + 0.25 * hash(i, 7);
  const tau = 5.5 + 2 * hash(i, 8);
  const dec = tau * (1 - Math.exp(-t / tau));
  // wind: an updraft carries the sheets up into the air, drifting a little toward the Gulf (east)
  const wind: V3 = [0.05 * t, 0.12 * t + 0.006 * t * t, 0.015 * t];
  const c: V3 = [
    c0[0] + (fw[0] * spd + rt[0] * side) * dec + wind[0],
    c0[1] + upV * dec + wind[1],
    c0[2] + (fw[1] * spd + rt[1] * side) * dec + wind[2],
  ];
  const w1 = (0.22 + 0.25 * hash(i, 9)) * (hash(i, 10) > 0.5 ? 1 : -1);
  const w2 = (0.18 + 0.3 * hash(i, 11)) * (hash(i, 12) > 0.5 ? 1 : -1);
  const tumble = tau * 1.6 * (1 - Math.exp(-t / (tau * 1.6))) + 0.05 * t;
  const R = rotOf(STACK_DIR, w1 * tumble, w2 * tumble, yaw0 + 0.04 * tumble * (hash(i, 13) - 0.5));
  const life = 15 + 5 * hash(i, 14);
  const u = c01(t / life);
  return { c, R, drain: Math.pow(u, 1.8), op: 1 - sstep(0.55, 1, u) };
};
const sheetItem = (cam: Cam, air: GulfAir, i: number, frame: number): Item | null => {
  const st = sheetAt(i, frame);
  if (st.op <= 0.005) return null;
  const [A, B, Y] = st.R;
  const P = (a: number, b: number, y: number): V3 => [st.c[0] + A[0] * a + B[0] * b + Y[0] * y, st.c[1] + A[1] * a + B[1] * b + Y[1] * y, st.c[2] + A[2] * a + B[2] * b + Y[2] * y];
  const ha = SHEET.a / 2;
  const hb = SHEET.b / 2;
  const ht = SHEET.th / 2;
  const corners = (y: number) => [P(ha, -hb, y), P(ha, hb, y), P(-ha, hb, y), P(-ha, -hb, y)];
  const top = corners(ht);
  const bot = corners(-ht);
  const faces: V3[][] = [top, [...bot].reverse()];
  for (let k = 0; k < 4; k++) {
    const j = (k + 1) % 4;
    faces.push([bot[k], bot[j], top[j], top[k]]);
  }
  const dist = distTo(cam, st.c[0], st.c[1], st.c[2]);
  const fa = air.fogAmt(dist);
  const airC = air.airHexAt(dist);
  const els: React.ReactNode[] = [];
  const cen = st.c;
  const vis: { z: number; el: React.ReactNode }[] = [];
  faces.forEach((q, k) => {
    // outward winding: compare with the sheet centre
    let n = cross(sub3(q[1], q[0]), sub3(q[2], q[0]));
    const m = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4, s[2] + p[2] / 4] as V3, [0, 0, 0] as V3);
    if (dot(n, sub3(m, cen)) < 0) n = [-n[0], -n[1], -n[2]];
    if (dot(n, sub3(cam.C, m)) <= 0) return;
    const sc = q.map((p) => toScreen(cam, p[0], p[1], p[2]));
    if (sc.some((s) => s.z < 0.05)) return;
    const nn = norm3(n);
    const edge = k >= 2;
    const base = formTone(PAPER, dot(nn, LIGHT) * (edge ? 0.6 : 1), PAL.shadow);
    const col = mixHex(mixHex(edge ? mixHex(base, PAPER.dark, 0.25) : base, airC, fa), airC, st.drain * 0.5);
    vis.push({
      z: dot(sub3(m, cam.C), cam.f),
      el: <path key={k} d={`M${sc.map((s) => `${f2(s.x)},${f2(s.y)}`).join("L")}Z`} fill={col} stroke={mixHex(mixHex("#8A7E66", airC, fa), airC, st.drain)} strokeWidth={0.6} strokeLinejoin="round" />,
    });
  });
  vis.sort((a, b) => b.z - a.z).forEach((v) => els.push(v.el));
  // the ledger lines on each sheet's top face (ink rows: a debt)
  if (dot(Y, sub3(cam.C, st.c)) > 0) {
    const rows = i === STACK_N - 1 ? [-0.55, -0.3, -0.05, 0.2, 0.45] : [];
    rows.forEach((bq, r) => {
      const a0 = P(-ha * 0.78, bq * hb * 1.6 * 0.5, ht + 0.002);
      const a1 = P(ha * (r === 0 ? 0.3 : 0.7), bq * hb * 1.6 * 0.5, ht + 0.002);
      const s0 = toScreen(cam, ...a0);
      const s1 = toScreen(cam, ...a1);
      els.push(<path key={`l${r}`} d={`M${f2(s0.x)},${f2(s0.y)}L${f2(s1.x)},${f2(s1.y)}`} stroke={mixHex(mixHex("#7A6A52", airC, fa), airC, st.drain)} strokeWidth={Math.max(0.7, 0.07 * s0.s)} strokeLinecap="round" />);
    });
  }
  const zc = dot(sub3(st.c, cam.C), cam.f);
  return { z: zc, el: <g key={`sheet${i}`} opacity={st.op}>{els}</g> };
};

// ---- labels -------------------------------------------------------------------------------------------------------
const ramp = (frame: number, f0: number, f1: number) => c01((frame - f0) / (f1 - f0));
const LBL = {
  // IRAQ (opening): behind the column at f0, below the lower caption band; it leaves the frame at the bottom by f8
  // and is not drawn after f30 (far off frame, y > 2500), so it never re-enters into the band as the camera rises. Not
  // later: by f59 this spot reaches the camera's plane, where its plate projects huge and dims the whole frame
  iraq: { at: [-34, -91] as P2, cap: 1.5 },
  // IRAQ (end): in the gap between the caption bands (y ~1320 at f173), slid up once the camera has settled there
  iraqEnd: { at: [-12.8, -82.3] as P2, cap: 2.2 },
  kuwait: { at: [-44, 4] as P2, cap: 3.2, capEnd: 4 },
  date: { at: [-41.75, 0.1] as P2, cap: 1.45, capEnd: 2.2 },
  city: { at: [6.5, -1.2] as P2, cap: 1.5, capEnd: 2.6 },
  gulf: { at: [43.9, 39.7] as P2, cap: 2.4 },
};
/** the labels hold their read as the camera rises (a map symbol, like the tanks): cap -> capEnd over the rise */
const capAt = (l: { cap: number; capEnd: number }, frame: number) => l.cap + (l.capEnd - l.cap) * sstep(108, 158, frame);

const InvadedKuwaitForOil: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = cut12Track.camAt(frame);
  const air = gulfAir(cam, frame, CUT12_REST);
  const lit = fieldLitAt(frame);
  const scale = tankScaleAt(frame);

  // ground-level overlays
  const ground: (Item | null)[] = [roadItem(cam, air, { s1: STACK_S + 1.5 }), ...borderItems(cam, air, "iraqKuwait"), ...borderItems(cam, air, "kuwaitSaudi"), ...borderItems(cam, air, "iraqSaudi"), ...borderItems(cam, air, "iraqIran", { op: 0.6 })];
  ground.push(cityDot(cam, air, PLACES.kuwaitCity as P2, 0.85, "kc"));

  // standing things: tanks, derricks, the stack's sheets
  const items: (Item | null)[] = [];
  TANKS.forEach((t) => {
    const st = tankAt(t, frame);
    const bob = st.speed > 0 ? 0.006 * Math.sin(frame * 1.35 + t.id * 1.7) : 0.0035 * Math.sin(frame * 2.1 + t.id);
    const pose = { at: st.at, heading: st.heading, scale, bob };
    const s = toScreen(cam, st.at[0], 0, st.at[1]);
    if (s.z < 0.5 || s.x < -200 || s.x > 1280 || s.y < -200 || s.y > 2120) return;
    items.push(tankShadowItem(cam, air, pose, `t${t.id}`), tankItems(cam, air, pose, `t${t.id}`));
    // dust: a puff kicked up behind the tracks every frame it drives, spreading and settling over DUST_LIFE frames
    for (let j = 0; j < DUST_LIFE; j++) {
      const e = Math.floor(frame) - j;
      const age = frame - e + 0.5;
      const pe = tankAt(t, e);
      if (pe.speed <= 0.01) continue;
      const fw: P2 = [Math.sin(pe.heading), -Math.cos(pe.heading)];
      const rt: P2 = [Math.cos(pe.heading), Math.sin(pe.heading)];
      const sc = tankScaleAt(e);
      const jit = (hash(t.id * 31 + e, 2) - 0.5) * 0.5;
      const x = pe.at[0] - fw[0] * 0.62 * sc + rt[0] * jit * sc - 0.05 * age;
      const y = pe.at[1] - fw[1] * 0.62 * sc + rt[1] * jit * sc;
      const r = sc * (0.2 + 0.075 * age);
      const amt = 0.55 * Math.pow(1 - age / (DUST_LIFE + 0.5), 1.6) * (pe.speed / V);
      items.push(groundBlobItem(cam, air, x, y, r * 1.25, r, amt, `du${t.id}-${e}`, pe.heading + Math.PI / 2, 0, DUST));
    }
  });
  DERRICKS.forEach((d) => {
    const r = derrickRise(d, (f) => fieldLitAt(f)[d.field], frame);
    if (r <= 0) return;
    items.push(derrickShadowItem(cam, air, d, r, `d${d.i}`), derrickItem(cam, air, d, r, `d${d.i}`));
  });
  for (let i = 0; i < STACK_N; i++) items.push(sheetItem(cam, air, i, frame));
  // the stack's contact shadow while it stands, sliding out from under it as the sheets go
  {
    const gone = c01((frame - CONTACT) / 5);
    if (gone < 1) items.push(groundShadowItem(cam, air, STACK_AT[0], STACK_AT[1], SHEET.a * 0.62, SHEET.b * 0.62, 0.8 * (1 - gone), "stk", STACK_DIR - Math.PI / 2, 0.35));
  }

  // the plate over the stack: up before "eliminate", lifted and drained away with the sheets
  const plateU = ramp(frame, 68, 80);
  const plateOut = c01((frame - CONTACT - 2) / 14);
  const plateAt: V3 = [STACK_AT[0] + 0.35 * plateOut * 6, STACK_N * SHEET.th + 1.1 + plateOut * plateOut * 4, STACK_AT[1]];

  return (
    <AbsoluteFill>
      <AirStage v={air.v} bloom={0.22}>
        <GulfGround cam={cam} frame={frame} air={air} lit={lit} />
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {paint(ground)}
          {frame < 30 ? <GroundLabel cam={cam} air={air} text="IRAQ" at={LBL.iraq.at} cap={LBL.iraq.cap} u={1} up={182} plate={0.4} /> : null}
          <GroundLabel cam={cam} air={air} text="IRAQ" at={LBL.iraqEnd.at} cap={LBL.iraqEnd.cap} u={ramp(frame, 159, 170)} up={178} plate={0.4} slide={12} />
          <GroundLabel cam={cam} air={air} text="KUWAIT" at={LBL.kuwait.at} cap={capAt(LBL.kuwait, frame)} u={ramp(frame, 9, 23)} up={210} plate={0.4} />
          <GroundLabel cam={cam} air={air} text="2 AUG 1990" at={LBL.date.at} cap={capAt(LBL.date, frame)} u={ramp(frame, 13, 27)} up={210} plate={0.6} track={0.12} />
          <GroundLabel cam={cam} air={air} text="KUWAIT CITY" at={LBL.city.at} cap={capAt(LBL.city, frame)} u={ramp(frame, 72, 84)} up={190} plate={0.7} track={0.1} />
          <GroundLabel cam={cam} air={air} text="PERSIAN GULF" at={LBL.gulf.at} cap={LBL.gulf.cap} u={ramp(frame, 138, 150)} up={178} plate={0.2} track={0.22} />
          {paint(items)}
          <Billboard
            cam={cam}
            air={air}
            at={plateAt}
            u={plateU}
            op={1 - plateOut}
            lines={[
              { text: "$14B", cap: 1.9 },
              { text: "owed to Kuwait", cap: 0.85, color: "#D9CDB4" },
            ]}
          />
        </svg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default InvadedKuwaitForOil;
