import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, camEase, clamp01, smoothstep } from "./fieldShared";
import { INK, LABEL_IN, LABEL_RISE_PX, LABEL_TRACKING, STROKE_PX } from "./alignShared";
import {
  battleShadow,
  BattleRow,
  cameraStyle,
  CLOTH_DUR,
  CX,
  CY,
  easeOut,
  FLAG_TOP,
  FlagGlyph,
  kAt,
  K_END,
  labelStyle,
  LABEL_TOP,
  LABEL_SIZE,
  POLE_DUR,
  previewFill,
  schema as cut1Schema,
  SW_WORLD,
  U_FLAG,
  clothWave,
  DURATION as CUT1_DURATION,
} from "./WinAllTheBattles";

// ---------------------------------------------------------------------------
// AchieveTheObjective — cut 2 of the war essay, spoken straight after
// WinAllTheBattles: "…it has to do with whether you achieve the objective for
// which you're fighting the war." Transparent 1080x1920, 24 fps, 72 frames.
//
// JOIN: f0 is cut 1's f47 pixel for pixel — the same BattleRow code at cut-1
// frame 47 + f, the same cameraStyle at k = K_END centred on (540, 835).
//
// Every battle is won (orange), but what decides the war is ONE objective:
// bigger, above the battles, and NOT orange. The orange line of wins reaches
// up toward it and stops short — "whether you achieve" is the open gap.
//
// GESTURES — each with the word it serves (onsets are even-pacing estimates):
//   1. f2–14   "it has to do with"  the row (swords, flags, label) recedes to
//                                   the context rung 0.65 — one eased fade, a
//                                   recede not an exit; the flags keep waving.
//   2. f12–44  "whether you achieve" ONE orange line grows straight out of
//                                   the middle flag — its round cap sits on
//                                   the top of flag 2's cloth on x = 540 and
//                                   rides that cloth's wave. The wins are what
//                                   reach. The camera
//                                   follows its head: one eased move that
//                                   tilts up and pulls back, k 1.08 → 0.74,
//                                   landing f44. Head stays ~y 640–660 on
//                                   screen the whole way, so the objective
//                                   comes down into frame from above.
//   3. f30–46  "the objective"      a white ring draws on as ONE stroke from
//                                   its bottom (the point the line aims at),
//                                   clockwise all the way round, f30–42; a big white Lucide
//                                   flag inside plants — pole f34–39, cloth
//                                   unfurls f38–44 (same scaleX unfurl as the
//                                   battle flags); THE OBJECTIVE slides up +
//                                   fades in above the ring, f36–46.
//   4. f36–44  (stop short)         the line's head decelerates into its stop
//                                   40 screen px under the ring. Gap open.
//   5. f46–71  "for which you're fighting the war" — hold, never static:
//                                   the camera creeps ~1.6% in (f40 on), the
//                                   objective's cloth keeps a hashed ≤2 px
//                                   wave, the line's head reaches ≤8 px toward
//                                   the gap and eases back (f48–70). It never
//                                   touches.
//
// Nothing else: no ?, no strike-through, no sparks, no dashes, no ring pulse.
//
// Strokes are constant in SCREEN px (STROKE_PX) for everything new. The row
// carries cut 1's weight at the join (6.5 × K_END / K_MID ≈ 6.7) and eases to
// exactly STROKE_PX over the pull-back, so the whole frame lands on one weight.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 72;

export const schema = cut1Schema;
export const defaultProps = schema.parse({ previewBg: "none" });

// --- Camera -----------------------------------------------------------------
const MOVE_F0 = 12;
const MOVE_F1 = 44;
const MOVE_WARP = 0.85;
const K1 = 0.74;
const CREEP = 0.02; // ~1.6% reached by f71, still moving
const CREEP_F0 = 40;
const CREEP_SPAN = 44;
const moveG = (f: number) => camEase((f - MOVE_F0) / (MOVE_F1 - MOVE_F0), MOVE_WARP);

// Final framing, screen px at K1 (before the creep):
const LABEL_INK_BOT_WORLD = LABEL_TOP + 0.845 * LABEL_SIZE; // Roboto caps baseline
const LABEL_BOT_SCREEN = 1135; // captions live below 1150
const C1 = LABEL_INK_BOT_WORLD - (LABEL_BOT_SCREEN - CY) / K1; // camera world y at rest
const RING_SCREEN_Y = 560;
const RING_R_SCREEN = 130;
const GAP_SCREEN = 40 + STROKE_PX; // 40 px INK to ink: cap + ring stroke each take half a stroke

// --- The objective (world px) ------------------------------------------------
const RING_CY = C1 + (RING_SCREEN_Y - CY) / K1;
const RING_R = RING_R_SCREEN / K1;
const HEAD_Y = RING_CY + RING_R + GAP_SCREEN / K1; // where the line stops (y down: below the ring)
// The line grows out of flag 2's cloth: on x 540 = the flag's unit x 12, where
// Lucide's top edge (the C from (8,2) to (15.333,4)) passes y 3.0. The base
// rides the cloth's own wave (the same clothWave BattleRow draws flag 2 with),
// so cap and cloth never part.
const FLAG2 = 2;
const CLOTH_X_AT_AXIS = 12;
const CLOTH_Y_AT_AXIS = 3.0;
const lineBaseAt = (cut1Frame: number) =>
  FLAG_TOP + (CLOTH_Y_AT_AXIS + clothWave(cut1Frame, FLAG2, 1)(CLOTH_X_AT_AXIS)) * U_FLAG;
const LINE_Y0 = lineBaseAt(CUT1_DURATION - 1); // nominal base, for the head's travel
const BIG_FLAG = 1.25 * RING_R; // 24-grid box; ink 16 x 20 of it
const OBJ_LABEL_SIZE = 68; // ≈ 50 screen px at K1
const OBJ_LABEL_TOP = RING_CY - RING_R - 34 / K1 - 0.845 * OBJ_LABEL_SIZE;

// --- Timing -----------------------------------------------------------------
const RECEDE_F0 = 2;
const RECEDE_F1 = 14;
const RECEDE_TO = 0.65; // survives bright footage
const RING_F0 = 30;
const RING_DUR = 12;
const POLE_F0 = 34;
const CLOTH_F0 = 38;
const OBJ_LABEL_F0 = 36;
const REACH_F0 = 48;
const REACH_DUR = 22;
const REACH_PX = 8;

const camAt = (f: number) => {
  // Camera: cut 1's creep carries on until the move takes over, so the join
  // has no velocity step; the creep-in of the hold rides on top.
  const g = moveG(f);
  const kBase = kAt(CUT1_DURATION - 1 + f);
  const creep = 1 + CREEP * camEase((f - CREEP_F0) / CREEP_SPAN, 1);
  const k = (kBase + (K1 - kBase) * g) * creep;
  const cy = CY + (C1 - CY) * g;
  return { g, k, cy };
};

const AchieveTheObjective: React.FC<z.infer<typeof schema>> = ({ previewBg }) => {
  const frame = useCurrentFrame();
  const { g, k, cy } = camAt(frame);
  const shadow = battleShadow(k);

  // 1. recede
  const rowOpacity = 1 - (1 - RECEDE_TO) * smoothstep((frame - RECEDE_F0) / (RECEDE_F1 - RECEDE_F0));
  // Row stroke: cut 1's screen weight at the join, exactly STROKE_PX at rest.
  const rowScreenSW = SW_WORLD * K_END + (STROKE_PX - SW_WORLD * K_END) * g;
  const strokeScale = rowScreenSW / (SW_WORLD * k);

  // 2 + 4 + 5. the line
  const sw = STROKE_PX / k; // world px that read as STROKE_PX on screen
  const u = (frame - REACH_F0) / REACH_DUR;
  const reach = u > 0 && u < 1 ? REACH_PX * Math.pow(Math.sin(Math.PI * u), 2) : 0;
  const headY = LINE_Y0 + (HEAD_Y - LINE_Y0) * g - reach / k;
  const lineOn = clamp01((frame - MOVE_F0) / 2);
  const lineBase = lineBaseAt(CUT1_DURATION - 1 + frame);

  // 3. the objective
  const tRing = easeOut((frame - RING_F0) / RING_DUR);
  const tPole = easeOut((frame - POLE_F0) / POLE_DUR);
  const tCloth = easeOut((frame - CLOTH_F0) / CLOTH_DUR);
  const w = clothWave(frame, 11, tCloth, 0.24);
  const tLabel = easeOut((frame - OBJ_LABEL_F0) / LABEL_IN);
  const circ = 2 * Math.PI * RING_R;

  return (
    <AbsoluteFill style={{ backgroundColor: previewFill(previewBg) }}>
      <AbsoluteFill style={cameraStyle(k, cy)}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: rowOpacity < 1 ? rowOpacity : undefined,
          }}
        >
          <BattleRow frame={CUT1_DURATION - 1 + frame} k={k} strokeScale={strokeScale} />
        </div>

        {frame >= MOVE_F0 ? (
          <svg
            viewBox="0 -600 1080 1800"
            width={1080}
            height={1800}
            style={{ position: "absolute", left: 0, top: -600, overflow: "visible", filter: shadow }}
            fill="none"
            strokeWidth={sw}
            strokeLinecap="round"
          >
            <line x1={CX} y1={lineBase} x2={CX} y2={headY} stroke={ACCENT} opacity={lineOn} />
            {tRing > 0 ? (
              // One stroke from the bottom, clockwise on screen (sweep 1):
              // bottom → left → top → right → bottom.
              <path
                d={`M${CX} ${RING_CY + RING_R} A${RING_R} ${RING_R} 0 0 1 ${CX} ${RING_CY - RING_R} A${RING_R} ${RING_R} 0 0 1 ${CX} ${RING_CY + RING_R}`}
                stroke={INK}
                strokeDasharray={`${(circ * tRing).toFixed(2)} ${(circ * 2).toFixed(2)}`}
              />
            ) : null}
          </svg>
        ) : null}

        <FlagGlyph
          left={CX - BIG_FLAG / 2}
          top={RING_CY - BIG_FLAG / 2}
          size={BIG_FLAG}
          color={INK}
          sw={sw}
          tPole={tPole}
          tCloth={tCloth}
          w={w}
          filter={shadow}
        />

        {tLabel > 0 ? <ObjectiveLabel k={k} t={tLabel} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ObjectiveLabel: React.FC<{ k: number; t: number }> = ({ k, t }) => (
  <div
    style={{
      ...labelStyle(k, OBJ_LABEL_SIZE),
      top: OBJ_LABEL_TOP + (LABEL_RISE_PX / k) * (1 - t),
      opacity: t,
    }}
  >
    <span style={{ marginRight: `-${LABEL_TRACKING}` }}>The objective</span>
  </div>
);

export default AchieveTheObjective;
