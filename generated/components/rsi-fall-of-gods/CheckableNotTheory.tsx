// ---------------------------------------------------------------------------
// CheckableNotTheory (rsi-fall-of-gods, cut 34). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 140 frames.
//
// CHECK LINE: "AI swarms over the maths that can be checked — ticking claims and knocking one down with a
// counterexample — while the space for a new theory stays empty."
//
// THE LINE: "[Now, it's true that progress has skewed disproportionately towards] the verification-laden parts of
// mathematics, like finding counter-examples, rather than, say, coming up with new theories."
// WORD -> FRAME (Whisper 2-7 f early): the 4 · verification-laden 10 · parts 34 · of 39 · mathematics 43 · Like 57 ·
// finding 62 · counter-examples 69 · Rather 89 · than 97 · say 106 · coming 116 · up 122 · with 127 · new 129 ·
// theories 132 (then the speaker: "Toby Ord recently wrote ...").
// DURATION: the slot 34.743 -> 40.582 s = 5.839 s x 23.976 = 140 frames (f0..f139).
//
// THE MOTION: one field of small white claim cards (an outline squircle with two or three formula bars), orange
// agent dots working through it. Every card an agent touches converts: its edge turns orange from the contact
// point both ways round (lit, settling to the deep tone) and a small white tick is drawn — a Wave climbing the
// field from below, ordered by distance from a source under the frame plus a hash jitter, each card's conversion
// frame being the frame an agent reaches it (an event simulation at module scope; nothing runs on a timer).
// On "Like finding counter-examples" one agent comes up from the front onto the big hero claim near the centre
// and slashes a big orange X across it with its own body as the drawing tip (the ends of the X sit on the card's
// bottom and top edges): CONTACT f47 (lower-left end), stroke 1 up-right f47-53, hop left along the top f53-57,
// stroke 2 down-right f57-62 (lands on "finding", ahead of "counter-examples" f69), where the agent pushes off
// downward. FIRST REACTION f63: the card is knocked out of its seat (tilts 9 deg about its lower-right corner,
// left side down, drops 16, Easing.out cubic, settled f77) and dims to context.
// REV 2 (user: "zoom into the new theorem a little as he's saying 'rather than' ... speed up the camera for the
// first part so the theorem is visible"): right after the X the camera rises fast (one damped move, keys
// f58-80, k 1.25 -> 0.98, peak ~54 screen px/f at f71, settled ~f86) past the climbing front to the field's
// feathered top edge and the empty DASHED slot above it — a big dashed squircle with a dashed Lucide lightbulb,
// dashes marching — whole on screen by f84 (y ~445-790). From "Rather" (f89) a slow continuous push into the
// slot: k 0.98 -> ~1.29 (x1.31), the slot easing down to centre ~y 820 and still moving on f139, the ticked
// field falling away at the bottom. No agent ever goes up there.
// Orange = the AI, nothing else; white = people and what they build; dashed = not real yet.
//
// SOURCES: no figures. Icons: Lucide `lightbulb` (glass + two base lines) and `check`, ISC, inlined on the 24 grid
// (the lightbulb's geometry matches generated/components/sam-macintosh-moment/timelinePath.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, INK_LO, worldPx } from "../kits/dwarkesh/alignShared";

export const FPS = 24000 / 1001;
export const DURATION = 140;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P = { x: number; y: number };

// ---------------------------------------------------------------------------
// SCALE. Strokes are sized for K_REST, between the opening (1.25), the reveal
// (0.98) and the end of the push (1.32), so the one weight reads ~5-8 screen px.
// ---------------------------------------------------------------------------
const K0 = 1.25; // inside the field, on the hero
const K_MID = 0.98; // the reveal: the slot whole in frame, f84
const K_END = 1.32; // the push into the slot, still drifting at f139
const K_REST = 1.2;
const STROKE = worldPx(6, K_REST);
const THREAD = STROKE / 2;
const DASH_ON = worldPx(26, K_REST);
const DASH_OFF = worldPx(18, K_REST);
const MARCH = worldPx(0.6, K_REST);
const AGENT_R = DOT_RADIUS * 1.5; // local multiplier: the dots have to hold their own against 100 px cards

// ---------------------------------------------------------------------------
// THE WORLD. TOP is the field's nominal top edge (world y). The hero claim sits
// 760 world px below it, near the centre; the slot sits FIELD_GAP above it.
// ---------------------------------------------------------------------------
const TOP = 520;
const HERO = { x: 540, y: TOP + 760, w: 196, h: 126 };
const FIELD_GAP = 120;
const SLOT_W = 650;
const SLOT_H = 348;
const SLOT = { x: 540, y: TOP - FIELD_GAP - SLOT_H / 2, w: SLOT_W, h: SLOT_H };

// The camera, as content.
//   f0        k 1.25, the hero at screen y 840 (a slow creep up from f0, so nothing is ever held)
//   f58-80    THE RISE: keys on a warped smoothstep to k 0.98 with the slot's centre at screen y 640 —
//             the slot whole on screen (y ~470-810) and the field's top edge under it at ~930; the damper
//             settles it by ~f86, just before "Rather" (f89)
//   f84-139   THE PUSH: k 0.98 -> 1.32 with the slot's centre easing down to screen y 840. The ease is a
//             smoothstep over f84-f164 read only to f139 (normalised there), so the camera is still
//             moving on the last frame. The slot ends 858 x 460 screen px, its bottom edge at ~1070,
//             clear of the caption band at 1080.
const OPEN_HERO_SY = 840;
const CY0 = HERO.y - (OPEN_HERO_SY - 960) / K0;
const MID_SLOT_SY = 640;
const END_SLOT_SY = 840;
const cyForSlot = (slotSy: number, k: number) => SLOT.y - (slotSy - 960) / k;
const CY_MID = cyForSlot(MID_SLOT_SY, K_MID);
const CREEP = 0.5;
const RISE_F0 = 58;
const RISE_F1 = 80;
const RISE_WARP = 0.85;
const PUSH_F0 = 84;
const PUSH_VIRTUAL_END = 164;
const PUSH_NORM = smoothstep((DURATION - 1 - PUSH_F0) / (PUSH_VIRTUAL_END - PUSH_F0));
const CAM_F: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  CAM_F.push(f);
  if (f < PUSH_F0) {
    const g = camEase((f - RISE_F0) / (RISE_F1 - RISE_F0), RISE_WARP);
    CAM_K.push(K0 + (K_MID - K0) * g);
    CAM_CY.push(CY0 - CREEP * Math.min(f, RISE_F0) + (CY_MID - (CY0 - CREEP * RISE_F0)) * g);
  } else {
    const g = smoothstep((f - PUSH_F0) / (PUSH_VIRTUAL_END - PUSH_F0)) / PUSH_NORM;
    const k = K_MID + (K_END - K_MID) * g;
    CAM_K.push(k);
    CAM_CY.push(cyForSlot(MID_SLOT_SY + (END_SLOT_SY - MID_SLOT_SY) * g, k));
  }
}
export const camAt = (frame: number) => runCamera(frame, CAM_F, CAM_CY, CAM_K);

// ---------------------------------------------------------------------------
// THE FIELD. Claim cards on a hashed, row-offset grid, jittered and then relaxed
// apart (never a lattice, never touching). The top edge undulates (wobble) and
// feathers: over FEATHER_ROWS rows inward a card only exists if its hash falls
// under `feather`, and what survives is drawn smaller. Sides and bottom bleed
// off frame at every camera. A cleared pocket fitted to the hero (and to its
// fall) holds it.
// ---------------------------------------------------------------------------
const STEP_X = 150;
const STEP_Y = 116;
const X0 = -110;
const X1 = 1190;
const Y_BOTTOM = TOP + 1820;
const FEATHER_ROWS = 2.0;
const EDGE_SEED = 1.7;
const CARD_GAP = 30;
const topEdgeAt = (x: number) => TOP + wobble(x, EDGE_SEED) * STEP_Y * 0.35;

type Card = {
  x: number;
  y: number;
  w: number;
  h: number;
  bars: { x: number; y: number; w: number }[];
  path: string;
  hero: boolean;
};

const BAR_H_FRAC = 0.1;
const makeCard = (i: number, x: number, y: number, w: number, h: number, hero: boolean): Card => {
  const nb = hero ? 3 : hash(i, 31) < 0.45 ? 2 : 3;
  const bars: { x: number; y: number; w: number }[] = [];
  for (let b = 0; b < nb; b++) {
    const fy = (b + 1) / (nb + 1);
    const maxW = hero ? 0.78 : 0.5;
    const minW = hero ? 0.38 : 0.24;
    bars.push({
      x: w * (hero ? 0.11 : 0.13),
      y: h * (0.5 + (fy - 0.5) * (nb === 3 ? 0.98 : 0.8)),
      w: w * (minW + (maxW - minW) * hash(i * 7 + b, 32)),
    });
  }
  return { x, y, w, h, bars, path: squirclePath(w, h), hero };
};

const CARDS: Card[] = (() => {
  type Raw = { x: number; y: number; w: number; h: number; i: number };
  const raw: Raw[] = [];
  const rows = Math.ceil((Y_BOTTOM - (TOP - 2 * STEP_Y)) / STEP_Y) + 1;
  const cols = Math.ceil((X1 - X0) / STEP_X) + 1;
  const pocket = {
    x0: HERO.x - HERO.w / 2 - 40,
    x1: HERO.x + HERO.w / 2 + 44,
    y0: HERO.y - HERO.h / 2 - 34,
    y1: HERO.y + HERO.h / 2 + 70,
  };
  for (let gr = 0; gr < rows; gr++) {
    for (let gc = 0; gc < cols; gc++) {
      const i = gr * cols + gc;
      const x = X0 + gc * STEP_X + (gr % 2) * (STEP_X / 2) + (hash(i, 11) - 0.5) * STEP_X * 0.6;
      const y = TOP - 2 * STEP_Y + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.8;
      const fe = feather((y - topEdgeAt(x)) / STEP_Y, FEATHER_ROWS);
      if (hash(i, 71) >= fe) continue;
      const w = (74 + 24 * hash(i, 13)) * (0.68 + 0.32 * fe);
      const h = w * 0.64;
      if (
        x + w / 2 > pocket.x0 &&
        x - w / 2 < pocket.x1 &&
        y + h / 2 > pocket.y0 &&
        y - h / 2 < pocket.y1
      )
        continue;
      raw.push({ x, y, w, h, i });
    }
  }
  // Relax: push overlapping (gap-inflated) rects apart along their shallower
  // axis. The hero is a fixed obstacle with its pocket.
  const heroR = {
    x: (pocket.x0 + pocket.x1) / 2,
    y: (pocket.y0 + pocket.y1) / 2,
    w: pocket.x1 - pocket.x0,
    h: pocket.y1 - pocket.y0,
  };
  for (let it = 0; it < 40; it++) {
    for (let a = 0; a < raw.length; a++) {
      for (let b = a + 1; b < raw.length; b++) {
        const A = raw[a];
        const B = raw[b];
        const ox = (A.w + B.w) / 2 + CARD_GAP - Math.abs(A.x - B.x);
        const oy = (A.h + B.h) / 2 + CARD_GAP - Math.abs(A.y - B.y);
        if (ox <= 0 || oy <= 0) continue;
        if (ox / (A.w + B.w) < oy / (A.h + B.h)) {
          const s = (A.x < B.x ? -1 : 1) * ox * 0.5;
          A.x += s;
          B.x -= s;
        } else {
          const s = (A.y < B.y ? -1 : 1) * oy * 0.5;
          A.y += s;
          B.y -= s;
        }
      }
      const A = raw[a];
      const ox = (A.w + heroR.w) / 2 - Math.abs(A.x - heroR.x);
      const oy = (A.h + heroR.h) / 2 - Math.abs(A.y - heroR.y);
      if (ox > 0 && oy > 0) {
        if (ox / (A.w + heroR.w) < oy / (A.h + heroR.h)) A.x += (A.x < heroR.x ? -1 : 1) * ox;
        else A.y += (A.y < heroR.y ? -1 : 1) * oy;
      }
    }
  }
  // Rev 2 edge pass: the two lone feather cards at the far left of the top edge sat half on the frame's left edge
  // through the push (f84-f123). They move out past it, so nothing hangs on the edge.
  for (const [n, x] of [
    [0, -195],
    [1, -95],
  ] as const) {
    raw[n].x = x;
  }
  const out = raw.map((r) => makeCard(r.i, r.x, r.y, r.w, r.h, false));
  out.push(makeCard(9999, HERO.x, HERO.y, HERO.w, HERO.h, true));
  return out;
})();
const NCARD = CARDS.length;
const HERO_I = NCARD - 1;

// ---------------------------------------------------------------------------
// THE WAVE. Each card's scheduled frame comes from its distance to a source far
// below the frame (so the front is a shallow arc climbing the field), mapped so
// the front sits at screen ~1300 on f0, passes the hero row ~f42 and reaches
// the top edge ~f82, plus a hash jitter. Agents chase that schedule; a card's
// conversion frame is the frame an agent actually reaches it.
// ---------------------------------------------------------------------------
const SOURCE: P = { x: 640, y: HERO.y + 1150 };
const D_HERO = Math.hypot(HERO.x - SOURCE.x, HERO.y - SOURCE.y);
const D_F0 = D_HERO - (1300 - OPEN_HERO_SY) / K0;
const D_TOP = SOURCE.y - TOP;
const waveTime = (c: Card) =>
  interpolate(Math.hypot(c.x - SOURCE.x, c.y - SOURCE.y), [D_F0, D_HERO, D_TOP], [0, 42, 82], {
    extrapolateLeft: "extend",
    extrapolateRight: "extend",
  }) +
  (hash(c.x * 0.37 + c.y, 41) - 0.5) * 12;
const WAVE = CARDS.map(waveTime);

// ---------------------------------------------------------------------------
// THE AGENTS. An event simulation, run once: an agent that is free picks the
// unclaimed card with the earliest schedule within reach and look-ahead, flies
// to its edge and sits there while the card converts. With nothing due near
// it, it revisits a neighbouring card (so the ticked field keeps its workers).
// Agent HERO_AGENT is routed so it lands on the hero's X at exactly HERO_CONTACT.
// ---------------------------------------------------------------------------
const NA = 100;
const SIM_START = -44;
const LOOKAHEAD = 18;
const REACH = 470;
const HERO_CONTACT = 47;
const X_HALF = { x: HERO.h / 2, y: HERO.h / 2 }; // edge to edge: the claim is crossed out top to bottom
// The X, drawn by the agent's own body: it comes up from the front below and lands on the card's bottom edge
// (the lower-left end), slashes up to the top edge, hops left along the top, slashes down to the bottom edge and
// leaves downward from there, so it never wanders over the card.
const X_PTS = {
  a1: { x: HERO.x - X_HALF.x, y: HERO.y + X_HALF.y },
  b1: { x: HERO.x + X_HALF.x, y: HERO.y - X_HALF.y },
  a2: { x: HERO.x - X_HALF.x, y: HERO.y - X_HALF.y },
  b2: { x: HERO.x + X_HALF.x, y: HERO.y + X_HALF.y },
};
const X_S1 = [HERO_CONTACT, HERO_CONTACT + 6]; // stroke 1
const X_HOP = [HERO_CONTACT + 6, HERO_CONTACT + 10];
const X_S2 = [HERO_CONTACT + 10, HERO_CONTACT + 15]; // stroke 2 lands f67
const FALL_F0 = HERO_CONTACT + 16; // f68: first reaction
const FALL_LEN = 14;

const CONV_T = 7; // frames for an edge to convert, both ways round from the contact

const travelFrames = (d: number) => Math.max(5, Math.min(22, Math.round(d / 15)));

type Stop = {
  card: number; // -1 = the X script
  x: number;
  y: number;
  arrive: number;
  depart: number;
  bow: number;
};

/** The point on a card's edge facing `p`, kept off the corners. */
const contactOn = (c: Card, p: P): P => {
  const dx = (p.x - c.x) / c.w;
  const dy = (p.y - c.y) / c.h;
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: c.x + (dx < 0 ? -1 : 1) * (c.w / 2),
      y: Math.max(c.y - c.h * 0.25, Math.min(c.y + c.h * 0.25, p.y)),
    };
  }
  return {
    x: Math.max(c.x - c.w * 0.3, Math.min(c.x + c.w * 0.3, p.x)),
    y: c.y + (dy < 0 ? -1 : 1) * (c.h / 2),
  };
};

/** Where on the outline (fraction of squirclePath's length, which starts near
 *  the top-right corner and runs clockwise) a contact point sits. */
const perimFrac = (c: Card, q: P) => {
  const lx = q.x - (c.x - c.w / 2);
  const ly = q.y - (c.y - c.h / 2);
  const { w, h } = c;
  let s: number;
  const e = 0.5;
  if (ly <= e) s = lx;
  else if (lx >= w - e) s = w + ly;
  else if (ly >= h - e) s = w + h + (w - lx);
  else s = 2 * w + h + (h - ly);
  const per = 2 * (w + h);
  const r = Math.min(Math.min(w, h) / 2, Math.max(0.012 * Math.min(w, h), 2));
  const p0 = w - 1.6 * r;
  return ((((s - p0) % per) + per) % per) / per;
};

/** Whether a (bowed) flight from p to q would pass over the hero card (inflated for its fall): nobody but the
 *  agent with the X ever crosses it. */
const HERO_KEEP = {
  x0: HERO.x - HERO.w / 2 - 22,
  x1: HERO.x + HERO.w / 2 + 22,
  y0: HERO.y - HERO.h / 2 - 22,
  y1: HERO.y + HERO.h / 2 + 52,
};
const crossesHero = (p: P, q: P, bow: number) => {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  for (let i = 1; i < 12; i++) {
    const u = i / 12;
    const b = Math.sin(Math.PI * u) * bow;
    const x = p.x + dx * u - dy * b;
    const y = p.y + dy * u + dx * b;
    if (x > HERO_KEEP.x0 && x < HERO_KEEP.x1 && y > HERO_KEEP.y0 && y < HERO_KEEP.y1) return true;
  }
  return false;
};

const SIM = (() => {
  const checkAt = new Float64Array(NCARD).fill(Infinity);
  const contactS = new Float64Array(NCARD).fill(0);
  const claimed = new Uint8Array(NCARD);
  claimed[HERO_I] = 1;
  for (let c = 0; c < NCARD; c++) {
    if (c !== HERO_I && WAVE[c] < SIM_START) {
      checkAt[c] = -1000;
      claimed[c] = 1;
    }
  }
  // starting seats: cards in the band just behind the front at SIM_START
  const startPool = CARDS.map((c, i) => i).filter(
    (i) => i !== HERO_I && WAVE[i] < SIM_START + 6 && WAVE[i] > SIM_START - 70,
  );
  const stops: Stop[][] = [];
  const free: number[] = [];
  const pos: P[] = [];
  for (let a = 0; a < NA; a++) {
    const ci = startPool[Math.floor(hash(a, 51) * startPool.length)];
    const c = CARDS[ci];
    const q = contactOn(c, { x: c.x + (hash(a, 52) - 0.5) * 300, y: c.y + (hash(a, 53) - 0.5) * 300 });
    const t = SIM_START + Math.floor(hash(a, 54) * 14);
    stops.push([{ card: ci, x: q.x, y: q.y, arrive: SIM_START - 100, depart: t, bow: 0 }]);
    free.push(t);
    pos.push(q);
  }
  // the agent that will slash the hero: the one starting nearest under it
  let HA = 0;
  let best = Infinity;
  for (let a = 0; a < NA; a++) {
    const d = Math.hypot(pos[a].x - HERO.x, pos[a].y - HERO.y);
    if (d < best) {
      best = d;
      HA = a;
    }
  }
  let heroDone = false;
  // the hero agent's first move after the X goes down and right, away from the card's dropping left side
  let postHero = false;
  const lastCard = stops.map((s) => s[0].card);
  // a revisit avoids a card another agent is sitting on, so the workers never pile up on one card
  const busyUntil = new Float64Array(NCARD).fill(-Infinity);

  for (let guard = 0; guard < 20000; guard++) {
    let a = -1;
    let t = Infinity;
    for (let i = 0; i < NA; i++) {
      if (free[i] < t) {
        t = free[i];
        a = i;
      }
    }
    if (t > DURATION + 30) break;
    const p = pos[a];
    const bow = (hash(a * 97 + guard, 55) - 0.5) * 0.35;

    // the hero agent: go when the X can no longer wait
    if (a === HA && !heroDone) {
      const dH = Math.hypot(X_PTS.a1.x - p.x, X_PTS.a1.y - p.y);
      const trH = travelFrames(dH);
      if (t + trH + 22 >= HERO_CONTACT) {
        const travel = Math.min(Math.max(trH, HERO_CONTACT - t), 30);
        const depart = HERO_CONTACT - travel;
        stops[a][stops[a].length - 1].depart = Math.max(stops[a][stops[a].length - 1].depart, depart);
        stops[a].push({ card: -1, x: X_PTS.a1.x, y: X_PTS.a1.y, arrive: HERO_CONTACT, depart: X_S2[1], bow });
        pos[a] = X_PTS.b2;
        free[a] = X_S2[1];
        heroDone = true;
        postHero = true;
        continue;
      }
    }

    // the earliest-due unclaimed card in reach
    let pick = -1;
    let pickScore = Infinity;
    for (let c = 0; c < NCARD; c++) {
      if (claimed[c]) continue;
      if (WAVE[c] > t + LOOKAHEAD) continue;
      const C = CARDS[c];
      if (a === HA && postHero && (C.y < HERO.y + HERO.h || C.x < HERO.x + 60)) continue;
      const d = Math.hypot(C.x - p.x, C.y - p.y);
      if (d > REACH) continue;
      if (!(a === HA && postHero) && crossesHero(p, contactOn(C, p), bow)) continue;
      const score = WAVE[c] + d * 0.06;
      if (score < pickScore) {
        pickScore = score;
        pick = c;
      }
    }
    if (a === HA && !heroDone && pick >= 0) {
      const C = CARDS[pick];
      const tr = travelFrames(Math.hypot(C.x - p.x, C.y - p.y));
      const back = travelFrames(Math.hypot(X_PTS.a1.x - C.x, X_PTS.a1.y - C.y));
      if (t + tr + 7 + back > HERO_CONTACT) pick = -1;
    }
    if (pick >= 0) {
      const C = CARDS[pick];
      const q = contactOn(C, p);
      const arrive = t + travelFrames(Math.hypot(q.x - p.x, q.y - p.y));
      const dwell = 6 + Math.floor(hash(pick, 56) * 3);
      claimed[pick] = 1;
      busyUntil[pick] = arrive + dwell;
      checkAt[pick] = arrive;
      contactS[pick] = perimFrac(C, q);
      stops[a].push({ card: pick, x: q.x, y: q.y, arrive, depart: arrive + dwell, bow });
      pos[a] = q;
      free[a] = arrive + dwell;
      lastCard[a] = pick;
      if (a === HA) postHero = false;
      continue;
    }

    // nothing due here: revisit a neighbouring card that is not the hero
    const near: number[] = [];
    for (let c = 0; c < NCARD; c++) {
      if (c === HERO_I || c === lastCard[a]) continue;
      // only a card that is already converted: touching a fresh one would be a cause with no effect
      if (checkAt[c] + CONV_T > t + 6) continue;
      if (busyUntil[c] > t + 2 && !(a === HA && postHero)) continue;
      const C = CARDS[c];
      if (a === HA && postHero && (C.y < HERO.y + HERO.h || C.x < HERO.x + 60)) continue;
      if (Math.hypot(C.x - p.x, C.y - p.y) >= STEP_X * (a === HA && postHero ? 3 : 1.7)) continue;
      if (!(a === HA && postHero) && crossesHero(p, contactOn(C, p), bow)) continue;
      near.push(c);
    }
    if (near.length === 0) {
      free[a] = t + 6;
      stops[a][stops[a].length - 1].depart = free[a];
      continue;
    }
    // most of the time the neighbour nearest the front (the swarm keeps up with the wave), sometimes any
    // neighbour (so the ticked field behind it keeps some workers)
    const c =
      hash(a * 131 + guard, 59) < 0.8
        ? near.reduce((m, x) => (WAVE[x] > WAVE[m] ? x : m), near[0])
        : near[Math.floor(hash(a * 131 + guard, 57) * near.length)];
    const C = CARDS[c];
    const q = contactOn(C, p);
    const arrive = t + travelFrames(Math.hypot(q.x - p.x, q.y - p.y));
    const dwell = 2 + Math.floor(hash(c + guard, 58) * 3);
    stops[a].push({ card: c, x: q.x, y: q.y, arrive, depart: arrive + dwell, bow });
    busyUntil[c] = arrive + dwell;
    if (a === HA) postHero = false;
    pos[a] = q;
    free[a] = arrive + dwell;
    lastCard[a] = c;
  }
  return { checkAt, contactS, stops, HA };
})();

// ---------------------------------------------------------------------------
// Per-frame helpers.
// ---------------------------------------------------------------------------
const xStroke = (frame: number, span: number[]) => clamp01((frame - span[0]) / (span[1] - span[0]));
const xEase = (u: number) => Easing.inOut(Easing.quad)(u);

/** The hero agent's tip while it draws the X (world: the card has not started to fall yet). */
const xTip = (frame: number): P => {
  if (frame <= X_S1[1]) {
    const u = xEase(xStroke(frame, X_S1));
    return { x: X_PTS.a1.x + (X_PTS.b1.x - X_PTS.a1.x) * u, y: X_PTS.a1.y + (X_PTS.b1.y - X_PTS.a1.y) * u };
  }
  if (frame <= X_HOP[1]) {
    const u = xEase(xStroke(frame, X_HOP));
    const bow = Math.sin(Math.PI * u) * 14; // a small hop up, off the card's top line
    return { x: X_PTS.b1.x + (X_PTS.a2.x - X_PTS.b1.x) * u, y: X_PTS.b1.y + (X_PTS.a2.y - X_PTS.b1.y) * u - bow };
  }
  const u = xEase(xStroke(frame, X_S2));
  return { x: X_PTS.a2.x + (X_PTS.b2.x - X_PTS.a2.x) * u, y: X_PTS.a2.y + (X_PTS.b2.y - X_PTS.a2.y) * u };
};

const agentAt = (a: number, frame: number): P => {
  const st = SIM.stops[a];
  for (let i = st.length - 1; i >= 0; i--) {
    const s = st[i];
    if (frame >= s.arrive) {
      if (s.card === -1 && frame <= s.depart) return xTip(frame);
      if (frame <= s.depart || i === st.length - 1) return s.card === -1 ? X_PTS.b2 : { x: s.x, y: s.y };
      const n = st[i + 1];
      const from = s.card === -1 ? X_PTS.b2 : s;
      const lin = clamp01((frame - s.depart) / (n.arrive - s.depart));
      // leaving the X it pushes off at once (ease-out), so the falling card never catches it
      const u = s.card === -1 ? Easing.out(Easing.cubic)(lin) : smoothstep(lin);
      const dx = n.x - from.x;
      const dy = n.y - from.y;
      const bow = Math.sin(Math.PI * u) * n.bow;
      return { x: from.x + dx * u - dy * bow, y: from.y + dy * u + dx * bow };
    }
  }
  return { x: st[0].x, y: st[0].y };
};

// The hero's knock: tilts about its lower-left corner and drops.
const FALL_ANGLE = -9; // about the lower-RIGHT corner, where the agent pushed off: the left side drops
const FALL_DROP = 16;
const fallAt = (frame: number) =>
  interpolate(frame, [FALL_F0, FALL_F0 + FALL_LEN], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

const TICK_T = 5; // frames for the tick to be drawn

// Lucide `check`, drawn from the short arm: M4 12 l5 5 L20 6, on the 24 grid.
const tickPath = (c: Card) => {
  const s = (c.w * 0.27) / 16;
  const cx = c.w * 0.79;
  const cy = c.h * 0.5;
  const pt = (x: number, y: number) => `${(cx + (x - 12) * s).toFixed(2)} ${(cy + (y - 11.5) * s).toFixed(2)}`;
  return `M${pt(4, 12)} L${pt(9, 17)} L${pt(20, 6)}`;
};
const TICKS = CARDS.map(tickPath);

// Lucide `lightbulb`.
const BULB_GLASS =
  "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5";
const BULB_BASE = ["M9 18h6", "M10 22h4"];
const BULB_BOX = SLOT.h * 0.92; // ink is 20/24 of the box: ~0.67 of the slot's height

const IDLE_N = idleThreads(NA);
// A converted edge lands in the lit tone and settles to the deep one: the AI was here. The agents themselves stay
// the brightest orange in frame, so they still read where they sit on an edge.
const EDGE_TONE = makeTone(ACCENT_DEEP, ACCENT);
const EDGE_SETTLE0 = 10;
const EDGE_SETTLE = 26;

const CheckableNotTheory: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cy, k } = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const s = sway(frame);
  const { tx, ty } = worldTransform(540, cy, k);
  const icon = iconShadow(k);

  const agents = Array.from({ length: NA }, (_, a) => agentAt(a, frame));

  // idle traffic between agents near each other
  const idle: { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number }[] = [];
  for (let j = 0; j < IDLE_N; j++) {
    const period = 40 - 10 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const a = Math.floor(hash(j * 131 + cycle * 7, 6) * NA);
    let b = -1;
    let bd = Infinity;
    for (let o = 0; o < NA; o++) {
      if (o === a) continue;
      const d = Math.hypot(agents[o].x - agents[a].x, agents[o].y - agents[a].y);
      if (d < bd && d > 60) {
        bd = d;
        b = o;
      }
    }
    if (b < 0 || bd > 320) continue;
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    const A = agents[a];
    const B = agents[b];
    idle.push({
      key: `i${j}`,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * dn,
      y2: A.y + (B.y - A.y) * dn,
      op: 0.35 * fade,
      head: dn,
    });
  }

  // the hero
  const fall = fallAt(frame);
  const heroDim = interpolate(frame, [FALL_F0, FALL_F0 + FALL_LEN], [INK_HI, INK_LO], clamp);
  const hc = CARDS[HERO_I];
  const heroT = `translate(${(hc.x - hc.w / 2).toFixed(3)} ${(hc.y - hc.h / 2 + FALL_DROP * fall).toFixed(
    3,
  )}) rotate(${(FALL_ANGLE * fall).toFixed(4)} ${hc.w} ${hc.h})`;
  const s1 = xEase(xStroke(frame, X_S1));
  const s2 = xEase(xStroke(frame, X_S2));
  const loc = (p: P) => ({ x: p.x - (hc.x - hc.w / 2), y: p.y - (hc.y - hc.h / 2) });
  const a1 = loc(X_PTS.a1);
  const b1 = loc(X_PTS.b1);
  const a2 = loc(X_PTS.a2);
  const b2 = loc(X_PTS.b2);

  const march = -frame * MARCH;
  const bulbS = BULB_BOX / 24;

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
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
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* the empty slot: a dashed squircle with a dashed lightbulb, dashes marching */}
            <g style={{ filter: icon }}>
              <path
                d={squirclePath(SLOT.w, SLOT.h)}
                transform={`translate(${(SLOT.x - SLOT.w / 2).toFixed(3)} ${(SLOT.y - SLOT.h / 2).toFixed(3)})`}
                fill="none"
                stroke={INK}
                strokeWidth={STROKE}
                strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                strokeDashoffset={march}
                opacity={INK_HI}
              />
              <g
                transform={`translate(${(SLOT.x - BULB_BOX / 2).toFixed(3)} ${(SLOT.y - BULB_BOX / 2).toFixed(
                  3,
                )}) scale(${bulbS.toFixed(5)})`}
                fill="none"
                stroke={INK}
                strokeWidth={STROKE / bulbS}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d={BULB_GLASS}
                  strokeLinecap="butt"
                  strokeDasharray={`${(DASH_ON * 0.75) / bulbS} ${(DASH_OFF * 0.75) / bulbS}`}
                  strokeDashoffset={march / bulbS}
                />
                {BULB_BASE.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
            </g>

            {/* the field */}
            {CARDS.map((c, i) => {
              if (c.hero) return null;
              const at = SIM.checkAt[i];
              const conv = at === Infinity ? 0 : Easing.out(Easing.quad)(clamp01((frame - at) / CONV_T));
              const tick = at === Infinity ? 0 : clamp01((frame - at - 1) / TICK_T);
              const half = conv / 2;
              const s0 = SIM.contactS[i];
              return (
                <g
                  key={i}
                  transform={`translate(${(c.x - c.w / 2).toFixed(3)} ${(c.y - c.h / 2).toFixed(3)})`}
                  style={{ filter: icon }}
                >
                  {conv < 1 ? (
                    <path d={c.path} fill="none" stroke={INK} strokeWidth={STROKE} opacity={0.9} />
                  ) : null}
                  {c.bars.map((b, bi) => (
                    <path
                      key={bi}
                      d={squirclePath(b.w, c.h * BAR_H_FRAC)}
                      transform={`translate(${b.x.toFixed(2)} ${(b.y - (c.h * BAR_H_FRAC) / 2).toFixed(2)})`}
                      fill={INK}
                      opacity={INK_LO}
                    />
                  ))}
                  {conv > 0 ? (
                    <path
                      d={c.path}
                      pathLength={1}
                      fill="none"
                      stroke={EDGE_TONE(1 - smoothstep((frame - at - EDGE_SETTLE0) / EDGE_SETTLE))}
                      strokeWidth={STROKE}
                      strokeDasharray={conv >= 1 ? undefined : `${(2 * half).toFixed(4)} ${(1 - 2 * half).toFixed(4)}`}
                      strokeDashoffset={conv >= 1 ? undefined : (-(s0 - half)).toFixed(4)}
                    />
                  ) : null}
                  {tick > 0 ? (
                    <path
                      d={TICKS[i]}
                      pathLength={1}
                      fill="none"
                      stroke={INK}
                      strokeWidth={STROKE * 0.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={tick >= 1 ? undefined : `${tick.toFixed(4)} 1`}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* the hero claim, and the X across it */}
            <g transform={heroT}>
              <g style={{ filter: icon }} opacity={heroDim}>
                <path d={hc.path} fill="none" stroke={INK} strokeWidth={STROKE} />
                {hc.bars.map((b, bi) => (
                  <path
                    key={bi}
                    d={squirclePath(b.w, hc.h * BAR_H_FRAC * 0.8)}
                    transform={`translate(${b.x.toFixed(2)} ${(b.y - (hc.h * BAR_H_FRAC * 0.8) / 2).toFixed(2)})`}
                    fill={INK}
                    opacity={INK_LO / INK_HI}
                  />
                ))}
              </g>
              <g style={{ filter: icon }}>
                {s1 > 0 ? (
                  <line
                    x1={a1.x}
                    y1={a1.y}
                    x2={a1.x + (b1.x - a1.x) * s1}
                    y2={a1.y + (b1.y - a1.y) * s1}
                    stroke={ACCENT}
                    strokeWidth={STROKE * 1.25}
                    strokeLinecap="round"
                  />
                ) : null}
                {s2 > 0 ? (
                  <line
                    x1={a2.x}
                    y1={a2.y}
                    x2={a2.x + (b2.x - a2.x) * s2}
                    y2={a2.y + (b2.y - a2.y) * s2}
                    stroke={ACCENT}
                    strokeWidth={STROKE * 1.25}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            </g>

            {/* idle traffic */}
            {idle.map((t) => (
              <g key={t.key} opacity={t.op}>
                <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={ACCENT} strokeWidth={THREAD} strokeLinecap="round" />
                {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={THREAD * 1.3} fill={INK} /> : null}
              </g>
            ))}

            {/* the agents */}
            {agents.map((p, a) => (
              <circle key={a} cx={p.x} cy={p.y} r={AGENT_R * (0.75 + 0.5 * hash(a, 3)) * breath(frame, hash(a, 9))} fill={ACCENT} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default CheckableNotTheory;
