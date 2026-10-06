// ---------------------------------------------------------------------------
// GarrottedToDeath (71_GarrottedToDeath; cut I of the "strings" set). Dwarkesh
// Patel with Si Sheppard, "Why captured emperors cooperated". He = ATAHUALPA,
// held by Pizarro at Cajamarca.
//   "(perhaps he actually felt that this was a man of his word.) But Pizarro,
//    in no case, was, and had him garrotted to death after getting what he
//    wanted."
// Dwarkesh map style, "beyond maps" page; the world is stringsShared.tsx and
// the ransom room of FillThatRoom.tsx (both used as-is, neither edited).
// Opaque 1080x1920, 24 fps, 105 frames. In-point 71.321 s.
// OPENS exactly on FillThatRoom's END STATE (ransomStateAt / ransomCamAt at
// RANSOM_END_FRAME; its sway simply goes on).
//
// WORD -> LOCAL FRAME
//   [But -2 · Pizarro -2..8] · in 9 · NO 12 · CASE 14-21 · WAS 32 · and 39 ·
//   had 44 · him 48 · GARROTTED 56-63 · to 61 · DEATH 67-73 · after 73 ·
//   GETTING 78 · what 82 · he 84 · WANTED 84-90 · [So 90]; the cut ends f103
//   (f103-104 = safety tail).
//
// GESTURES (each with the words it serves; nothing else)
//   1. f0-f38 "But Pizarro, in NO CASE, WAS": the promise is withdrawn. The
//      gauntlet's fingers close hard on the bar again (f6-f14, the bar's 6 px
//      dip taken back) and the three slack orange strings snap taut one after
//      another from the bar downward (head f10, left f13, right f16; each 6 f),
//      jerking him onto his toes (f14-f20) and his forearms up (f17-f23,
//      f20-f26). Taut hold to f38, a highlight running down each string.
//      "PIZARRO" at 1.0 from f0, to the 0.55 rung f26-f40.
//   2. f39-f76 "and had him GARROTTED to DEATH": the head string's lower end
//      slips from the crown of his head down to a plain loop of the same
//      orange string at his neck (f39-f50); the bar turns in the fixed
//      gauntlet (f50-f62: it foreshortens, the two forearm strings come in
//      with its ends) and the loop draws tight. On "death" (f66-f76) he goes
//      limp, hanging from the strings: head forward, arms down, knees gone;
//      eased, no bounce. Camera: ONE slow push toward him and the strings
//      (k 0.95 -> 1.2, f28-f72).
//   3. f73-end "after GETTING what he WANTED": the orange drains out of the
//      three strings from the bar downward (dead-cream fronts, f73 / f75.5 /
//      f78, 8 f each), they go slack, and his body sinks to the floor in front
//      of the heap (f77-f96), dimming to 0.55. The camera eases back and
//      settles on the gold (f70-f98): the whole room, the heap at 1.0, his
//      chalk line still level with its top. The gauntlet stays, closed, above
//      it (to 0.72, so the heap is the brightest thing). Hold: a creep toward
//      the heap (< 2 %) and a faint sway in the dead strings.
//
// ACCENT: orange = the live hold only (three strings and the loop, until they
// drain). RESTRAINT: no face in agony (the eyes close as the head bows, as in
// PsychologicalBreak), no close-up of the neck, no noose or knot: the mechanism
// is the string.
//
// HISTORY (nothing of it on screen but the picture): Atahualpa was garrotted in
// the plaza of Cajamarca on 26 July 1533, after the ransom had been collected
// and melted down. Sources: Pedro Pizarro, Relacion (1571); Francisco de Xerez,
// Verdadera relacion (1534); Hemming, The Conquest of the Incas (1970), ch. 4.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, CAPTION_TOP, DARK, INK, LAND, camFor, clamp01, makeTrack, mixColor, screenOf, smootherstep, smoothstep } from "./incaShared";
import {
  CaptorHand,
  EMPEROR_AT,
  Emperor,
  HAND_AT,
  HEAD_SCALE,
  Label,
  PuppetString,
  STRING_W,
  StringsPage,
  TONE,
  WorldSvg,
  add,
  emperorRig,
  lerpPose,
  mix,
  mix2,
  rot,
  type Cam,
  type EmperorPose,
  type P2,
  type StringGeom,
} from "./stringsShared";
import { ChalkLine, Heap, LINE_Y, RANSOM_END_FRAME, RANSOM_LABEL, ROOM, ROOM_CX, RansomHand, Room, ransomCamAt, ransomStateAt, ransomStrings } from "./FillThatRoom";

export const FPS = 24;
export const DURATION = 105;
const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  /** how far the bar turns in the gauntlet, deg (90 = end-on, hidden in the fist) */
  turn: z.number().min(0).max(90),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, turn: 62 });

// ---------------------------------------------------------------------------
// TIMELINE
// ---------------------------------------------------------------------------
const T = {
  grip: [6, 14] as [number, number],
  /** the strings snap taut: head, left forearm, right forearm */
  snap: [10, 13, 16],
  labelDim: [26, 40] as [number, number],
  slip: [39, 50] as [number, number],
  twist: [50, 62] as [number, number],
  death: 66,
  /** the orange drains from the bar down: head, left, right; frames per string */
  drain: [73, 75.5, 78],
  drainLen: 8,
  sink: [77, 96] as [number, number],
};
/** a jerk: all of it at once, then nothing (no overshoot) */
const jerk = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** a weighty fall: slow off the mark, firm landing, no bounce */
const fall = (t: number) => smootherstep(Math.pow(clamp01(t), 1.25));

// ---------------------------------------------------------------------------
// THE CAMERA: one C1 track of velocity bumps, starting exactly on the previous
// cut's last camera. Focus = the world point held at screen (540, 835).
// ---------------------------------------------------------------------------
const CAM0 = ransomCamAt(RANSOM_END_FRAME);
const FOCUS0: P2 = [CAM0.cx, CAM0.cy + (835 - 960) / CAM0.k];
const K_PUSH = 1.2;
const K_END = 1.05;
const PUSH: [number, number] = [28, 72];
const BACK: [number, number] = [70, 98];
const PUSH_AT: P2 = [596, 512];
const END_AT: P2 = [ROOM_CX, 578];
const LNK = makeTrack(
  [
    [-40, 40, Math.log(1.012), 0.3],
    [PUSH[0], PUSH[1], Math.log(K_PUSH / (CAM0.k * 1.006)), 0.9],
    [BACK[0], BACK[1], Math.log(K_END / K_PUSH), 0.9],
    [90, 200, Math.log(1.06), 0.3],
  ],
  Math.log(CAM0.k),
);
const WX = makeTrack(
  [
    [PUSH[0], PUSH[1], PUSH_AT[0] - FOCUS0[0], 0.9],
    [BACK[0], BACK[1], END_AT[0] - PUSH_AT[0], 0.9],
  ],
  FOCUS0[0],
);
const WY = makeTrack(
  [
    [PUSH[0], PUSH[1], PUSH_AT[1] - FOCUS0[1], 0.9],
    [BACK[0], BACK[1], END_AT[1] - PUSH_AT[1], 0.9],
    [90, 200, 14, 0.3],
  ],
  FOCUS0[1],
);
export const camAt = (f: number): Cam => (f <= 0 ? CAM0 : camFor([WX(f), WY(f)], Math.exp(LNK(f))));

// ---------------------------------------------------------------------------
// ATAHUALPA
// ---------------------------------------------------------------------------
/** jerked upright by three taut strings: on his toes, the forearms pulled up */
const POSE_TAUT: EmperorPose = { head: 0, nod: 0, slump: 0, lean: 0, wristL: [-90, -196], wristR: [90, -196], fistL: 0.7, fistR: 0.7, hang: 10, limp: 0.8 };
/** limp, hanging from them */
const POSE_DEAD: EmperorPose = { head: 31, nod: 1, slump: 1.3, lean: 5, wristL: [-60, -140], wristR: [70, -136], fistL: 0, fistR: 0, hang: 4, limp: 1 };
/** on the floor: the arms fallen in against the body */
const POSE_DOWN: EmperorPose = { ...POSE_DEAD, head: 26, lean: 2, wristL: [-46, -136], wristR: [50, -134], hang: 0 };

const poseAt = (f: number): EmperorPose => {
  const rest = ransomStateAt(RANSOM_END_FRAME + f).pose;
  const up = jerk((f - 14) / 6);
  const upL = jerk((f - 17) / 6);
  const upR = jerk((f - 20) / 6);
  const settle = smoothstep((f - 6) / 12);
  const wind = smootherstep((f - T.twist[0] - 2) / (T.twist[1] - T.twist[0] - 2));
  const taut: EmperorPose = {
    ...rest,
    head: rest.head * (1 - settle),
    hang: POSE_TAUT.hang * up + 3 * wind,
    wristL: mix2(rest.wristL, POSE_TAUT.wristL, upL),
    wristR: mix2(rest.wristR, POSE_TAUT.wristR, upR),
    fistL: mix(rest.fistL, POSE_TAUT.fistL, upL),
    fistR: mix(rest.fistR, POSE_TAUT.fistR, upR),
    limp: POSE_TAUT.limp * Math.min(upL, upR),
  };
  if (f <= T.death) return taut;
  const d = T.death;
  const b = POSE_DEAD;
  const tH = fall((f - d) / 9);
  const tS = fall((f - d - 1) / 9);
  const tL = fall((f - d - 1) / 10);
  const tR = fall((f - d - 2) / 10);
  const dead: EmperorPose = {
    head: mix(taut.head, b.head, tH),
    nod: mix(taut.nod, b.nod, tH),
    slump: mix(taut.slump, b.slump, tS),
    lean: mix(taut.lean, b.lean, tS),
    wristL: mix2(taut.wristL, b.wristL, tL),
    wristR: mix2(taut.wristR, b.wristR, tR),
    fistL: mix(taut.fistL, b.fistL, tL),
    fistR: mix(taut.fistR, b.fistR, tR),
    hang: mix(taut.hang, b.hang, tS),
    limp: mix(taut.limp, b.limp, Math.min(tL, tR)),
  };
  const s = smootherstep((f - T.sink[0]) / (T.sink[1] - T.sink[0] - 4));
  return s <= 0 ? dead : lerpPose(dead, POSE_DOWN, s);
};

/** the body's fall: it turns over its feet (the pivot) and comes to lie along the floor, toward the room */
const LIE_DEG = 87;
const LIE_HALF = 56; // half his width: what he lies on
const bodyAt = (f: number) => {
  const t = fall((f - T.sink[0]) / (T.sink[1] - T.sink[0]));
  const deg = LIE_DEG * t;
  const dy = -LIE_HALF * Math.sin((deg * Math.PI) / 180);
  const dx = 26 * t;
  return {
    deg,
    dx,
    dy,
    tone: mix(1, TONE.second, smoothstep((f - T.sink[0] - 5) / (T.sink[1] - T.sink[0] - 5))),
    /** figure-local point -> WORLD */
    world: (p: P2): P2 => add(add(EMPEROR_AT, rot(p, deg)), [dx, dy]),
    transform: `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${deg.toFixed(2)} ${EMPEROR_AT[0]} ${EMPEROR_AT[1]})`,
  };
};

// ---------------------------------------------------------------------------
// THE STRINGS: bar (s = 0) -> crown / neck, the two forearms (s = 1)
// ---------------------------------------------------------------------------
type Which = "head" | "wristL" | "wristR";
const WHICH: Which[] = ["head", "wristL", "wristR"];
const TIE = 0.42;
const DEAD_SLACK: Record<Which, number> = { head: 0.5, wristL: 0.62, wristR: 0.44 };
const DEAD_SIDE: Record<Which, number> = { head: -1.2, wristL: -1.6, wristR: -0.8 };
type Str = StringGeom & { base: number; live: [number, number] | null; highlight: number | null };
const stringsAt = (f: number, pose: EmperorPose, turnDeg: number) => {
  const base = ransomStateAt(RANSOM_END_FRAME + f);
  const loose = base.loose * (1 - smootherstep((f - T.grip[0]) / (T.grip[1] - T.grip[0])));
  const dip = base.dip * (loose / Math.max(1e-6, base.loose));
  const body = bodyAt(f);
  const rig = emperorRig(pose, "inca");
  const slip = smootherstep((f - T.slip[0]) / (T.slip[1] - T.slip[0]));
  const tw = smootherstep((f - T.twist[0]) / (T.twist[1] - T.twist[0]));
  /** the bar's apparent half-length as it turns about the vertical axis (1 = square on) */
  const barC = Math.cos((turnDeg * tw * Math.PI) / 180);
  const g0 = ransomStrings({ ...base, pose, dip });
  const nape: P2 = [rig.neck[0], rig.neck[1] - 2];
  const to: Record<Which, P2> = {
    head: body.world(mix2(rig.headTop, nape, slip)),
    wristL: body.world(mix2(rig.armL.E, rig.armL.W, TIE)),
    wristR: body.world(mix2(rig.armR.E, rig.armR.W, TIE)),
  };
  const out = {} as Record<Which, Str>;
  WHICH.forEach((w, i) => {
    const b = base.strings[w];
    const s0 = smootherstep((f - T.snap[i]) / 4);
    const s1 = smootherstep((f - T.snap[i] - 2) / 4);
    const t0 = T.drain[i];
    const p = clamp01((f - t0) / T.drainLen);
    const a = smootherstep((f - t0 - 2) / 12);
    const c = smootherstep((f - t0 - 6) / 14);
    const dead = f >= t0;
    const taut = s1 >= 1 && !dead;
    const sway = smoothstep((f - t0 - 8) / 12);
    const from = g0[w].from;
    // one highlight at a time down each taut string (every 24 f, the strings 3 f apart)
    const u = (f - 22 - 3 * i) / 24;
    out[w] = {
      from: [HAND_AT[0] + (from[0] - HAND_AT[0]) * barC, from[1]],
      to: to[w],
      slack: dead ? [DEAD_SLACK[w] * a, DEAD_SLACK[w] * c] : [b.slack[0] * (1 - s0), b.slack[1] * (1 - s1)],
      sag: dead ? 0.3 * (1 + 0.08 * sway * Math.sin(f / 9 + i * 1.7)) : b.sag,
      side: dead ? DEAD_SIDE[w] * (1 + 0.3 * sway * Math.sin(f / 8 + i * 2.3)) : b.side,
      base: dead ? TONE.dead : b.base,
      live: p >= 1 ? null : [p, 1],
      highlight: taut && u >= 0 ? (u % 1) * 1.4 - 0.2 : null,
    };
  });
  return { strings: out, loose, dip, barC, slip, tw, rig, body, base, headDead: f >= T.drain[0] + T.drainLen };
};

/** the face's outline in head-local units (stringsFigures' FACE; it is not exported): what hides the loop when the head falls */
const FACE = "M0,-24C-15,-24 -19.5,-12 -19.5,0C-19.5,11 -12,24 0,26.4C12,24 19.5,11 19.5,0C19.5,-12 15,-24 0,-24Z";

// ---------------------------------------------------------------------------
// CHECKS (module scope: a broken layout fails before a frame is rendered)
// ---------------------------------------------------------------------------
(() => {
  for (let f = 0; f < DURATION; f++) {
    const cam = camAt(f);
    // he and the floor stay above the caption band
    const fy = screenOf([EMPEROR_AT[0], ROOM.floorY + 4], cam)[1];
    if (fy >= CAPTION_TOP + 2) throw new Error(`GarrottedToDeath: the floor in the caption band at f${f} (y ${fy.toFixed(0)})`);
    // the top of the heap is always in frame
    const ty = screenOf([ROOM_CX, LINE_Y], cam)[1];
    if (ty < 200 || ty > CAPTION_TOP - 250) throw new Error(`GarrottedToDeath: the heap's top at screen y ${ty.toFixed(0)} at f${f}`);
    // the gauntlet's fist and the label stay in frame
    const [lx, ly] = screenOf([RANSOM_LABEL.x, RANSOM_LABEL.y], cam);
    if (lx - 170 < 30 || lx + 170 > 1050 || ly < 110) throw new Error(`GarrottedToDeath: the label leaves the frame at f${f} (${lx.toFixed(0)}, ${ly.toFixed(0)})`);
    if (f >= BACK[1]) {
      const xl = screenOf([ROOM.x0 - ROOM.wall - ROOM.batter, 0], cam)[0];
      const xr = screenOf([ROOM.x1 + ROOM.wall + ROOM.batter, 0], cam)[0];
      if (xl < 40 || xr > 1040) throw new Error(`GarrottedToDeath: a wall within 40 px of the edge at f${f} (${xl.toFixed(0)}, ${xr.toFixed(0)})`);
    }
  }
  const creep = camAt(LAST).k / camAt(BACK[1]).k;
  if (creep > 1.02 || creep <= 1) throw new Error(`GarrottedToDeath: the end creep is ${((creep - 1) * 100).toFixed(2)} %`);
})();

const GarrottedToDeath: React.FC<Props> = ({ vignette, turn }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const pose = poseAt(frame);
  const S = stringsAt(frame, pose, turn);
  const { strings, body, rig, base } = S;
  const w = STRING_W / k;

  // the loop: from the crown, over the head, to the neck; then drawn tight by the turn of the bar
  const tight = smootherstep((frame - T.twist[0] - 2) / (T.twist[1] - T.twist[0] - 2));
  const loopC = mix2(rig.headTop, [rig.neck[0], rig.neck[1] + 6], S.slip);
  const loopRx = mix(3, 13.5, S.slip) + 19 * Math.sin(Math.PI * S.slip) - 3.5 * tight;
  const loopRy = mix(1.5, 4.2, S.slip) + 3 * Math.sin(Math.PI * S.slip) - 1 * tight;
  const showLoop = frame > T.slip[0];

  const handTone = mix(1, 0.72, smoothstep((frame - 80) / 16));
  const labelOp = mix(1, TONE.second, smoothstep((frame - T.labelDim[0]) / (T.labelDim[1] - T.labelDim[0])));
  const levelY = ROOM.floorY - base.fill * (ROOM.floorY - LINE_Y);

  const str = (wh: Which) => {
    const s = strings[wh];
    return <PuppetString key={wh} from={s.from} to={s.to} slack={s.slack} sag={s.sag} side={s.side} base={s.base} live={s.live} highlight={s.highlight} k={k} />;
  };

  return (
    <StringsPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <Room draw={base.room} uid="gtd-room" />
        <Heap fill={base.fill} uid="gtd-heap" />
        {/* FillThatRoom's legibility block (his silhouette in the page colour between heap and figure: a 7 px casing + the heap
            down to 0.72 in a soft margin), with the filter's region widened so it goes down to the floor with him */}
        <filter id="gtd-soft" filterUnits="userSpaceOnUse" x={EMPEROR_AT[0] - 240} y={EMPEROR_AT[1] - 460} width={800} height={520}>
          <feMorphology in="SourceAlpha" operator="dilate" radius={30} result="wide" />
          <feGaussianBlur in="wide" stdDeviation={9} result="margin" />
          <feFlood floodColor={LAND} floodOpacity={0.28} />
          <feComposite in2="margin" operator="in" result="dimmed" />
          <feMorphology in="SourceAlpha" operator="dilate" radius={6.5} result="near" />
          <feGaussianBlur in="near" stdDeviation={0.7} result="edge" />
          <feFlood floodColor={mixColor(LAND, DARK, 0.25)} floodOpacity={1} />
          <feComposite in2="edge" operator="in" result="casing" />
          <feMerge>
            <feMergeNode in="dimmed" />
            <feMergeNode in="casing" />
          </feMerge>
        </filter>
        <clipPath id="gtd-lvl">
          <rect x={ROOM.x0} y={levelY} width={ROOM.x1 - ROOM.x0} height={ROOM.floorY - levelY + 12} />
        </clipPath>
        <g clipPath="url(#gtd-lvl)" opacity={Math.min(1, base.dim / 0.5)}>
          <g filter="url(#gtd-soft)">
            <g transform={body.transform}>
              <Emperor pose={pose} variant="inca" tone={1} uid="gtd-ec" />
            </g>
          </g>
        </g>
        <ChalkLine p={base.line} k={k} />
        {/* once it has slipped to his neck the head string comes down BEHIND his head */}
        {frame >= T.slip[0] ? str("head") : null}
        <g transform={body.transform} opacity={body.tone}>
          <Emperor pose={pose} variant="inca" tone={1} uid="gtd-e" />
          {showLoop ? (
            <g transform={`translate(${EMPEROR_AT[0]} ${EMPEROR_AT[1]})`}>
              <clipPath id="gtd-face">
                <path
                  d={`M-4000,-4000H4000V4000H-4000Z${FACE}`}
                  clipRule="evenodd"
                  transform={`translate(${rig.headC[0].toFixed(2)} ${rig.headC[1].toFixed(2)}) rotate(${rig.headAngle.toFixed(2)}) scale(${HEAD_SCALE})`}
                />
              </clipPath>
              <g clipPath={frame >= T.twist[1] - 4 ? "url(#gtd-face)" : undefined} fill="none">
                <ellipse cx={loopC[0]} cy={loopC[1]} rx={loopRx} ry={loopRy} stroke={DARK} strokeOpacity={0.5} strokeWidth={w + 2.6 / k} />
                {S.headDead ? (
                  <ellipse cx={loopC[0]} cy={loopC[1]} rx={loopRx} ry={loopRy} stroke={INK} strokeOpacity={TONE.dead} strokeWidth={w} />
                ) : (
                  <>
                    <ellipse cx={loopC[0]} cy={loopC[1]} rx={loopRx} ry={loopRy} stroke={ACCENT_DEEP} strokeWidth={w * 1.5} />
                    <ellipse cx={loopC[0]} cy={loopC[1]} rx={loopRx} ry={loopRy} stroke={ACCENT} strokeWidth={w * 0.92} />
                  </>
                )}
              </g>
            </g>
          ) : null}
        </g>
        {frame < T.slip[0] ? str("head") : null}
        {str("wristL")}
        {str("wristR")}
        {S.loose > 0 ? (
          <RansomHand loose={S.loose} dip={S.dip} uid="gtd-hand" />
        ) : (
          // the shared hand, its bar drawn apart so it can foreshorten as it turns in the fist
          <g opacity={handTone}>
            <clipPath id="gtd-bar">
              <rect x={HAND_AT[0] - 187} y={HAND_AT[1] + 0.5} width={374} height={27} />
            </clipPath>
            <g transform={`translate(${HAND_AT[0]} 0) scale(${S.barC.toFixed(4)} 1) translate(${-HAND_AT[0]} 0)`}>
              <g clipPath="url(#gtd-bar)">
                <CaptorHand bar={1} tilt={0} uid="gtd-hb" />
              </g>
            </g>
            <CaptorHand bar={0} tilt={0} uid="gtd-hh" />
          </g>
        )}
      </WorldSvg>
      <Label text={RANSOM_LABEL.text} x={RANSOM_LABEL.x} y={RANSOM_LABEL.y} cam={cam} frame={frame} f0={-100} size={RANSOM_LABEL.size} opacity={labelOp} />
    </StringsPage>
  );
};

export default GarrottedToDeath;
