// ---------------------------------------------------------------------------
// CreativeUnleash (sam-kids-mind-blown, cut 1). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 136 frames. Palette B1.
//
// CHECK LINE: "Ordinary people sitting at these tools are all suddenly making things, one after another, more and more."
//
// THE LINE: "(there) is this, like, spirit of just, like, unbelievable creative unleash in people using these tools."
// WORD -> FRAME: is 1 · this 5 · like 9 · spirit 13 · of 23 · just 30 · like 36 · unbelievable 41 · creative 57 ·
//   unleash 77 · in 89 · people 103 · using 113 · these 121 · tools 124
// DURATION: the slot 1.919 -> 7.591 s = sequence frames 46 -> 182 = 136 frames (f0..f135).
//
// THE MOTION: one long crane back and up. f0: one person at one laptop, a music note already rising out of it. The camera
// eases back on one key, neighbours come in from both sides, each launching their own thing at the full rate from f0, easing after f78;
// the wide (about four whole people, neighbours cropped) is essentially reached by about f80, so the field is at its fullest on
// "unleash" (f77); then the row creeps on, the visible laptops keep launching and each lid lifts a little as a creation clears it.
// AMBER = what gets made; the only other amber is its light on the faces and round the lids. People and laptops stay muted.
// Creations are born hidden behind a lid at 60 % size, grow only while they emerge, rise straight up a corridor clear of the
// heads, fan out only above head height, and leave through the top. Below the plank: stools, legs, table legs on the board.
// DEPTH AT EACH SEAT: deck, then arms and hands, then lid. We see the lid's back, so the keyboard is on its far side: the hands
// type in the strip of deck left of the lid, the fingers going under it, and the near arm lies over the plank's back edge.
// HEAD CHECK: every creation is tested against every head box on every frame from f0; a module-load assert throws on a hit.
//
// SOURCES: the OpenAI blossom via kidsShared's Laptop (Commons "OpenAI logo 2025 (symbol)"). No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, amberBandFor, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, type SilItem } from "../kits/cheeky-pint/museShared";
import { solveArm } from "../scott-free-wifi/cabinCast";
import { ADULT, ADULT_SPECS, Adult, CHILD, KID_SPEC, Kid, LAPTOP, Laptop, Stool, amberGlowFilter, blinkAt, circleD, headCentre, laptopFrame, localToWorld, personSil, polyD, stoolSil, swingAt, worldToLocal, type P2 } from "./kidsShared";
import { MakeBody, makeSil, type MakeName } from "./unleashGlyphs";

export const FPS = 24000 / 1001;
export const DURATION = 136;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- THE WORLD: the plank's back edge is y = 0; the hero sits at x = 0 ---------------------------------------------------
const TABLE_D = 38; // the plank's visible top
const PLANK_EDGE = 8;
const FLOOR = 470;
const LAP_W = 115;
const LAP = { yaw: 125, pitch: 14, tilt: 14 };
const HINGE_Y = 12;
const ADULT_CUT = 80; // the hip origin below the plank's back edge
const KID_Y = 56;
const KID_SCALE = 0.92;
const LANE_DX = 156; // a seat's corridor, from its x
const NEAR_DECK = { u: 0.57, v: 0.73 }; // the wrists' rest on the deck (u 0..1 far to near end of the hinge, v hinge to front edge)
const FAR_DECK = { u: 0.28, v: 0.85 };
type Seat = { x: number; kid?: boolean; variant: number; scale: number; lapDx: number; make: MakeName[]; phase: number; offs: number[]; v: number; swing: number };
const WIDE = [-110, 0, 110];
const NARROW = [-63, 63];
const seat = (x: number, variant: number, make: MakeName[], v: number, swing = 0, offs = NARROW, scale = 1): Seat => ({ x, variant, make, scale, lapDx: 147, phase: x * 0.37, offs, v, swing });
const SEATS: Seat[] = [
  seat(-1136, 2, ["rocket", "note", "house"], 9.4),
  seat(-866, 1, ["camera", "heart", "book"], 8.8, 6, NARROW, 0.97),
  seat(-596, 4, ["bike", "rocket", "heart"], 10),
  seat(-326, 5, ["controller", "camera", "book", "rocket"], 9, 0, WIDE),
  seat(0, 3, ["note", "heart", "brush", "camera"], 7.6, 5, WIDE),
  { ...seat(334, 0, ["rocket", "controller", "house", "note"], 9.6, 16, WIDE), kid: true, scale: KID_SCALE, lapDx: 118 },
  seat(603, 2, ["brush", "house", "bike"], 8.6),
  seat(873, 0, ["book", "controller", "brush"], 10.2, 7, NARROW, 0.97),
  seat(1143, 4, ["heart", "bike", "camera"], 9.1),
];
const figY = (s: Seat) => (s.kid ? KID_Y : ADULT_CUT * s.scale);
const frameOf = (s: Seat, tilt = LAP.tilt) => laptopFrame({ x: s.x + s.lapDx, y: HINGE_Y, w: LAP_W, ...LAP, tilt });
const lidMid = (s: Seat): P2 => frameOf(s).lid(0, (LAP_W * LAPTOP.H) / 2);
/** the pose's life, the head box and the render share these */
const LEAN = { mid: 2, amp: 0.8 };
const TILT = { mid: 3.5, amp: 2 };
/** the head with its hair and nose at the pose's worst lean and tilt: x0 x1 y0 y1, world */
const headBox = (s: Seat) => {
  const b = s.kid ? CHILD : ADULT;
  const cs = [-1, 1].flatMap((i) => [-1, 1].map((j) => headCentre(b, LEAN.mid + i * LEAN.amp, TILT.mid + j * TILT.amp)));
  const xs = cs.map((c) => c[0]);
  const ys = cs.map((c) => c[1]);
  return {
    x0: s.x + s.scale * (Math.min(...xs) - 1.36 * b.R),
    x1: s.x + s.scale * (Math.max(...xs) + 1.32 * b.R),
    y0: figY(s) + s.scale * (Math.min(...ys) - 1.72 * b.R),
    y1: figY(s) + s.scale * (Math.max(...ys) + 1.04 * b.R),
  };
};
const TABLE_LEGS = [-985, -461, 215, 738, 1260];
const NEAR_REACH = 0.95; // the near arm a touch shorter, so its elbow rides above the plank's back edge and the deck's front corner stays clear
/** the near arm as world shapes: it lies on the plank, so the cut at the plank must not slice it (same solve as the rig's Person) */
const nearArmClip = (b: typeof ADULT, p: { x: number; y: number; scale: number; lean: number; hand: P2 }): string[] => {
  const a = (p.lean * Math.PI) / 180;
  const S: P2 = [b.shoulder[0] * Math.cos(a) - b.shoulder[1] * Math.sin(a), b.shoulder[0] * Math.sin(a) + b.shoulder[1] * Math.cos(a)];
  const { E, W } = solveArm(S, p.hand, b.upper * NEAR_REACH, b.fore * NEAR_REACH, 1);
  const band = (A: P2, B: P2, w: number) => {
    const r = (w / 2) * p.scale;
    const [ax, ay] = localToWorld(A, p);
    const [bx, by] = localToWorld(B, p);
    const len = Math.hypot(bx - ax, by - ay);
    const nx = (-(by - ay) / len) * r;
    const ny = ((bx - ax) / len) * r;
    return polyD([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]]);
  };
  const [ex, ey] = localToWorld(E, p);
  return [band(S, E, b.armW), band(E, W, b.armW - 1.5), circleD(ex, ey, (b.armW / 2) * p.scale)];
};

// --- THE CAMERA: k on one key through the house follower; y derived from k so the table holds its screen height ---------
const K_TRACK = makeClockCam(
  { x: 70, y: 0, k: 3.04 },
  [
    { f0: -16, f1: 78, k: 1.05 },
    { f0: 70, f1: 150, k: 1 },
    { f0: -16, f1: 150, dx: 98 },
  ],
  DURATION,
);
const tableScreenY = (f: number) => lerp(1000, 1040, smoothstep((f - 32) / 48));
const camAt = (f: number) => {
  const c = K_TRACK.at(f);
  return { x: c.x, k: c.k, y: -(tableScreenY(f) - 960) / c.k };
};
const REST = camAt(0);
const POOL = makePoolTrack({ x: 90, y: -60, strength: 1.5 }, [{ f0: 10, f1: 84, x: 160, y: -160, strength: 1.9 }], DURATION);

// --- THE FIELD ----------------------------------------------------------------------------------------------------------
const SIZE = 112; // a creation's 24 box at full size (world)
const BIRTH = 0.6;
const STRAIGHT_TO = 300; // height (world, above its birth) where a creation has cleared every head and may fan out
const growOf = (h: number) => lerp(BIRTH, 1, smoothstep((h - 18) / 95));
const HIDDEN_H = 28;
const INK = 0.46; // half the ink box, as a share of SIZE
type Obj = { t0: number; v: number; lx: number; ly: number; cx: number; tx: number; name: MakeName; size: number; a0: number; w: number };
const posOf = (o: Obj, f: number) => {
  const h = o.v * (f - o.t0);
  return { h, x: o.lx + (o.cx - o.lx) * smoothstep(h / 70) + (o.tx - o.cx) * smoothstep((h - STRAIGHT_TO) / 240), y: o.ly - h };
};
/** frames between one seat's launches */
const launchGap = (f: number, v: number) => Math.max(122 / v, f < 0 ? 13 : 13 + 8 * smoothstep((f - 78) / 16));
const hitsHead = (o: Obj, f: number) => {
  const p = posOf(o, f);
  if (p.h < HIDDEN_H) return false; // still behind its own lid
  const half = INK * o.size * growOf(p.h);
  return SEATS.some((s) => {
    const b = headBox(s);
    return p.x + half > b.x0 && p.x - half < b.x1 && p.y + half > b.y0 && p.y - half < b.y1;
  });
};
const hitsAnyFrame = (o: Obj) => {
  for (let f = Math.max(0, Math.ceil(o.t0)); f < DURATION; f++) if (hitsHead(o, f)) return true;
  return false;
};
const OBJECTS: Obj[] = (() => {
  const v0 = { x0: REST.x - 540 / REST.k - 30, x1: REST.x + 540 / REST.k + 30, y0: REST.y - 960 / REST.k - 30 };
  const hero = SEATS[4];
  const [hx, hy] = lidMid(hero);
  const note: Obj = { t0: -10, v: hero.v, lx: hx, ly: hy, cx: hero.x + LANE_DX, tx: hero.x + LANE_DX, name: "note", size: SIZE, a0: -5, w: 0.09 };
  const cands: Obj[] = [];
  SEATS.forEach((s) => {
    const [lx, ly] = lidMid(s);
    const cx = s.x + LANE_DX;
    let t = -176 - 12 * random(`s${s.x}`);
    let n = 0;
    while (t < DURATION + 2) {
      const name = s.make[n % s.make.length];
      const turn = name === "rocket" ? 0.06 : 0.22;
      const id = `${s.x}-${n}`;
      cands.push({ t0: t, v: s.v, lx, ly, cx, tx: cx + s.offs[n % s.offs.length], name, size: SIZE * lerp(0.88, 1, random(`o${id}`)), a0: (name === "rocket" ? 6 : 13) * (random(`a${id}`) * 2 - 1), w: turn * (random(`w${id}`) * 2 - 1) });
      t += launchGap(t, s.v) * lerp(1, 1.12, random(`j${id}`));
      n++;
    }
  });
  // nothing but the note in shot at f0
  const visibleAtF0 = (o: Obj) => {
    const p = posOf(o, 0);
    return o.t0 <= 0 && p.x > v0.x0 - o.size && p.x < v0.x1 + o.size && p.y + o.size > v0.y0;
  };
  const heroQuiet = (o: Obj) => o.t0 > 0 && o.t0 < 14 && o.lx === hx;
  const kept: Obj[] = [note];
  for (const o of cands) {
    if (visibleAtF0(o) || heroQuiet(o) || hitsAnyFrame(o)) continue;
    let ok = true;
    for (const q of kept) {
      const f0 = Math.max(o.t0, q.t0);
      if (f0 > DURATION) continue;
      for (let f = f0; f <= DURATION; f += 4) {
        const a = posOf(o, f);
        const b = posOf(q, f);
        if (Math.hypot(a.x - b.x, a.y - b.y) < 0.82 * (o.size * growOf(a.h) + q.size * growOf(b.h)) * 0.5) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
    }
    if (ok) kept.push(o);
  }
  // the head check: no creation overlaps a head box on any frame
  for (const o of kept) if (hitsAnyFrame(o)) throw new Error(`CreativeUnleash: a ${o.name} crosses a head`);
  return kept;
})();

// --- THE LID'S LIFT: as a creation clears its lid (contact = the frame it clears), the lid rises a little and settles ------
const CLEAR_H = 62; // height above its birth where a creation's foot has left the lid
const LIFT_DEG = 8;
const liftOf = (s: Seat, f: number) => {
  const lx = lidMid(s)[0];
  let e = 0;
  for (const o of OBJECTS) {
    if (o.lx !== lx) continue;
    const u = f - (o.t0 + CLEAR_H / o.v);
    if (u > -3 && u < 11) e = Math.max(e, smoothstep((u + 3) / 3) * (1 - smoothstep(u / 11)));
  }
  return e;
};

// --- THE TABLE (cut 16's Desk tones: a plank on legs, board tone, context) ------------------------------------------------
const WOOD_LEG = mixHex(COLOR.boardFoot, COLOR.ground, 0.38);
const WOOD_FAR = mixHex(COLOR.boardFoot, COLOR.ground, 0.6);
const legD = (x: number, w: number, y1: number) => `M${x - w / 2} ${TABLE_D + PLANK_EDGE - 2}H${x + w / 2}L${x + w / 2 - 3} ${y1}H${x - w / 2 + 3}Z`;

const CreativeUnleash: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const pool = POOL(S);
  const vx0 = cam.x - 540 / k - 130;
  const vx1 = cam.x + 540 / k + 130;
  const vy0 = cam.y - 960 / k - 130;
  const band = amberBandFor(cam);
  const px0 = cam.x - 700 / k - 200;
  const pw = 1400 / k + 400;

  // the creations of this frame
  const live = OBJECTS.filter((o) => {
    if (S < o.t0) return false;
    const p = posOf(o, S);
    return p.x > vx0 && p.x < vx1 && p.y > vy0;
  }).map((o) => {
    const p = posOf(o, S);
    const sc = (o.size * growOf(p.h)) / 24;
    const tf = `translate(${p.x} ${p.y}) rotate(${o.a0 + o.w * (S - o.t0)}) scale(${sc}) translate(-12 -12)`;
    return { o, tf, fill: mixHex(COLOR.amberTop, COLOR.amberFoot, clamp01((p.y - band[0]) / (band[1] - band[0]))) };
  });
  const fieldSil: SilItem[] = live.flatMap((l) => makeSil(l.o.name, l.tf));

  // the people of this frame, right to left: each laptop stands in front of the next person's back
  const seats = SEATS.filter((s) => s.x + 240 > vx0 && s.x - 100 < vx1).reverse();
  const poseOf = (s: Seat) => {
    const F = frameOf(s);
    const fig = { x: s.x, y: figY(s), scale: s.scale };
    const tapA = Math.sin((S + s.phase) * 0.62);
    const tapB = Math.sin((S + s.phase) * 0.62 + 2.1);
    // the wrists on the palm rest of the strip we can see left of the lid, the mittens reaching forward onto the keys and under the lid
    const near = F.deck(NEAR_DECK.u + 0.035 * tapA, NEAR_DECK.v + 0.03 * Math.abs(tapB));
    const far = F.deck(FAR_DECK.u + 0.035 * tapB, FAR_DECK.v + 0.03 * Math.abs(tapA));
    const pose = {
      ...fig,
      legs: "seat" as const,
      swing: s.swing ? swingAt(S, s.swing, s.kid ? 27 : 41, s.phase) : 6,
      swingFar: s.swing ? swingAt(S, s.swing * 0.8, s.kid ? 27 : 41, s.phase + (s.kid ? 13 : 19)) : -3,
      hand: worldToLocal(near, fig),
      farHand: worldToLocal(far, fig),
      nearReach: NEAR_REACH,
      lean: LEAN.mid + LEAN.amp * Math.sin((S + s.phase) / 17),
      headTilt: TILT.mid + TILT.amp * Math.sin((S + s.phase) / 23),
      blink: blinkAt(S, (s.x + 700) * 0.013, 61),
      smile: 0.72,
      amberLight: 0.5,
      shadow: false,
    };
    const front = s.x + (s.kid ? 40 : 54) * s.scale;
    return { pose, front };
  };
  const stoolOf = (s: Seat) => ({ x: s.x - 6, seatY: figY(s) + 2, floorY: FLOOR, w: s.kid ? 104 : 124 });
  const body = (s: Seat, p: ReturnType<typeof poseOf>["pose"]) => (s.kid ? <Kid {...p} /> : <Adult {...p} variant={s.variant} />);
  const tableSil: SilItem[] = [{ d: `M${px0} 0h${pw}v${TABLE_D + PLANK_EDGE}h${-pw}Z` }, ...TABLE_LEGS.map((x) => ({ d: legD(x, 26, FLOOR) }))];

  return (
    <StoutStage S={S} cam={cam} rest={REST} pool={pool}>
      {/* the floor: one soft shadow per figure on its stool, one for the table */}
      {seats.map((s) => (
        <UnionShadow
          key={`ps${s.x}`}
          sil={[...personSil({ ...poseOf(s).pose, build: s.kid ? CHILD : ADULT, spec: s.kid ? KID_SPEC : ADULT_SPECS[s.variant] }), ...stoolSil(stoolOf(s))]}
          s={1.2}
          contact={{ x: s.x, y: FLOOR, w: 120 }}
        />
      ))}
      <UnionShadow sil={tableSil} s={1.2} />
      {/* the field: one shadow, one bloom */}
      <UnionShadow sil={fieldSil} s={1} elevation="lifted" strength={0.8} />
      <g style={{ filter: amberGlowFilter(k) }}>
        {live.map((l, i) => (
          <g key={i} transform={l.tf}>
            <MakeBody name={l.o.name} fill={l.fill} ink={COLOR.inkDark} />
          </g>
        ))}
      </g>
      {/* behind the plank: the far table legs, the stools, the whole figures */}
      <path d={TABLE_LEGS.map((x) => legD(x + 44, 18, FLOOR - 26)).join("")} fill={WOOD_FAR} />
      {seats.map((s) => (
        <g key={`f${s.x}`}>
          <Stool {...stoolOf(s)} />
          {body(s, poseOf(s).pose)}
        </g>
      ))}
      {/* the plank on its near legs */}
      <path d={TABLE_LEGS.map((x) => legD(x, 26, FLOOR)).join("")} fill={WOOD_LEG} />
      <rect x={px0} y={0} width={pw} height={TABLE_D} fill={COLOR.board} />
      <rect x={px0} y={TABLE_D} width={pw} height={PLANK_EDGE} fill={COLOR.boardFoot} />
      {/* the screens' amber light, spilling round the lids */}
      <g style={{ filter: amberGlowFilter(k) }}>
        {seats.map((s) => (
          <path key={`g${s.x}`} d={polyD(frameOf(s, LAP.tilt - LIFT_DEG * liftOf(s, S)).lidHull)} fill={COLOR.amberTop} stroke={COLOR.amberTop} strokeWidth={5 / k} strokeLinejoin="round" />
        ))}
      </g>
      {/* over the plank, in depth order for each seat: the deck and lid, then that person's torso, head and arms again (cut at the
          plank), kept off the lid's hull: we see the lid's back, so the hands are on the keyboard behind it */}
      {seats.map((s) => {
        const { pose, front } = poseOf(s);
        const id = `cuClip${Math.round(s.x + 2000)}`;
        const tilt = LAP.tilt - LIFT_DEG * liftOf(s, S);
        return (
          <g key={s.x}>
            <Laptop x={s.x + s.lapDx} y={HINGE_Y} w={LAP_W} {...LAP} tilt={tilt} k={k} shadow />
            <defs>
              <clipPath id={id}>
                <rect x={s.x - 400} y={-900} width={400 + (front - s.x)} height={900} />
                <rect x={front} y={-900} width={500} height={s.kid ? 924 : 934} />
                {nearArmClip(s.kid ? CHILD : ADULT, pose).map((d) => (
                  <path key={d} d={d} />
                ))}
              </clipPath>
              <clipPath id={`${id}lid`}>
                <path clipRule="evenodd" d={`M${s.x - 900} -1800H${s.x + 900}V900H${s.x - 900}Z${polyD(frameOf(s, tilt).lidHull)}`} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}lid)`}>
              <g clipPath={`url(#${id})`}>{body(s, pose)}</g>
            </g>
          </g>
        );
      })}
    </StoutStage>
  );
};

export default CreativeUnleash;
