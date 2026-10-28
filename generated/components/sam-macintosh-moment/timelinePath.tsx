// ---------------------------------------------------------------------------
// timelinePath — cut 26's own pieces (SmallNumberOfIdeasAway rev 1, sam-macintosh-moment): ONE horizontal time
// axis on the board. The world layout (the rule, TODAY, the three idea nodes, the mainstream milestone, the crowd
// behind it), the timing, the camera and the light pool, and the pieces drawn on the axis: the time rule (solid
// behind today, dashed ahead), the idea node (a small card with a Lucide lightbulb that warms to amber) and
// the milestone flag. The people (Bust), the crowd specs (CROWD) and the Dots tile (DotsMark) come from the clip's
// shared world (macintoshShared.tsx, owned by cut 16; read-only here). Rev 0's stepping stones are retired.
//
// WORLD: world px = the resolved frame's screen px at k = 1 (camera centre 540, 960). Every y below is a world y.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import {
  ALPHA,
  BLOOM_LAYERS,
  COLOR,
  EDGE,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import {
  GLYPH_FILL,
  GLYPH_STROKE,
  TILE,
  UnionShadow,
  makeClockCam,
  makePoolTrack,
  restToRest,
  toneFoot,
  toneTop,
} from "../kits/cheeky-pint/museShared";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `tl${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ---------------------------------------------------------------------------
// LAYOUT (world px = the resolved frame's screen px)
// ---------------------------------------------------------------------------
/** The time rule: a thick cream line across the board (centre y), ticks hanging under it every `pitch`. */
export const LINE = {
  y: 900,
  w: 10,
  pitch: 64,
  dash: 34,
  tick: { len: 14, w: 5 },
} as const;
/** the rule's top edge: where everything pinned to it stands */
export const LINE_TOP = LINE.y - LINE.w / 2;
/** TODAY: the marker on the rule; the Dots tile stands on it. Its tick is longer and cream. */
export const TODAY = { x: 135, tick: 24, tickW: 6 } as const;
export const DOTS = { x: TODAY.x, floor: LINE_TOP, size: 220 } as const;
/** "TODAY" in Kräftig caps under the rule (screen px): above the LABEL token so it reads on a phone. */
export const TODAY_PX = 52;
/** The three ideas: small cards pinned to the dashed rule just ahead of today, close and evenly spaced. */
export const IDEA = { size: 112, xs: [320, 448, 576] } as const;
/** The mainstream milestone: a tall flag on a slim pole planted in the rule (its stake sinks into the line), a
 *  short dashed stretch past the third idea; its cloth flies left, back over the dashed gap, so the crowd standing
 *  behind and to the right of the pole is never covered. */
export const FLAG = {
  x: 708,
  h: 500,
  pole: 12,
  finial: 11,
  w: 168,
  clothH: 112,
} as const;
/** The mainstream: one row of busts standing ON the rule to the right of the flag (the destination on the
 *  timeline, the same footing as Dots and the ideas): head centres `headUp` above the rule's top edge, their
 *  bodies cut clean by the rule in front of their base (no fade). Shoulders overlap, each face clear of the next
 *  head; the first face clears the pole; the row runs off the right edge (7 fully in frame at rest). */
const CROWD_R = 60;
const CROWD_UP = 2.35 * CROWD_R;
export const CROWD_ROW = {
  headUp: CROWD_UP,
  headY: LINE_TOP - CROWD_UP,
  r: CROWD_R,
  pitch: 57,
  x0: 802,
  n: 14,
  focus: FLAG.x,
} as const;
export const CROWD_X = Array.from(
  { length: CROWD_ROW.n },
  (_, i) => CROWD_ROW.x0 + i * CROWD_ROW.pitch,
);
/** a fixed height variation along the row (world px): the shoulder humps step, so it reads as people */
export const CROWD_DY = CROWD_X.map(
  (_, i) => [0, -9, 5, -4, 9, -6, 2, -9, 7, -2, 8][i % 11],
);
/** how far below its place a bust waits: its hair fully under the rule's top edge */
export const CROWD_DROP = LINE_TOP - CROWD_ROW.headY + 1.2 * CROWD_ROW.r + 30;

// ---------------------------------------------------------------------------
// TIMING (frames from the composition's start; words: small f33, number f42, ideas f57, away f63, from f72,
// super f81, mainstream f86, thing f93)
// ---------------------------------------------------------------------------
/** The Dots tile settles onto TODAY over the first frames; "TODAY" slides up in. */
export const SETTLE = { f0: -6, f1: 12 } as const;
export const TODAY_IN = 6;
/** The dashed future is drawn ahead by a moving tip: `lead` screen px from the frame's right edge (inside the
 *  frame at first, so it is seen extending), then it runs on off the frame. */
export const DRAW = {
  leadIn: -110,
  f0: 34,
  f1: 58,
  leadOut: 260,
  run: 40,
} as const;
/** "small number": the three ideas drop onto the rule from above the frame, one after another, landing f43 / 47 / 51
 *  (before "ideas" f57), at board tone (not lit yet). */
export const DROP_F = [27, 31, 35] as const;
export const DROP_FRAMES = 16;
/** "ideas": each card turns cream and its bulb warms to amber as the camera passes it (f55 / 58 / 61). */
export const WARM_F = [55, 58, 61] as const;
export const WARM_FRAMES = 10;
/** "away ... from": the milestone flag is planted in the rule as the camera arrives, dropping in from above the
 *  frame (f60 -> f76, so no sliver of it waits at the frame's edge), board in flight, cream as it lands. */
export const FLAG_DROP = { f0: 60, frames: 16, h: 720 } as const;
export const FLAG_LIT = 70;
/** "super mainstream": the crowd rises up out of the rule (from behind it) right of the flag, a wave from the flag
 *  outward, dark as it comes up and lit into the light as it lands (f86 .. f90, "mainstream" f86). */
export const RISE = { f0: 70, spread: 4, reach: 700, each: 16 } as const;
export const riseStart = (x: number) =>
  RISE.f0 +
  RISE.spread * Math.min(1, Math.abs(x - CROWD_ROW.focus) / RISE.reach);

// ---------------------------------------------------------------------------
// CAMERA + POOL
// ---------------------------------------------------------------------------
/** f0: close on TODAY (k 1.9, the rule at screen y ~830, the dashed future ahead to the right), already gliding
 *  right. ~f50: Dots and the three ideas (k 1.5). Then ONE continuous move on along the rule and back (wider): the
 *  milestone and its crowd come in on the right while Dots never leaves the frame (no sliver at the left edge);
 *  settled by ~f92 on the whole stretch (k 0.85, the rule at y 880, Dots ~40 px in from the left, ~8 people fully
 *  in frame); a living hold to f107. */
const look = (x: number, sy: number, k: number) => ({
  x,
  y: LINE.y - (sy - 960) / k,
  k,
});
const OPEN = look(240, 830, 1.9);
const MID = look(360, 840, 1.5);
const END = look(613, 880, 0.85);
export const CAM = makeClockCam(
  OPEN,
  [
    { f0: -20, f1: 52, dx: MID.x - OPEN.x, dy: MID.y - OPEN.y, k: MID.k },
    { f0: 44, f1: 88, dx: END.x - MID.x, dy: END.y - MID.y, k: END.k },
    // the living hold: a slow creep in on the resolved picture
    { f0: 88, f1: 170, dy: -3, k: 0.87 },
  ],
  120,
);
export const POOL_AT = makePoolTrack(
  { x: TODAY.x, y: LINE.y - 130, strength: 1.5 },
  [
    { f0: 22, f1: 50, x: IDEA.xs[1], y: LINE.y - 90, strength: 1.6 },
    {
      f0: 58,
      f1: 84,
      x: FLAG.x + 220,
      y: CROWD_ROW.headY - 30,
      strength: 2.0,
    },
    { f0: 84, f1: 98, x: 620, y: 700, strength: 1.9 },
  ],
  120,
);

/** The dashed future's tip (world x) at frame f: never retracts (a running max over the frames so far). */
const TIP: number[] = (() => {
  const out: number[] = [];
  let m = -Infinity;
  for (let f = 0; f <= 120; f++) {
    const c = CAM.at(f);
    const u = smoothstep((f - DRAW.f0) / (DRAW.f1 - DRAW.f0));
    const lead =
      lerp(DRAW.leadIn, DRAW.leadOut, u) + Math.max(0, f - DRAW.f1) * DRAW.run;
    m = Math.max(m, c.x + (540 + lead) / c.k);
    out.push(m);
  }
  return out;
})();
export const tipAt = (f: number) => {
  const a = Math.max(0, Math.min(TIP.length - 2, Math.floor(f)));
  return lerp(TIP[a], TIP[a + 1], clamp01(f - a));
};

// ---------------------------------------------------------------------------
// THE TIME RULE — solid cream behind today, dashed cream lo ahead (the future is not built), ticks under it.
// ---------------------------------------------------------------------------
const PAST_X = -2400;
export const TimeRule: React.FC<{ tip: number; k: number }> = ({ tip, k }) => {
  const uid = uidOf(useId());
  void k;
  const ticks: number[] = [];
  for (let n = -40; n <= 60; n++)
    if (n !== 0) ticks.push(TODAY.x + n * LINE.pitch);
  const tickD = (xs: number[]) =>
    xs
      .map(
        (x) =>
          `M${f3(x)} ${f3(LINE.y + LINE.w / 2)}V${f3(LINE.y + LINE.w / 2 + LINE.tick.len)}`,
      )
      .join("");
  // the dashes: centred between the ticks ahead of today (each tick hangs in a gap) (round caps add w / 2 at each end)
  const dashCore = LINE.dash - LINE.w;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}f`}>
          <rect
            x={f3(TODAY.x)}
            y={f3(LINE.y - 200)}
            width={f3(Math.max(0, tip - TODAY.x))}
            height={400}
          />
        </clipPath>
      </defs>
      {/* the past: solid, its ticks */}
      <path
        d={`M${PAST_X} ${LINE.y}H${f3(TODAY.x)}`}
        stroke={COLOR.inkCream}
        strokeWidth={LINE.w}
        fill="none"
      />
      <path
        d={tickD(ticks.filter((x) => x < TODAY.x))}
        stroke={COLOR.inkCreamLo}
        strokeWidth={LINE.tick.w}
        fill="none"
      />
      {/* the future: dashed, drawn ahead by its tip */}
      <g clipPath={`url(#${uid}f)`}>
        <path
          d={`M${f3(TODAY.x + LINE.pitch / 2 - dashCore / 2)} ${LINE.y}H${f3(TODAY.x + 60 * LINE.pitch)}`}
          stroke={COLOR.inkCreamLo}
          strokeWidth={LINE.w}
          strokeLinecap="round"
          strokeDasharray={`${f3(dashCore)} ${f3(LINE.pitch - dashCore)}`}
          fill="none"
        />
        <path
          d={tickD(ticks.filter((x) => x > TODAY.x))}
          stroke={COLOR.inkCreamLo}
          strokeWidth={LINE.tick.w}
          fill="none"
        />
      </g>
      {/* TODAY: the solid rule's end, a longer cream tick */}
      <path
        d={`M${TODAY.x} ${f3(LINE.y + LINE.w / 2)}V${f3(LINE.y + LINE.w / 2 + TODAY.tick)}`}
        stroke={COLOR.inkCream}
        strokeWidth={TODAY.tickW}
        fill="none"
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE IDEA NODE — a small card pinned to the rule, a Lucide lightbulb in ink on it (the house glyph weight). Board
// until its line; on "ideas" the card warms through cream to the clip's amber (band gradient amberTop -> amberFoot,
// the 2 px hot top edge, the fixed bloom kept modest) and the bulb's glass lights amberHot.
// ---------------------------------------------------------------------------
/** Lucide "lightbulb" (24 box): the glass (closed), the two base lines. */
const BULB_GLASS =
  "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5Z";
const BULB_BASE = ["M9 18h6", "M10 22h4"];
const bloomAt = (k: number, a: number) =>
  BLOOM_LAYERS.map(
    (l) =>
      `drop-shadow(0 0 ${f3(l.blur / k)}px ${l.color.replace(/,([\d.]+)\)$/, (_m, v: string) => `,${f3(parseFloat(v) * a)})`)})`,
  ).join(" ");

/**
 * IdeaNode — centred on x, standing on `floor`, `size` wide. `fall` world px above its rest (0 = landed);
 * `lift` 0..1 = its shadow's elevation toward lifted. `dim` 1 = board, 0 = cream. `warm` 0..1 = cream -> amber.
 */
export const IdeaNode: React.FC<{
  x: number;
  floor: number;
  size: number;
  k: number;
  fall: number;
  lift: number;
  dim: number;
  warm: number;
}> = ({ x, floor, size, k, fall, lift, dim, warm }) => {
  const uid = uidOf(useId());
  const W = clamp01(warm);
  const dm = clamp01(dim);
  const y0 = floor - size - fall;
  const r = size * 0.16;
  const d = rectPath(x - size / 2, y0, size, size, r);
  const topC = mixHex(toneTop(dm), COLOR.amberTop, W);
  const footC = mixHex(toneFoot(dm), COLOR.amberFoot, W);
  const cy = y0 + size / 2;
  // GlyphMark's sizing: the glyph's 20-unit ink box is GLYPH_FILL of the card, at the house stroke
  const sc = (size * GLYPH_FILL) / 20;
  const sw = (GLYPH_STROKE * size) / TILE / sc;
  const tf = `translate(${fx(x - 12 * sc)} ${fx(cy - 12.4 * sc)}) scale(${fx(sc)})`;
  return (
    <g>
      <UnionShadow
        sil={[{ d }]}
        s={size / TILE}
        elevation="rest"
        lift={lift}
        contact={{ x, y: floor, w: size }}
      />
      <defs>
        <linearGradient
          id={`${uid}c`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(y0)}
          x2="0"
          y2={f3(y0 + size)}
        >
          <stop offset="0" stopColor={topC} />
          <stop offset="1" stopColor={footC} />
        </linearGradient>
      </defs>
      <g style={W > 0.01 ? { filter: bloomAt(k, 0.6 * W) } : undefined}>
        <path d={d} fill={`url(#${uid}c)`} />
      </g>
      {/* the lit top edge: cream's edge, turning into amber's 2 px hot edge */}
      <path
        d={`M${f3(x - size / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + size / 2 - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dm) * (1 - W)}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
      {W > 0.002 ? (
        <path
          d={`M${f3(x - size / 2 + r)} ${f3(y0 + EDGE.HOT / k / 2)}H${f3(x + size / 2 - r)}`}
          stroke={COLOR.amberHot}
          strokeOpacity={f3(W)}
          strokeWidth={f3(EDGE.HOT / k)}
        />
      ) : null}
      <g
        transform={tf}
        fill="none"
        stroke={COLOR.inkDark}
        strokeWidth={f3(sw)}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d={BULB_GLASS}
          fill={W > 0.002 ? mixHex(topC, COLOR.amberHot, W) : "none"}
        />
        {BULB_BASE.map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MILESTONE — a cream flag on a slim cream pole planted in the rule (the stake sinks into the line: the flag is
// drawn before the rule), a finial on top; the cloth flies left with a slow, small ripple (alive in the hold).
// ONE shadow for pole + finial + cloth.
// ---------------------------------------------------------------------------
/** the cloth (world): its hoist on the pole at (x0, y0), `w` wide, `h` tall; top and bottom edges ripple */
const clothPath = (
  x0: number,
  y0: number,
  w: number,
  h: number,
  ph: number,
) => {
  const N = 16;
  const amp = 0.05 * h;
  const wave = (t: number) => amp * t * Math.sin(ph + t * Math.PI * 1.4);
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    top.push(`${f3(x0 + w * t)} ${f3(y0 + wave(t))}`);
    bot.push(`${f3(x0 + w * (1 - t))} ${f3(y0 + h + wave(1 - t))}`);
  }
  return `M${top.join("L")}L${bot.join("L")}Z`;
};
export const MilestoneFlag: React.FC<{
  k: number;
  dim: number;
  fall: number;
  lift: number;
  ph: number;
}> = ({ k, dim, fall, lift, ph }) => {
  const uid = uidOf(useId());
  const dm = clamp01(dim);
  const foot = LINE.y - fall;
  const top = LINE_TOP - FLAG.h - fall;
  const pw = FLAG.pole;
  const pole = rectPath(FLAG.x - pw / 2, top, pw, foot - top, pw / 2);
  const fin = `M${f3(FLAG.x - FLAG.finial)} ${f3(top)}a${FLAG.finial} ${FLAG.finial} 0 1 0 ${2 * FLAG.finial} 0a${FLAG.finial} ${FLAG.finial} 0 1 0 ${-2 * FLAG.finial} 0Z`;
  // the cloth flies LEFT (negative width): back over the dashed gap, clear of the crowd
  const cloth = clothPath(
    FLAG.x - pw / 2 + 1,
    top + FLAG.finial + 4,
    -FLAG.w,
    FLAG.clothH,
    ph,
  );
  return (
    <g>
      <UnionShadow
        sil={[{ d: pole }, { d: fin }, { d: cloth }]}
        s={FLAG.clothH / TILE}
        elevation="rest"
        lift={lift}
        contact={{ x: FLAG.x, y: LINE_TOP, w: 3 * pw }}
      />
      <defs>
        <linearGradient
          id={`${uid}g`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(top)}
          x2="0"
          y2={f3(top + FLAG.clothH + FLAG.finial + 4)}
        >
          <stop offset="0" stopColor={toneTop(dm)} />
          <stop offset="1" stopColor={toneFoot(dm)} />
        </linearGradient>
      </defs>
      <path d={pole} fill={toneFoot(dm)} />
      <path d={cloth} fill={`url(#${uid}g)`} />
      {/* the cloth's lit top edge */}
      <path
        d={clothPath(
          FLAG.x - pw / 2 + 1,
          top + FLAG.finial + 4,
          -FLAG.w,
          0,
          ph,
        ).replace(/Z$/, "")}
        fill="none"
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dm)}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
      <path d={fin} fill={toneTop(dm)} />
    </g>
  );
};

/** A crowd bust's state at frame f: how far below its place (1 = the full drop), how dark (0 = lit), its bob. */
export const crowdAt = (x: number, i: number, f: number) => {
  const u = (f - riseStart(x)) / RISE.each;
  const rise = restToRest(u);
  const tone = smoothstep((u - 0.5) / 0.5);
  // a tiny slow bob once risen (each bust its own phase and rate)
  const ph = (i * 2.399) % (2 * Math.PI);
  const rate = 0.11 + (0.03 * ((i * 7) % 5)) / 4;
  const bob =
    3 *
    smoothstep((f - riseStart(x) - RISE.each) / 10) *
    Math.sin(f * rate + ph);
  return { sink: 1 - rise, dark: 1 - tone, bob };
};

/** An idea node's state at frame f. */
export const ideaAt = (i: number, f: number) => {
  const u = (f - DROP_F[i]) / DROP_FRAMES;
  const land = restToRest(u);
  return {
    shown: u > 0,
    land,
    lift: 1 - smoothstep((u - 0.6) / 0.4),
    // board -> cream just ahead of the amber (the tone ladder), then cream -> amber
    dim: 1 - smoothstep((f - WARM_F[i] + 5) / 8),
    warm: smoothstep((f - WARM_F[i]) / WARM_FRAMES),
  };
};

export { smoothstep };

/** The milestone flag's state at frame f (`ph` = the cloth's ripple phase). */
export const flagAt = (f: number) => {
  const u = (f - FLAG_DROP.f0) / FLAG_DROP.frames;
  return {
    shown: u > 0,
    fall: (1 - restToRest(u)) * FLAG_DROP.h,
    lift: 1 - smoothstep((u - 0.6) / 0.4),
    dim: 1 - smoothstep((f - FLAG_LIT) / 10),
    ph: f * 0.16,
  };
};
