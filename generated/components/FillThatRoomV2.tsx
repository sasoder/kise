// ---------------------------------------------------------------------------
// FillThatRoomV2 (60_FillThatRoom, the REBUILD). Dwarkesh Patel with Si
// Sheppard, "Why captured emperors cooperated". He = ATAHUALPA, captive of
// Pizarro at Cajamarca, 1532-33:
//   "if he provided - and he walked into that room and said, I can fill it up
//    this high with gold and silver, and Pizarro would promise to [release
//    him] at that point"
// Dwarkesh map style, "beyond maps" page. Opaque 1080x1920, 24 fps, 190 f.
// THE ROOM IS THE FRAME: the back wall of the Ransom Room is the page (world
// space; ransomV2Shared). In-point 60.394 s.
//
// WORD -> LOCAL FRAME
//   if 4 · provided 7-17 · and 31 · he 33 · walked 36 · into 41 · that 44 ·
//   ROOM 48-56 · said 63 · I 67 · can 69 · FILL 71 · it up 79 · THIS 89 ·
//   HIGH 96-103 · with 103 · GOLD 113 · and 123 · SILVER 130-138 · and 139 ·
//   PIZARRO 140 · would 152 · PROMISE 153 · to 161 · RELEASED 163-174 · at 174 ·
//   that 178 · POINT 178-185; the cut ends f188.
//
// GESTURES (each with the words it serves; nothing else)
//   1. f0-f30 "if he provided": a close framing on Atahualpa, waist up, the
//      three orange strings rising from his head and forearms; the camera is
//      already easing back on f0; the ashlar wall fills the frame behind him.
//   2. f31-f56 "and he walked into that ROOM": the pull-back completes to the
//      MAIN framing on "room" (he stands full length, ~520 px, left of centre,
//      the floor at screen y 1130, the wall and its two niches everywhere); as
//      the frame opens (f42-f55) he turns his head and takes one step toward
//      the wall face beside him.
//   3. f63-f103 "I can FILL it up THIS HIGH": he reaches: up on his toes, the
//      whole body lengthened, the right arm at full stretch (its string pays
//      out and stays orange), fingertips on the wall on "this" (f88). On "high"
//      (f91-f103) he draws the line: chalk, level, across the whole width of
//      the wall, head-led, both ways from his hand. He comes down (f104-f118);
//      the line stays.
//   4. f103-f137 "with GOLD and SILVER": the bank rises from the floor to the
//      line, four courses, each a staggered row (every piece slides up 30 px
//      and settles), each course coming up behind the one before; the last
//      course's tops lie just under the chalk line on "silver", never above it.
//      Atahualpa stands in front, cased in dark; the pieces behind him step
//      down to the 0.55 ink.
//   5. f112-f172 "and PIZARRO would PROMISE to RELEASE him": one glide up the
//      three strings (it starts under the rising bank: the camera follows the
//      bank's top, then goes on up) to the gauntlet and the bar; "PIZARRO"
//      slides up beside the cuff as it comes into the frame. On "promise ...
//      released" (f153-f171) the hold loosens: the fingers open halfway round
//      the bar, the bar dips 14 px, the three orange strings sag one after
//      another into deep slack. They stay orange and attached: promised, not
//      done. Complete by f172.
//   6. f172-f189 the living hold on that picture (the slack strings sway, the
//      camera creeps < 1 %).
//
// HISTORY (nothing of it on screen): Atahualpa offered to fill the room once
// with gold to a line as high as he could reach, and twice over with silver,
// for his freedom; Pizarro agreed (and had the promise written down).
// Sources: Francisco de Xerez, Verdadera relacion (1534); Hemming, The
// Conquest of the Incas (1970), ch. 2-3. Looked at for the drawing: the
// Cuarto del Rescate at Cajamarca (coursed Inca ashlar, trapezoidal openings),
// the Met's Inca gold figurine, de Bry's 1596 plates of the ransom.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAPTION_TOP, camScan, clamp01, makeTrack, screenOf, smootherstep, smoothstep, swayCam, type Cam } from "./incaShared";
import { lerpPose, mix, type EmperorPose } from "./stringsShared";
import {
  BANK,
  BANK_ROWS,
  CAM_RANSOM_END,
  CAM_RANSOM_MAIN,
  END_DIP,
  END_GRIP,
  PIECES,
  PIZARRO,
  PIZARRO_F0,
  POSE_REACH,
  POSE_REST,
  PizarroLabel,
  ROOM,
  ROW_COUNT,
  RansomPage,
  RansomTableau,
  endCreep,
  ransomEndCam,
  ransomEndScene,
  type BankPiece,
  type HoldString,
  type RansomScene,
} from "./ransomV2Shared";

export const FPS = 24;
export const DURATION = 190;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---- the timeline ----------------------------------------------------------
const T = {
  step: [42, 55] as [number, number],
  reach: [63, 88] as [number, number],
  line: [91, 103] as [number, number],
  down: [104, 118] as [number, number],
  /** the bank: the first course starts here; a course every `every` f; a piece every `stagger` f; each takes `piece` f */
  bank: { f0: 103, every: 6.9, stagger: 0.62, piece: 6.5 },
  glide: [112, 172] as [number, number],
  /** the hold loosens: the grip and the bar, then the head string, his left, his right */
  grip: [153, 164] as [number, number],
  sag: [
    [153, 165],
    [156, 168],
    [159, 171],
  ] as [number, number][],
  done: 172,
};
const span = (f: number, [a, b]: [number, number]) => (f - a) / (b - a);
/** he stands here before the step (world x) */
const START_X = 400;

/** piece i's arrival 0..1: course by course from the floor, each row a staggered sweep (alternating sides) */
const riseAt =
  (f: number) =>
  (p: BankPiece): number => {
    const n = ROW_COUNT[p.row];
    const order = p.row % 2 ? n - 1 - p.col : p.col;
    return clamp01((f - (T.bank.f0 + p.row * T.bank.every + order * T.bank.stagger)) / T.bank.piece);
  };
const BANK_DONE = T.bank.f0 + (BANK_ROWS - 1) * T.bank.every + (Math.max(...ROW_COUNT) - 1) * T.bank.stagger + T.bank.piece;

const poseAt = (f: number): EmperorPose => {
  const up = smootherstep(span(f, T.reach)) * (1 - smootherstep(span(f, T.down)));
  const st = span(f, T.step);
  const stepping = st > 0 && st < 1 ? Math.sin(Math.PI * st) : 0;
  const turned = smootherstep((f - 38) / 12) * (1 - smootherstep(span(f, T.down)));
  const p = lerpPose(POSE_REST, POSE_REACH, up);
  // the stroke that draws the line: the hand goes a little along the wall and back
  const stroke = 9 * Math.sin(2 * Math.PI * clamp01(span(f, T.line))) * (1 - smootherstep(span(f, T.down)));
  return {
    ...p,
    head: mix(5 * turned, POSE_REACH.head, up) + 0.7 * Math.sin(f / 23),
    lean: p.lean + 3 * stepping,
    // on his toes only for the last of the reach
    hang: POSE_REACH.hang * smoothstep((f - 74) / 13) * (1 - smootherstep(span(f, T.down))),
    wristR: [p.wristR[0] + stroke, p.wristR[1]],
  };
};
export const sceneAt = (f: number): RansomScene => {
  if (f >= T.done) return ransomEndScene(f);
  const end = ransomEndScene(f);
  const st = smootherstep(span(f, T.step));
  const stp = span(f, T.step);
  const lineP = 1 - Math.pow(1 - clamp01(span(f, T.line)), 2.2);
  const up = smootherstep(span(f, T.reach)) * (1 - smootherstep(span(f, T.down)));
  const loose = smootherstep(span(f, T.grip));
  const str = (e: HoldString, i: number, base = 0): HoldString => {
    const q = smootherstep(span(f, T.sag[i]));
    return { slack: mix(base, e.slack, q), sag: mix(0.17, e.sag ?? 0.17, q), side: e.side };
  };
  return {
    emperor: poseAt(f),
    at: [mix(START_X, ROOM.standX, st), ROOM.floor - (stp > 0 && stp < 1 ? 3.5 * Math.sin(Math.PI * stp) : 0)],
    line: { l: lineP, r: lineP },
    bank: f < T.bank.f0 ? null : f >= BANK_DONE ? "full" : riseAt(f),
    hand: { at: ROOM.hand, grip: mix(1, END_GRIP, loose), dip: END_DIP * loose },
    strings: { head: str(end.strings.head, 0), l: str(end.strings.l, 1), r: str(end.strings.r, 2, 0.1 * up) },
  };
};

// ---- the camera: two glides on one C1 track --------------------------------
/** the close opening: waist up, his chest at screen (540, 835) */
const OPEN: Cam = { k: 3.25, cx: START_X, cy: ROOM.floor - 232 + 125 / 3.25 };
const A: [number, number] = [-16, 54];
/** the part of a raised-cosine bump over A that lies after f 0 */
const A_LEFT = (() => {
  const u = -A[0] / (A[1] - A[0]);
  return 1 - (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI));
})();
const track = (open: number, main: number, end: number) =>
  makeTrack(
    [
      [A[0], A[1], (main - open) / A_LEFT, 1],
      [T.glide[0], T.glide[1], end - main, 1],
    ],
    open,
    -40,
    240,
  );
const CX = track(OPEN.cx, CAM_RANSOM_MAIN.cx, CAM_RANSOM_END.cx);
const CY = track(OPEN.cy, CAM_RANSOM_MAIN.cy, CAM_RANSOM_END.cy);
const LNK = track(Math.log(OPEN.k), Math.log(CAM_RANSOM_MAIN.k), Math.log(CAM_RANSOM_END.k));
const baseCam = (f: number): Cam => ({ k: Math.exp(LNK(f)) * endCreep(f), cx: CX(f), cy: CY(f) });
export const camAt = (f: number): Cam => (f >= T.done ? ransomEndCam(f) : swayCam(baseCam(f), f));

/** where things are on screen (checks, the report) */
export const framing = (f: number) => {
  const cam = camAt(f);
  const sc = sceneAt(f);
  const y = (wy: number) => Math.round(screenOf([540, wy], cam)[1]);
  return { f, k: +cam.k.toFixed(3), floor: y(ROOM.floor), line: y(ROOM.line), feetX: Math.round(screenOf(sc.at, cam)[0]), bar: y(ROOM.hand[1] + 14), cuffTop: y(ROOM.hand[1] - 240), label: screenOf([PIZARRO.x, PIZARRO.y], cam).map(Math.round) };
};
export const scan = () => camScan(baseCam, 0, DURATION - 1, [[ROOM.standX, ROOM.line]]);

// ---- checks (module scope: a broken timeline fails before a frame is rendered)
(() => {
  if (BANK_DONE > 138) throw new Error(`FillThatRoomV2: the bank is complete at f${BANK_DONE.toFixed(1)}, after "silver"`);
  for (const p of BANK) {
    const top = p.y - PIECES[p.kind].h * p.s;
    if (top < ROOM.line + 4) throw new Error(`FillThatRoomV2: a ${p.kind} stands above the chalk line (${top.toFixed(0)} < ${ROOM.line.toFixed(0)})`);
  }
  const end = baseCam(T.done);
  if (Math.abs(end.cx - CAM_RANSOM_END.cx) > 0.5 || Math.abs(end.cy - CAM_RANSOM_END.cy) > 0.5) throw new Error("FillThatRoomV2: the glide does not land on CAM_RANSOM_END");
  const main = baseCam(56);
  if (Math.abs(main.cy - CAM_RANSOM_MAIN.cy) > 0.5 || Math.abs(main.k - CAM_RANSOM_MAIN.k) > 0.004) throw new Error("FillThatRoomV2: the pull-back does not land on CAM_RANSOM_MAIN");
  // the label is inside the frame, above the caption band, from the frame it has landed
  for (let f = PIZARRO_F0 + 14; f < DURATION; f++) {
    const [lx, ly] = screenOf([PIZARRO.x, PIZARRO.y], camAt(f));
    if (ly < 60 || ly > CAPTION_TOP || lx > 1080 - 60 - 150) throw new Error(`FillThatRoomV2: PIZARRO out of place at f${f} (${lx.toFixed(0)}, ${ly.toFixed(0)})`);
  }
})();

const FillThatRoomV2: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <RansomPage cam={cam} vignette={vignette}>
      <RansomTableau scene={sceneAt(frame)} cam={cam} frame={frame} uid="ftr2" />
      <PizarroLabel cam={cam} frame={frame} />
    </RansomPage>
  );
};

export default FillThatRoomV2;
