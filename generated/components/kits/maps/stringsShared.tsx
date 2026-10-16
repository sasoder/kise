// ---------------------------------------------------------------------------
// stringsShared: the shared world of the "strings" set (Dwarkesh Patel with Si
// Sheppard, "Why captured emperors cooperated"): PitilessAutocrat,
// PsychologicalBreak, CortessPuppet, NotRockTheBoat, ReachingOutToHisPeople.
// Dwarkesh map style, "beyond maps" page: the umber page of the Cajamarca K/D
// V2 set (incaShared PlanPage: land #3F3428, world-space mottle, grain,
// vignette), cream ink #E9DDBF, IM Fell English SC, figures in the engraved
// manner (a DARK casing, the cream fill, a firm dark outline, hatching on the
// shaded side; light from the upper left). ONE ACCENT: orange = THE LIVE HOLD,
// a string that is being pulled, and nothing else. Figures are never orange.
//
// EXPORTS (maths, rigs, layout, cameras: stringsMotion.ts, re-exported here)
//   StringsPage cam                 the page (children draw over it)
//   WorldSvg cam                    (incaShared) a full-frame svg in world units
//   Emperor pose variant at tone uid   the articulated emperor ("aztec" = Moctezuma,
//                                   "inca" = Atahualpa); feet at `at`
//   Noble i | at, bow tone variant scale uid   an Aztec lord; bow 1 = bowed
//   CaptorHand bar tilt at tone uid the gauntleted hand, with the marionette bar
//   PuppetString from to slack base live drawn highlight knots k
//   Label text x y cam frame f0 size opacity   IM Fell English SC, slide-up-and-fade
//   WarriorGroup cam men            Inca warriors (pageFigures sprites) for cut E
//   Tableau scene | state, cam, frame   a whole state in one line
//   E1, E2, E3 (Scene), STATES, CAMS, lerpScene, sceneStrings
// Everything in a WorldSvg draws in WORLD px.
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, FRAME_H, FRAME_W, INK, PlanPage, WorldSvg, fellSC, labelSlide, screenOf, type Cam, type P2 } from "./incaShared";
import { CaptorHand, Emperor, Noble } from "./stringsFigures";
import { SpriteCanvas, blit, incaKey, type FigKey } from "./pageFigures";
import {
  CAM_E1,
  CAM_E2,
  CAM_E3,
  HAND_AT,
  N_NOBLES,
  POSE_HANG,
  POSE_SLUMP,
  POSE_UPRIGHT,
  camOf,
  emperorAnchors,
  fistOf,
  handAnchors,
  lerpPose,
  mix,
  mix2,
  nobleHeadTop,
  stringPts,
  type CamPreset,
  type EmperorPose,
  type StringGeom,
  type Variant,
} from "./stringsMotion";

export * from "./stringsMotion";
export { CaptorHand, Emperor, Noble, WorldSvg };
export type { Cam, P2 };

// ---------------------------------------------------------------------------
// INK
// ---------------------------------------------------------------------------
/** the ink ladder: subject, secondary, dead / dormant */
export const TONE = { full: 1, second: 0.55, dead: 0.28 };
const C_MAIN = INK;
/** the travelling highlight on a taut orange string */
const GLINT = "#FFF3D2";
/** a string's weight at k 1 (world px) */
export const STRING_W = 3.5;

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const poly = (pts: P2[]) => `M${pts.map(P).join("L")}`;
// ---------------------------------------------------------------------------
// THE PAGE
// ---------------------------------------------------------------------------
export const StringsPage: React.FC<{ cam: Cam; vignette?: number; children?: React.ReactNode }> = ({ cam, vignette = 0.55, children }) => (
  <PlanPage cam={cam} vignette={vignette}>
    {children}
  </PlanPage>
);

// ---------------------------------------------------------------------------
// THE STRING
// ---------------------------------------------------------------------------
export type StringLook = {
  /** the cream's opacity (1 / 0.55 / 0.28 = dead) */
  base?: number;
  /** the ORANGE (live) stretch [a, b] of the string (0 = `from`, the puller's end); null = none */
  live?: [number, number] | null;
  /** the stretch [a, b] of the string that exists (a string still rising: [1 - p, 1]) */
  drawn?: [number, number];
  /** the middle (0..1) of a faint highlight on the live stretch; null = none */
  highlight?: number | null;
  /** small knots at these positions */
  knots?: number[];
};
export type StringState = StringLook & Pick<StringGeom, "slack" | "sag" | "side">;
export const PuppetString: React.FC<StringGeom & StringLook & { k?: number; width?: number }> = ({
  from,
  to,
  slack = 0,
  sag,
  side,
  base = 1,
  live = null,
  drawn = [0, 1],
  highlight = null,
  knots,
  k = 1,
  width = STRING_W,
}) => {
  const g: StringGeom = { from, to, slack, sag, side };
  const [d0, d1] = drawn;
  if (d1 - d0 < 0.002) return null;
  const w = width / k;
  const seg = (a: number, b: number) => poly(stringPts(g, a, b));
  const L0 = live ? Math.max(d0, live[0]) : 1;
  const L1 = live ? Math.min(d1, live[1]) : 0;
  const hasLive = L1 - L0 > 0.002;
  const cream: [number, number][] = hasLive ? ([[d0, L0], [L1, d1]] as [number, number][]).filter(([a, b]) => b - a > 0.002) : [[d0, d1]];
  const glint: { a: number; b: number; o: number }[] = [];
  if (hasLive && highlight !== null)
    for (const [hw, o] of [
      [0.085, 0.2],
      [0.05, 0.3],
      [0.022, 0.45],
    ]) {
      const a = Math.max(L0, highlight - hw);
      const b = Math.min(L1, highlight + hw);
      if (b - a > 0.004) glint.push({ a, b, o });
    }
  const whole = seg(d0, d1);
  return (
    <g fill="none" strokeLinejoin="round">
      <path d={whole} stroke={DARK} strokeOpacity={0.5 * (hasLive ? 1 : Math.min(1, base + 0.3))} strokeWidth={w + 2.6 / k} strokeLinecap="round" />
      {base > 0.003 ? cream.map(([a, b], i) => <path key={i} d={seg(a, b)} stroke={C_MAIN} strokeOpacity={base} strokeWidth={w} strokeLinecap="round" />) : null}
      {hasLive ? (
        <>
          <path d={seg(L0, L1)} stroke={ACCENT_DEEP} strokeWidth={w * 1.5} strokeLinecap="butt" />
          <path d={seg(L0, L1)} stroke={ACCENT} strokeWidth={w * 0.92} strokeLinecap="butt" />
        </>
      ) : null}
      {glint.map((q, i) => (
        <path key={i} d={seg(q.a, q.b)} stroke={GLINT} strokeOpacity={q.o} strokeWidth={w * 0.92} strokeLinecap="butt" />
      ))}
      {knots?.map((s, i) => {
        if (s < d0 || s > d1) return null;
        const [x, y] = stringPts(g, s, s + 0.0001, 1)[0];
        const on = hasLive && s >= L0 && s <= L1;
        return <circle key={i} cx={x} cy={y} r={w * 0.95} fill={on ? ACCENT : C_MAIN} fillOpacity={on ? 1 : base} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.2 / k} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE LABEL: IM Fell English SC spaced caps at a world point, screen-sized;
// slides up 24 px while fading in from f0 (lands on its word: f0 ~8 f before)
// ---------------------------------------------------------------------------
export const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  f0: number;
  size?: number;
  opacity?: number;
  dy?: number;
  spacing?: number;
}> = ({ text, x, y, cam, frame, f0, size = 44, opacity = 1, dy = 0, spacing = 0.3 }) => {
  const sl = labelSlide(frame, f0);
  if (sl.op * opacity <= 0.002) return null;
  const [sx, sy] = screenOf([x, y], cam);
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + (size * spacing) / 2}
        y={sy + dy + sl.dy}
        textAnchor="middle"
        opacity={sl.op * opacity}
        fill={INK}
        stroke={DARK}
        strokeOpacity={0.45}
        strokeWidth={size * 0.09}
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * spacing }}
      >
        {text}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// INCA WARRIORS (cut E): pageFigures' engraved warrior sprites, feet at world
// (x, y), h world px tall (default 110); `i` picks the hashed variant / lean
// ---------------------------------------------------------------------------
const WARRIOR_KEYS: FigKey[] = Array.from({ length: 24 }, (_, i) => incaKey(i));
export type Warrior = { x: number; y: number; h?: number; alpha?: number; i?: number };
export const WarriorGroup: React.FC<{ cam: Cam; men: Warrior[] }> = ({ cam, men }) => (
  <SpriteCanvas
    draw={(ctx) => {
      men.forEach((m, j) => {
        const [sx, sy] = screenOf([m.x, m.y], cam);
        blit(ctx, WARRIOR_KEYS[(m.i ?? j) % WARRIOR_KEYS.length], sx, sy, (m.h ?? 110) * cam.k, m.alpha ?? 1);
      });
    }}
  />
);

// ---------------------------------------------------------------------------
// SCENES: a whole tableau as data, the named states, and <Tableau />
// ---------------------------------------------------------------------------
export type Scene = {
  variant: Variant;
  emperor: EmperorPose;
  emperorTone: number;
  /** the 7 nobles, left to right */
  nobles: { bow: number; tone: number }[];
  /** the 7 strings M: from the emperor's fist (s = 0) down to noble i's head (s = 1) */
  stringsM: StringState[];
  /** the captor's hand: show (opacity), bar 0..1, tilt deg, dy (world px; < 0 = raised off the top) */
  hand: { show: number; bar: number; tilt: number; dy: number };
  /** the strings C: from the hand / bar (s = 0) down to his head and wrists (s = 1); null = absent */
  stringsC: { head: StringState | null; wristL: StringState | null; wristR: StringState | null };
};
const TAUT_LIVE: StringState = { slack: 0, base: 1, live: [0, 1] };
const LOOSE_DEAD: StringState = { slack: 1, base: TONE.dead, live: null };
const all7 = <T,>(v: T): T[] => Array.from({ length: N_NOBLES }, () => ({ ...v }));
/** E1: Moctezuma upright, his fists holding 7 taut orange strings; the nobles upright; no hand */
export const E1: Scene = {
  variant: "aztec",
  emperor: POSE_UPRIGHT,
  emperorTone: 1,
  nobles: all7({ bow: 0, tone: 1 }),
  stringsM: all7(TAUT_LIVE),
  hand: { show: 0, bar: 0, tilt: 0, dy: 0 },
  stringsC: { head: null, wristL: null, wristR: null },
};
/** E2: he is slumped, his 7 strings slack and dead; above, the hand holds ONE taut orange head string */
export const E2: Scene = {
  variant: "aztec",
  emperor: POSE_SLUMP,
  emperorTone: 1,
  nobles: all7({ bow: 0.35, tone: TONE.second }),
  stringsM: all7(LOOSE_DEAD),
  hand: { show: 1, bar: 0, tilt: 0, dy: 0 },
  stringsC: { head: { ...TAUT_LIVE }, wristL: null, wristR: null },
};
/** E3: the hand holds the bar; he hangs from three taut orange strings; his 7 strings taut and orange again */
export const E3: Scene = {
  variant: "aztec",
  emperor: POSE_HANG,
  emperorTone: 1,
  nobles: all7({ bow: 0, tone: 0.8 }),
  stringsM: all7(TAUT_LIVE),
  hand: { show: 1, bar: 1, tilt: 0, dy: 0 },
  stringsC: { head: { ...TAUT_LIVE }, wristL: { ...TAUT_LIVE }, wristR: { ...TAUT_LIVE } },
};
export const STATES = { E1, E2, E3 };
export type StateName = keyof typeof STATES;
export const CAMS: Record<StateName, CamPreset> = { E1: CAM_E1, E2: CAM_E2, E3: CAM_E3 };
/** the state's camera (focus at screen (540, 835)) */
export const stateCam = (s: StateName): Cam => camOf(CAMS[s]);

const slackPair = (s: StringState["slack"]): [number, number] => (typeof s === "number" ? [s, s] : (s ?? [0, 0]));
const lerpString = (a: StringState | null, b: StringState | null, t: number): StringState | null => {
  if (!a || !b) return t < 0.5 ? a : b;
  const sa = slackPair(a.slack);
  const sb = slackPair(b.slack);
  return { ...(t < 0.5 ? a : b), slack: [mix(sa[0], sb[0], t), mix(sa[1], sb[1], t)], base: mix(a.base ?? 1, b.base ?? 1, t) };
};
/** between two scenes: poses, bows, tones, slack and the hand blend; a string's
 *  live / drawn stretches SWITCH at t 0.5 (animate those yourself: they are fronts) */
export const lerpScene = (a: Scene, b: Scene, t: number): Scene => ({
  variant: t < 0.5 ? a.variant : b.variant,
  emperor: lerpPose(a.emperor, b.emperor, t),
  emperorTone: mix(a.emperorTone, b.emperorTone, t),
  nobles: a.nobles.map((n, i) => ({ bow: mix(n.bow, b.nobles[i].bow, t), tone: mix(n.tone, b.nobles[i].tone, t) })),
  stringsM: a.stringsM.map((s, i) => lerpString(s, b.stringsM[i], t) as StringState),
  hand: { show: mix(a.hand.show, b.hand.show, t), bar: mix(a.hand.bar, b.hand.bar, t), tilt: mix(a.hand.tilt, b.hand.tilt, t), dy: mix(a.hand.dy, b.hand.dy, t) },
  stringsC: { head: lerpString(a.stringsC.head, b.stringsC.head, t), wristL: lerpString(a.stringsC.wristL, b.stringsC.wristL, t), wristR: lerpString(a.stringsC.wristR, b.stringsC.wristR, t) },
});

/** every string of a scene as geometry in WORLD px (m[i]: fist -> noble i; c: hand / bar -> head, wrists) */
export const sceneStrings = (sc: Scene) => {
  const e = emperorAnchors(sc.emperor, sc.variant);
  const handAt: P2 = [HAND_AT[0], HAND_AT[1] + sc.hand.dy];
  const h = handAnchors(sc.hand, handAt);
  const m = sc.stringsM.map((s, i): StringGeom => {
    const L = fistOf(i) === "L";
    const j = L ? i - 1.5 : i - 5;
    const f = L ? e.fistL : e.fistR;
    return { from: [f[0] + j * 2.4, f[1] + 8], to: nobleHeadTop(i, sc.nobles[i].bow), slack: s.slack, sag: s.sag, side: s.side ?? (i < 3 ? -1 : i > 3 ? 1 : -1) };
  });
  const cg = (s: StringState | null, from: P2, to: P2): StringGeom | null => (s ? { from, to, slack: s.slack, sag: s.sag, side: s.side } : null);
  // the head string leaves the fist until the bar is there, then the bar's middle
  const top = mix2(h.grip, h.barC, Math.min(1, sc.hand.bar * 1.5));
  return {
    m,
    c: {
      head: cg(sc.stringsC.head, top, e.headTop),
      wristL: cg(sc.stringsC.wristL, h.barL, e.wristL),
      wristR: cg(sc.stringsC.wristR, h.barR, e.wristR),
    },
    emperor: e,
    hand: h,
    handAt,
  };
};

/** a taut live string's travelling highlight: position at `frame` (off the string = none) */
export const glintAt = (frame: number, i: number, period = 46) => {
  const u = (((frame + i * 13.7) / period) % 1) * 1.5 - 0.25;
  return u;
};
const autoGlint = (s: StringState, frame: number, i: number): number | null => {
  if (s.highlight !== undefined) return s.highlight;
  const sl = slackPair(s.slack);
  if (!s.live || sl[0] > 0.12 || sl[1] > 0.12) return null;
  return glintAt(frame, i);
};

/** a whole tableau. `<Tableau state="E2" cam={cam} frame={frame} />` is exactly
 *  E2; pass `scene` ({ ...E2, nobles: ... } or a lerpScene) to develop it.
 *  Draws in world px under `cam`: nobles, emperor, strings M, strings C, hand.
 *  Taut live strings carry the travelling highlight (driven by `frame`) unless
 *  a string sets `highlight` itself (null = none). */
export const Tableau: React.FC<{ state?: StateName; scene?: Scene; cam: Cam; frame?: number; uid?: string }> = ({ state = "E1", scene, cam, frame = 0, uid = "tb" }) => {
  const sc = scene ?? STATES[state];
  const st = sceneStrings(sc);
  const k = cam.k;
  const cs: [StringState | null, StringGeom | null][] = [
    [sc.stringsC.head, st.c.head],
    [sc.stringsC.wristL, st.c.wristL],
    [sc.stringsC.wristR, st.c.wristR],
  ];
  return (
    <WorldSvg cam={cam}>
      {sc.nobles.map((n, i) => (n.tone > 0.003 ? <Noble key={i} i={i} bow={n.bow} tone={n.tone} uid={`${uid}-n${i}`} /> : null))}
      {sc.emperorTone > 0.003 ? <Emperor pose={sc.emperor} variant={sc.variant} tone={sc.emperorTone} uid={`${uid}-e`} /> : null}
      {sc.stringsM.map((s, i) => (
        <PuppetString key={i} {...st.m[i]} base={s.base} live={s.live} drawn={s.drawn} knots={s.knots} highlight={autoGlint(s, frame, i)} k={k} />
      ))}
      {sc.hand.show > 0.003
        ? cs.map(([s, g], i) => (s && g ? <PuppetString key={i} {...g} base={s.base} live={s.live} drawn={s.drawn} knots={s.knots} highlight={autoGlint(s, frame, 7 + i)} k={k} /> : null))
        : null}
      {sc.hand.show > 0.003 ? <CaptorHand bar={sc.hand.bar} tilt={sc.hand.tilt} at={st.handAt} tone={sc.hand.show} uid={`${uid}-h`} /> : null}
    </WorldSvg>
  );
};
