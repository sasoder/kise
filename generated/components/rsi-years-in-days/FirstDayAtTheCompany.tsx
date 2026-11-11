// ---------------------------------------------------------------------------
// FirstDayAtTheCompany (rsi-years-in-days, cut 27). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 302 frames.
//
// CHECK LINE: "On its first day the AI has read everything the company ever wrote and, as copies, has talked to
// every employee and client at the same time — no human new hire could."
//
// THE LINE: "Well, if you let it shadow that CEO, on its first morning, it could read every email and Slack message
// and document that the company has ever produced. | By the end of its first day, copies of it have interviewed
// every employee and major client in parallel."
// WORD -> FRAME: Well 0 · if 4 · you 8 · let 10 · it 14 · shadow 16 · that 22 · CEO 25 · on 39 · its 47 · first 50 ·
//   morning 55 · it 67 · could 73 · read 74 · every 79 · email 86 · and 96 · Slack 105 · message 110 · and 120 ·
//   document 132 · that 142 · the 151 · company 153 · has 159 · ever 162 · produced 166 · By 177 · the 179 · end 181 ·
//   of 185 · its 186 · first 189 · day 195 · copies 204 · of 218 · it 222 · have 225 · interviewed 230 · every 240 ·
//   employee 250 · and 262 · major 271 · client 276 · in 285 · parallel 291 (next line 301).
// DURATION: the slot 27.194 -> 39.790 s = 12.596 s x 23.976 = 302 frames (f0..f301), one composition over the
//   user's two disabled clips (their boundary is f178; nothing happens there).
//
// THE MOTION: the company is one vertical world (firstDayWorld.tsx): the CEO's floor in the middle with the CEO
// (white) and the orange intern, a white wall clock over them; the records wall above; the org chart hanging below.
// One camera journey: close on the pair (k 1.5) as the intern walks its last steps in and stops behind the CEO on
// "shadow"; one pull-back and rise (to k 0.5) as the clock's hands start to run (9:00 -> 5:00, one steady rate
// f40-195): an orange thread leaves the intern's head on "read" and where it touches the wall's bottom shelf a
// reading wave turns the tiles white -> orange by distance (envelopes, then Slack marks, then documents, then all
// three mixed), accelerating on one curve until it climbs out of the top of frame; a slow drift; then one smooth
// descent past the clock (5:00 on "day") down the org chart while copies of the intern's head slide out from
// behind it and ride the white connectors down at one speed, splitting at every junction. Where a copy reaches a
// seat it becomes the head of an intern copy: the body comes out of the head, top to feet (7 frames), facing a white
// person a hand's width away on one short floor, a talk link between their heads (packets out and back). Three slide
// off the first level's right edge on shallow arcs to the clients. Every link pulses on one clock and steps one tone
// brighter together on "parallel", so "in parallel" is literally simultaneous. The last frames are settled and alive.
// No fade.
// CAUSE -> EFFECT: the thread's head touches the bottom shelf at f80 -> the contact tile starts to turn on f80
//   (first visible change f81). A copy reaching a seat starts its body reveal that frame, its link draws 3 frames
//   later (level 1 f217-222, level 2 f225-236, four crowd rows,
//   in frame, by f244 / f249 / f254 / f259, clients f270 / 275 / 279).
// Orange = the AI, nothing else; white = people and what they build.
//
// SOURCES: none (no figures). Marks: OpenAI (kits/dwarkesh/brandGlyphs); Slack = Wikimedia Commons
// "Slack icon 2019.svg" (assets-src/rsi-years-in-days/slack_icon_2019.svg, redrawn in one fill); Lucide `mail` and
// `file-text`.
// The intern (AiFigure, makeWalk) and HumanFigure are the sister clip's (rsi-another-jump), imported read-only.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, Label, linkPackets, worldPx } from "../kits/dwarkesh/alignShared";
import { AiFigure, makeWalk } from "../rsi-another-jump/timelineWorld";
import { HumanFigure } from "../rsi-another-jump/jumpWorld";
import {
  CEO_X,
  CX_END,
  FLOOR_SCREEN_END,
  K_END,
  CHART_PATH,
  CLIENT_EMIT,
  CLIENT_FLOOR,
  CLIENT_RAMP,
  CLIENT_ROUTES,
  CLIENT_SEATS,
  CLIENT_V,
  CLOCK,
  CONTACT,
  Clock,
  EMIT,
  FLOOR_SW,
  FLOOR_X0,
  FLOOR_X1,
  FLOOR_Y,
  FigureDefs,
  G,
  HEAD_TOP,
  INTERN_X,
  LINE_W,
  LINK_BRIGHT,
  LINK_DELAY,
  NODES,
  PAIR_FLOORS,
  PAIR_FLOOR_SW,
  REVEAL,
  ROOT_ROUTE,
  ROUTE_S,
  S1,
  SC,
  SHELF_SW,
  SHELF_X0,
  SHELF_X1,
  Seat,
  TILES,
  TalkLink,
  TileDefs,
  TileUse,
  WAVE_W,
  clientParkFrame,
  copyDist,
  internAt,
  internAtHead,
  parkFrame,
  personAt,
  revealClipH,
  shelfY,
  smooth01,
  waveFront,
  LOC,
  MARK,
} from "./firstDayWorld";

export const FPS = 24000 / 1001;
export const DURATION = 302;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera ------------------------------------------------------------------------
// One key track in (ln k, the floor's SCREEN y, cx), each frame a sum of eased segments (overlapping, so there is
// never a hold between moves), through the kit's damper; cy is solved from the damped k and floor y, so the floor
// is placed exactly at every zoom.
const K0 = 1.5;
const S0 = 1195; // the floor's screen y at the open
const CX0 = 560;
const SEGS = [
  // the first morning: pull back and rise, the records wall comes into frame
  { f0: 0, f1: 150, warp: 1, dl: Math.log(0.5 / K0), dS: 1850 - S0, dx: 540 - CX0 },
  // a slow drift joins the rise to the descent while the wave climbs out of frame
  { f0: 136, f1: 190, warp: 1, dl: Math.log(0.49 / 0.5), dS: 25, dx: 0 },
  // the end of the first day: one descent past the clock and down the org chart, a little pull-back
  { f0: 172, f1: 268, warp: 0.75, dl: Math.log(K_END / 0.49), dS: FLOOR_SCREEN_END - 1875, dx: CX_END - 540 },
  // creep to the last frame
  { f0: 262, f1: 340, warp: 1, dl: Math.log(0.986), dS: -4, dx: 3 },
];
const CAM = (() => {
  const T: { l: number; S: number; x: number }[] = [];
  for (let f = 0; f <= DURATION; f++) {
    let l = Math.log(K0);
    let S = S0;
    let x = CX0;
    for (const sg of SEGS) {
      const u = camEase((f - sg.f0) / (sg.f1 - sg.f0), sg.warp);
      l += sg.dl * u;
      S += sg.dS * u;
      x += sg.dx * u;
    }
    T.push({ l, S, x });
  }
  const out: { k: number; cx: number; cy: number; S: number }[] = [];
  let { l, S, x } = T[0];
  let vl = 0;
  let vS = 0;
  let vx = 0;
  for (let f = 0; f <= DURATION; f++) {
    if (f > 0) {
      vl += (T[f].l - l) * CAM_STIFF - vl * CAM_DAMP;
      l += vl;
      vS += (T[f].S - S) * CAM_STIFF - vS * CAM_DAMP;
      S += vS;
      vx += (T[f].x - x) * CAM_STIFF - vx * CAM_DAMP;
      x += vx;
    }
    const k = Math.exp(l);
    out.push({ k, cx: x, cy: G - (S - 960) / k, S });
  }
  return out;
})();
export const camAt = (f: number) => CAM[Math.max(0, Math.min(DURATION, Math.round(f)))];

// --- the walk-in -----------------------------------------------------------------------
const WALK = makeWalk({ x0: 60, x1: INTERN_X, f0: -8, f1: 16, easeIn: 6, easeOut: 8, ageAt: () => 1 });

// --- the clock: 9:00 -> 5:00 at one steady rate, short ramps at each end ------------------
const CLK_F0 = 40;
const CLK_F1 = 195;
const CLK_RAMP = 6;
const hoursAt = (f: number) => {
  const T = CLK_F1 - CLK_F0;
  const t = Math.max(0, Math.min(T, f - CLK_F0));
  const V = 8 / (T - CLK_RAMP);
  const ramp = (u: number) => u * u * u - (u * u * u * u) / 2;
  let d = V * CLK_RAMP * ramp(Math.min(1, t / CLK_RAMP));
  if (t > CLK_RAMP) d += V * (Math.min(t, T - CLK_RAMP) - CLK_RAMP);
  if (t > T - CLK_RAMP) {
    const u = (t - (T - CLK_RAMP)) / CLK_RAMP;
    d += V * CLK_RAMP * (u - ramp(u));
  }
  return 9 + d;
};

// --- the reading thread -------------------------------------------------------------------
const THREAD_F0 = 72;
const THREAD_CONTACT = 80; // the head touches the bottom shelf; the contact tile turns from here
const THREAD_OUT0 = 182; // its tail lifts off the head and rises into the wall, which leaves by the top
const THREAD_OUT1 = 198;
const THREAD_W = 6;

// --- labels ------------------------------------------------------------------------------
const SMALL_LABEL = 52; // world px: ~78 px at the open, ~24 px at the end (the top of the resolved frame)
const BIG_LABEL = worldPx(48, K_END);

const FirstDayAtTheCompany: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx / k;
  const cy = cam.cy + s.dy / k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const cam0 = CAM[0];

  // what is on screen (world), for culling the wall
  const vx0 = cx - 540 / k - 120;
  const vx1 = cx + 540 / k + 120;
  const vy0 = cy - 960 / k - 120;
  const vy1 = cy + 960 / k + 120;

  // the intern
  const hipX = WALK.hipX(frame);
  const gait = WALK.gaitW(frame);
  const feet = WALK.feet(frame);
  const breathT = frame;

  // the wave
  const front = waveFront(frame - THREAD_CONTACT);
  const tiles = TILES.filter((t) => t.x > vx0 && t.x < vx1 && t.y > vy0 && t.y < vy1);
  const rows: number[] = [];
  for (let r = 0; shelfY(r) > vy0 - 200 && r < 40; r++) if (shelfY(r) < vy1) rows.push(r);

  // the thread
  const headTop = { x: HEAD_TOP.x, y: HEAD_TOP.y + 6 };
  const tp = clamp01((frame - THREAD_F0) / (THREAD_CONTACT - THREAD_F0));
  const tail = camEase((frame - THREAD_OUT0) / (THREAD_OUT1 - THREAD_OUT0), 1);
  const thread =
    tp > 0 && tail < 1 ? (
      (() => {
        const tip = { x: headTop.x + (CONTACT.x - headTop.x) * tp, y: headTop.y + (CONTACT.y - headTop.y) * tp };
        const base = { x: headTop.x + (CONTACT.x - headTop.x) * tail, y: headTop.y + (CONTACT.y - headTop.y) * tail };
        const pk =
          tp >= 1 && tail <= 0
            ? linkPackets({ frame, k, from: CONTACT, to: headTop, period: 7, speed: 34, phase: THREAD_CONTACT })
            : [];
        return (
          <g style={{ filter: iconShadow(k) }}>
            <line x1={base.x} y1={base.y} x2={tip.x} y2={tip.y} stroke={ACCENT} strokeWidth={THREAD_W} strokeLinecap="round" />
            {pk.map((q, i) => (
              <circle key={i} cx={q.x} cy={q.y} r={8} fill={ACCENT} />
            ))}
            {tp < 1 ? <circle cx={tip.x} cy={tip.y} r={10} fill={INK} /> : null}
          </g>
        );
      })()
    ) : null;

  // the copies on their way: each is the intern's head (the intern drawn once, clipped to its head)
  const moving: { x: number; y: number; s: number }[] = [];
  EMIT.forEach((e, m) => {
    const t = frame - e;
    if (t <= 0) return;
    const sd = copyDist(t);
    if (sd < ROOT_ROUTE.len) {
      const q = ROOT_ROUTE.at(sd);
      moving.push({ ...q, s: 1 });
      return;
    }
    NODES.forEach((n, i) => {
      const lv = n.seat.level;
      const R = ROUTE_S[i];
      const rideIn = m < 2 ? lv <= m : true;
      const rideRail = m < 2 ? lv < m : true;
      if (rideIn && sd >= R.s0 && sd < R.park) {
        const d = sd - R.s0;
        const q = n.inPath.at(d);
        moving.push({ ...q, s: n.sFrom + (n.seat.s - n.sFrom) * (d / n.inPath.len) });
      } else if (rideRail && n.rail && sd >= R.park && sd < R.bus) {
        moving.push({ ...n.rail.at(sd - R.park), s: n.seat.s });
      }
    });
  });
  CLIENT_ROUTES.forEach((r, i) => {
    const t = frame - CLIENT_EMIT[i];
    if (t <= 0) return;
    const sd = copyDist(t, CLIENT_V, CLIENT_RAMP);
    if (sd < r.len) moving.push({ ...r.at(sd), s: S1 + (SC - S1) * (sd / r.len) });
  });

  const inView = (q: Seat) => q.floor[1] > vx0 && q.floor[0] < vx1 && q.feetY > vy0 && q.headTop < vy1;
  const seats = [
    ...NODES.map((n, i) => ({ q: n.seat, t0: parkFrame(i) })),
    ...CLIENT_SEATS.map((q, i) => ({ q, t0: clientParkFrame(i) })),
  ].filter(({ q }) => inView(q));
  const parked = seats.filter(({ t0 }) => frame >= t0);
  // every link one tone brighter together on "parallel"
  const linkTone = LINK_BRIGHT(0.6 * smooth01((frame - 289) / 4));

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={cam0.cy}
        cx={cx}
        cxRest={cam0.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <TileDefs />
            <FigureDefs k={k} />
            <defs>
              {parked
                .filter(({ t0 }) => frame - t0 < REVEAL)
                .map(({ q, t0 }) => (
                  <clipPath key={q.id} id={`fd-rv-${q.id}`} clipPathUnits="userSpaceOnUse">
                    <rect
                      x={-200}
                      y={LOC.markTop - MARK * 0.1}
                      width={400}
                      height={revealClipH((frame - t0) / REVEAL)}
                    />
                  </clipPath>
                ))}
            </defs>
            {/* the records wall: shelves, then the tiles, the reading wave by distance from the contact */}
            <g opacity={0.5}>
              {rows.map((r) => (
                <line
                  key={r}
                  x1={SHELF_X0}
                  x2={SHELF_X1}
                  y1={shelfY(r)}
                  y2={shelfY(r)}
                  stroke={INK}
                  strokeWidth={SHELF_SW}
                />
              ))}
            </g>
            <g style={{ filter: iconShadow(k) }}>
              {tiles.map((t, i) => (
                <TileUse key={i} t={t} tone={clamp01((front - t.reach) / WAVE_W)} />
              ))}
            </g>
            {thread}
            {/* the floors and the org chart's connectors */}
            <g style={{ filter: iconShadow(k) }}>
              <line
                x1={FLOOR_X0}
                x2={FLOOR_X1}
                y1={FLOOR_Y}
                y2={FLOOR_Y}
                stroke={INK}
                strokeWidth={FLOOR_SW}
                strokeLinecap="round"
              />
              <line
                x1={CLIENT_FLOOR.x0}
                x2={CLIENT_FLOOR.x1}
                y1={CLIENT_FLOOR.y + FLOOR_SW / 2}
                y2={CLIENT_FLOOR.y + FLOOR_SW / 2}
                stroke={INK}
                strokeWidth={FLOOR_SW}
                strokeLinecap="round"
              />
              <path d={CHART_PATH} stroke={INK} strokeOpacity={0.8} strokeWidth={LINE_W} fill="none" strokeLinecap="round" />
              <path d={PAIR_FLOORS} stroke={INK} strokeWidth={PAIR_FLOOR_SW} fill="none" strokeLinecap="round" />
            </g>
            <Clock k={k} hours={hoursAt(frame)} />
            {/* copies on their way: under the intern (they slide out from behind its head) and under the seated copies */}
            {moving.map((q, i) => (
              <use key={i} href="#fd-intern" transform={internAtHead(q.x, q.y, q.s)} clipPath="url(#fd-headclip)" />
            ))}
            <AiFigure id="ai" k={k} x={hipX} age={1} feet={feet} gait={gait} breathT={breathT} />
            <HumanFigure k={k} x={CEO_X} breathT={frame + 31} />
            {/* the company's people, facing left */}
            <g style={{ filter: iconShadow(k) }}>
              {seats.map(({ q }) => (
                <use key={q.id} href="#fd-person" transform={personAt(q)} />
              ))}
            </g>
            {/* the seated copies: the body comes out of the head, top to feet */}
            {parked.map(({ q, t0 }) => (
              <use
                key={q.id}
                href="#fd-intern"
                transform={internAt(q)}
                clipPath={frame - t0 < REVEAL ? `url(#fd-rv-${q.id})` : undefined}
              />
            ))}
            {/* talk links, every one on the same clock */}
            <g style={{ filter: iconShadow(k) }}>
              {parked.map(({ q, t0 }) => (
                <TalkLink key={q.id} frame={frame} k={k} from={q.linkFrom} to={q.linkTo} t0={t0 + LINK_DELAY} tone={linkTone} />
              ))}
            </g>
          </svg>
          <Label k={k} x={CLOCK.x + CLOCK.r + 34} y={CLOCK.y - SMALL_LABEL / 2} text="DAY 1" inT={1} size={SMALL_LABEL} align="left" />
          <Label k={k} x={CEO_X + 72} y={G - 478} text="CEO" f0={20} frame={frame} size={SMALL_LABEL} align="left" />
          <Label
            k={k}
            x={(CLIENT_FLOOR.x0 + CLIENT_FLOOR.x1) / 2}
            y={Math.min(...CLIENT_SEATS.map((q) => q.headTop)) - 40 - BIG_LABEL}
            text="CLIENTS"
            f0={264}
            frame={frame}
            size={BIG_LABEL}
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default FirstDayAtTheCompany;
