import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BROWSER,
  BrowserCard,
  CUTS,
  CursorArrow,
  FPS,
  LightSweep,
  MuseStage,
  Slotted,
  amberBandM,
  makeClockCam,
  makePoolTrack,
  productPiece,
  restToRest,
  travel,
  viewOf,
  winU,
} from "../kits/cheeky-pint/museShared";

// ---------------------------------------------------------------------------
// ThatStepTakenCare — cut 3 of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03, the Meta
// episode), Cheeky Pint S4 style on the clip's one family (museShared.tsx; brief
// out/musecommerce/briefs/BRIEF.md; out/musecommerce/WORLD_READY.md). 1080x1920 (9:16), 23.976 fps, opaque.
//
// CHECK LINE: All the tab-hopping and research collapses into one step that the agent does for me.
//
// THE LINE: "I don't feel like click on all these websites and do all this research to try to find the
// exact products. Like that step is taken care of for me."
// WINDOW: seq 30.364 -> 36.662, span 6.298 s. DURATION = round(6.298 x 23.976) = 151, + 16-frame tail = 167.
// ONSETS (f): I 2 · don't 5 · feel 8 · like 10 · click 15 · on 26 · all 30 · these 31 · websites 34 ·
// and 44 · do 51 · all 54 · this 56 · research 58 · to 68 · try 72 · to 74 · find 77 · the 84 · exact 89 ·
// products. 94 · Like 107 · that 109 · step 117 · is 125 · taken 128 · care 131 · of 137 · for 138 ·
// me. 142 · And 149 · (slot ends 151)
//
// ONE MOTION: browser windows pile up under a clicking cursor until they fill the frame; then the amber agent
// rises over the pile, the whole pile and the cursor pour into its slot, and one product (a lamp) comes out.
// The camera eases back with the growing pile and then only creeps in: the resolved pair (agent + lamp) stands
// at the frame's middle, the agent's bottom edge above the caption strip.
//
// CLOCK (f): clicks (full press) 15 · 28 · 41 · 53 · 65 · 77, each window enters on the frame after its press;
// agent rises 95-108 ("that step" 109) · the pile pours into the slot 105.5-125, the cursor last 116-127 ·
// LightSweep 124-135 · lamp out 127-138 ("taken care of" 128-137) · from 140: settled, a slow push + pool drift.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = CUTS.ThatStepTakenCare.duration; // 167

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

type P2 = { x: number; y: number };
const smooth = (u: number) => {
  const t = Math.max(0, Math.min(1, u));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the camera: close on two windows, easing back as the pile grows, then a push onto the agent ---------
const cam = makeClockCam(
  { x: 16, y: -4, k: 3.05 },
  [
    { f0: -30, f1: 50, k: 2.4, dx: -16, dy: -34 },
    { f0: 36, f1: 90, k: 1.9, dy: 14 },
    { f0: 98, f1: 130, k: 1.955 },
    // the tail's creep: one long glide still running at the last frame (about 1 % of scale over f140-166)
    { f0: 112, f1: 236, k: 2.06, dy: -4 },
  ],
  DURATION,
);
const pool = makePoolTrack(
  { x: 20, y: 0 },
  [
    { f0: 20, f1: 90, x: 0, y: -30 },
    { f0: 96, f1: 122, x: 0, y: -90 },
    { f0: 132, f1: 210, x: 46, y: -130 },
  ],
  DURATION,
);

// --- the agent ----------------------------------------------------------------------------------------
// Resolved frame: the agent's bottom edge at screen y 1052 on the last frame (+ the stage's sway, <= 5 px:
// never past 1060, clear of the caption strip at 1080), the pair centred on x 540 (the camera ends on x 0).
const END_CAM = cam.at(DURATION - 1);
const AGENT_SIZE = 176; // about 350 px on screen in the resolved frame; the lamp tile about 290 px
const AGENT = { x: 0, floor: END_CAM.y + (1052 - 960) / END_CAM.k, size: AGENT_SIZE } as const;
const AGENT_TOP = AGENT.floor - AGENT.size; // the slot's line (world y)
const AGENT_F0 = 95; // it starts below the frame's bottom edge
const AGENT_F1 = 108;
const AGENT_START = viewOf(cam.at(AGENT_F0)).y1 + AGENT.size + 16;
const LAMP = productPiece("lamp", 80);
const LAMP_F0 = 127;
const LAMP_F1 = 138;
const SWEEP_F0 = 124;
const SWEEP_F1 = 135;

// --- the pile -----------------------------------------------------------------------------------------
type Side = "L" | "R" | "T" | null;
type CardDef = { x: number; y: number; rot: number; side: Side; f0: number; f1: number };
const ENTER = 12;
const mk = (x: number, y: number, rot: number, side: Side, f0: number, f1 = f0 + ENTER): CardDef => ({ x, y, rot, side, f0, f1 });
/** z order = index: later cards lie on the pile. A and B are there at f0; C is sliding in at f0. */
const CARDS: CardDef[] = [
  mk(-48, -35, -5, null, -99),
  mk(44, 30, 4, null, -99),
  mk(100, -125, 8, "R", -9, 12),
  mk(-120, 150, -7, "L", 14.5),
  mk(-70, -235, -3, "T", 27.5),
  mk(100, 275, 6, "R", 40.5),
  mk(110, -340, -9, "R", 52.5),
  mk(-90, 400, -4, "L", 64.5),
  mk(-100, -440, 5, "T", 76.5),
];
const tiltOf = (side: Side) => (side === "L" ? -7 : side === "R" ? 7 : side === "T" ? 5 : 0);
/** where a card starts: just past the frame edge it comes in over, as the camera stands on its first frame */
const START: P2[] = CARDS.map((c) => {
  const v = viewOf(cam.at(Math.max(0, c.f0)));
  // a window called by a click waits with its (tilted) corner 4 px past the edge on the press frame, so its
  // first frame in the picture is the one after the press; the window already sliding at f0 keeps its place
  const called = c.f0 > 0;
  const a = ((c.rot + tiltOf(c.side)) * Math.PI) / 180;
  const hx = called ? (BROWSER.w * Math.abs(Math.cos(a)) + BROWSER.h * Math.abs(Math.sin(a))) / 2 : BROWSER.w / 2;
  const hy = called ? (BROWSER.w * Math.abs(Math.sin(a)) + BROWSER.h * Math.abs(Math.cos(a))) / 2 : BROWSER.h / 2;
  const m = called ? 4 : 26;
  if (c.side === "R") return { x: v.x1 + hx + m, y: c.y + 26 };
  if (c.side === "L") return { x: v.x0 - hx - m, y: c.y - 22 };
  if (c.side === "T") return { x: c.x + 34, y: v.y0 - hy - m };
  return { x: c.x, y: c.y };
});

// --- the cursor: travels from window to window; each click (a press of the card under it) calls the next --
/** clicks: frame of full press, the card pressed, the tip's place on it. Each hop is short (<= 250 world px)
 *  so it reads as a travel: the cursor works its way round the pile, it does not jump across it. */
const CLICKS: { f: number; card: number; x: number; y: number }[] = [
  { f: 15, card: 2, x: 118, y: -112 },
  { f: 28, card: 0, x: -98, y: -64 },
  { f: 41, card: 3, x: -140, y: 166 },
  { f: 53, card: 1, x: 60, y: 52 },
  { f: 65, card: 5, x: 120, y: 292 },
  { f: 77, card: 3, x: -96, y: 186 },
];
/** the press: down over the 2 frames before fc, held 1, back over 3 */
const pressAt = (f: number, fc: number) => smooth((f - (fc - 2)) / 2) * (1 - smooth((f - (fc + 1)) / 3));
const CUR_SIZE = 56;
const CUR_DIP = 7; // screen px the cursor drops on a press
const CARD_SINK = 2.5; // world px the pressed window sinks (on top of BrowserCard's own press)
const CUR0: P2 = { x: 44, y: 50 };
const CUR_REST: P2 = { x: -150, y: -190 }; // where its search has taken it when it is called to the slot
const CUR_DIVE_F0 = 116;
const CUR_DIVE_F1 = 127;
const quad = (a: P2, c: P2, b: P2, t: number): P2 => {
  const m = 1 - t;
  return { x: m * m * a.x + 2 * m * t * c.x + t * t * b.x, y: m * m * a.y + 2 * m * t * c.y + t * t * b.y };
};
/** a leg of the cursor's way: a to b on a shallow arc (bend = sag as a share of the chord), eased */
type Leg = { f0: number; f1: number; a: P2; b: P2; c: P2 };
const legOf = (a: P2, b: P2, f0: number, f1: number, bend: number): Leg => ({
  f0,
  f1,
  a,
  b,
  c: { x: (a.x + b.x) / 2 - (b.y - a.y) * bend, y: (a.y + b.y) / 2 + (b.x - a.x) * bend },
});
/** hops: each leaves on the frame after a press and arrives one frame before the next (10-11 frames) */
const HOPS: Leg[] = CLICKS.map((c, i) => {
  const prev = i === 0 ? { f: -3, ...CUR0 } : CLICKS[i - 1];
  return legOf({ x: prev.x, y: prev.y }, { x: c.x, y: c.y }, prev.f + 1, c.f - 1, i % 2 === 0 ? 0.17 : -0.17);
});
const LAST_CLICK = CLICKS[CLICKS.length - 1];
/** after the last click it keeps searching: one slow arc up the pile's left side, still moving when called */
const SEARCH: Leg = { f0: LAST_CLICK.f + 1, f1: CUR_DIVE_F0, a: { x: LAST_CLICK.x, y: LAST_CLICK.y }, b: CUR_REST, c: { x: -214, y: 20 } };
/** in and out eased, but still drifting at its end (the dive picks that speed up) */
const searchEase = (u: number) => {
  const t = Math.max(0, Math.min(1, u));
  return 0.62 * smooth(t) + 0.38 * t * t;
};
const diveEase = (u: number) => {
  const t = Math.max(0, Math.min(1, u));
  return 0.22 * t + 0.78 * Math.pow(t, 2.3);
};

// --- the pour: every card leaves the pile for the agent's slot, top of the pile first, at one rhythm ------
const POUR_F0 = 105.5;
const POUR_STEP = 1.25;
const POUR_LEN = 9.5;
const IN_SCALE = 0.6; // a window seen end-on as it enters the slot
const HOVER_Y = AGENT_TOP - 6 - (BROWSER.h * IN_SCALE) / 2;
const SUNK_Y = AGENT_TOP + 5 + (BROWSER.h * IN_SCALE) / 2;
const bez = (a: P2, b: P2, c: P2, d: P2, t: number): P2 => {
  const m = 1 - t;
  return {
    x: m * m * m * a.x + 3 * m * m * t * b.x + 3 * m * t * t * c.x + t * t * t * d.x,
    y: m * m * m * a.y + 3 * m * m * t * b.y + 3 * m * t * t * c.y + t * t * t * d.y,
  };
};
type Route = { pts: P2[]; len: number[]; total: number; hover: number };
const routeOf = (from: P2, ctrl: P2, hover: P2, end: P2): Route => {
  const pts: P2[] = [];
  const above = { x: hover.x, y: hover.y - 120 };
  for (let i = 0; i <= 60; i++) pts.push(bez(from, ctrl, above, hover, i / 60));
  const iHover = pts.length - 1;
  for (let i = 1; i <= 12; i++) pts.push({ x: hover.x, y: mix(hover.y, end.y, i / 12) });
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, len, total: len[len.length - 1], hover: len[iHover] / len[len.length - 1] };
};
const along = (r: Route, s: number): P2 => {
  const d = Math.max(0, Math.min(1, s)) * r.total;
  let i = 1;
  while (i < r.len.length - 1 && r.len[i] < d) i++;
  const t = (d - r.len[i - 1]) / Math.max(1e-6, r.len[i] - r.len[i - 1]);
  return { x: mix(r.pts[i - 1].x, r.pts[i].x, t), y: mix(r.pts[i - 1].y, r.pts[i].y, t) };
};
/** cards above the slot swoop down into it; cards beside or below it go round the agent's side and over */
const ROUTES: Route[] = CARDS.map((c) => {
  const up = c.y < AGENT_TOP - 20;
  const side = c.x < 0 ? -1 : 1;
  const ctrl = up ? { x: c.x * 0.85, y: Math.max(c.y - 50, -470) } : { x: side * 350, y: c.y * 0.3 - 150 };
  return routeOf({ x: c.x, y: c.y }, ctrl, { x: 0, y: HOVER_Y }, { x: 0, y: SUNK_Y });
});
const pourStart = (i: number) => POUR_F0 + (CARDS.length - 1 - i) * POUR_STEP;
const CUR_ROUTE = routeOf(CUR_REST, { x: CUR_REST.x + 22, y: CUR_REST.y - 66 }, { x: -13, y: AGENT_TOP - CUR_SIZE - 8 }, { x: -13, y: AGENT_TOP + 4 });

const cursorAt = (f: number): P2 & { press: number; dive: number } => {
  let p = CUR0;
  let press = 0;
  for (let i = 0; i < CLICKS.length; i++) {
    const h = HOPS[i];
    if (f > h.f0) p = quad(h.a, h.c, h.b, smooth(winU(f, h.f0, h.f1)));
    press = Math.max(press, pressAt(f, CLICKS[i].f));
  }
  if (f > SEARCH.f0) p = quad(SEARCH.a, SEARCH.c, SEARCH.b, searchEase(winU(f, SEARCH.f0, SEARCH.f1)));
  const u = winU(f, CUR_DIVE_F0, CUR_DIVE_F1);
  if (u > 0) p = along(CUR_ROUTE, diveEase(u));
  return { ...p, press, dive: u };
};

const ThatStepTakenCare: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const uid = `tsc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const c = cam.at(f);
  const k = c.k;
  const band = amberBandM(c);
  const cur = cursorAt(f);

  const cards = CARDS.map((d, i) => {
    const ps = pourStart(i);
    const u = winU(f, ps, ps + POUR_LEN);
    if (u >= 1) return null;
    if (u > 0) {
      // the pour: lift off the pile, fly to the slot, enter it end-on (clipped at the slot's line)
      const s = Math.pow(u, 1.45);
      const r = ROUTES[i];
      const p = along(r, s);
      const g = smooth(s / r.hover);
      const card = <BrowserCard cx={p.x} cy={p.y} k={k} rot={d.rot * (1 - smooth(s / (r.hover * 0.8)))} scale={mix(1, IN_SCALE, g)} lift={smooth(u / 0.2)} shadow={1 - smooth((s - r.hover) / (1 - r.hover))} />;
      return s >= r.hover ? (
        <g key={i} clipPath={`url(#${uid})`}>
          {card}
        </g>
      ) : (
        <React.Fragment key={i}>{card}</React.Fragment>
      );
    }
    if (f < d.f0) return null;
    const tr = travel(START[i], { x: d.x, y: d.y }, f, d.f0, d.f1);
    const tilt = tiltOf(d.side);
    let press = 0;
    for (const cl of CLICKS) if (cl.card === i) press = Math.max(press, pressAt(f, cl.f));
    // the click: the window sinks one elevation under the cursor (down, a touch smaller, shadow tightened) and returns
    return <BrowserCard key={i} cx={tr.x} cy={tr.y + CARD_SINK * press} k={k} rot={d.rot + tilt * (1 - restToRest(tr.u, 2.5))} lift={tr.lift} press={press} scale={1 - 0.02 * press} />;
  });

  const ag = travel({ x: AGENT.x, y: AGENT_START }, { x: AGENT.x, y: AGENT.floor }, f, AGENT_F0, AGENT_F1, { p: 2.2 });
  const lampOut = restToRest(winU(f, LAMP_F0, LAMP_F1), 2.2);
  const cursor = <CursorArrow x={cur.x} y={cur.y + (CUR_DIP / k) * cur.press} k={k} size={CUR_SIZE} press={cur.press} shadow={cur.dive > 0.75 ? 1 - smooth((cur.dive - 0.75) / 0.2) : 1} />;

  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={c} rest={cam.rest} pool={pool(f)}>
        <defs>
          {/* everything above the agent's slot line: what goes into the slot is cut off there */}
          <clipPath id={uid}>
            <rect x={-4000} y={AGENT_TOP - 8000} width={8000} height={8000} />
          </clipPath>
        </defs>
        {cards}
        {f >= AGENT_F0 ? (
          <Slotted x={ag.x} floor={ag.y} k={k} size={AGENT.size} face={{ kind: "agent" }} band={band} lift={Math.max(ag.lift, 0)} piece={LAMP} out={lampOut} />
        ) : null}
        {f >= AGENT_F1 ? (
          <LightSweep x={AGENT.x - AGENT.size / 2} y={AGENT_TOP} w={AGENT.size} h={AGENT.size} k={k} t={winU(f, SWEEP_F0, SWEEP_F1)} on="amber" r={(4 * AGENT.size) / 96} />
        ) : null}
        {cur.dive >= 1 ? null : cur.dive > 0 ? <g clipPath={`url(#${uid})`}>{cursor}</g> : cursor}
      </MuseStage>
    </AbsoluteFill>
  );
};

export default ThatStepTakenCare;
