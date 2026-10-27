// ---------------------------------------------------------------------------
// InstantExpertPortrait (neal-stephenson-trailer, cut 54, 9:16). The portrait twin of InstantExpert (16:9, approved:
// "this one is really great!"). Core Memory podcast style, the clip's ARCHIVE COLLAGE at 9:16: the shelf from
// ./booksWorldPortrait (cut 45 portrait's two rows), the subjects and their spring from ./InstantExpert, paper and film
// life from ./nealPortraitShared. All imported read-only. Opaque 1080x1920, 23.976 fps, 81 frames.
//
// CHECK LINE: "Every one of Neal's books meant mastering a whole new field: cryptography, Newton's science, orbital
// catastrophe, geoengineering."
//
// THE LINE (Neal; on camera just before: "The whole AI revolution sort of blindsided me in a lot of ways."):
//   "…you become an instant expert in whatever you're writing about,"
// WORD -> FRAME (local onset): you ~0 · become 5 · an 12 · instant 17 · expert 24 · in 39 · whatever 48 · you're 54 ·
//   writing 60 · about 67 (ends ~78) · cut 81 (back on camera: "then you walk away from it.").
// DURATION: the slot 54.9299 -> 58.3082 s (sequence frames 1317 -> 1398) = 3.378 s x 23.976 = 81 frames (f0..f80).
//
// THE MOTION: cut 45 portrait's shelf (P_SLOTS: row 0 Snow Crash, The Diamond Age, Cryptonomicon, Quicksilver; row 1
// Anathem, Seveneves, Termination Shock, set as bricks). The 16:9 ripple in reading order: from "become" (f5) each
// book's research subject rises out of the top of its cover on the same damped spring, one every 6 frames, along the
// top row, then along the bottom row (the bottom row's subjects stand in the gap between the rows, under row 0's
// gaps). The camera rides it in one continuous move (camAt54P): it opens close (k 1.28) on the top row in the middle
// of the frame (the bottom row waiting below the caption bands), drifts right with the top row's ripple while
// tilting down the shelf to the bottom row as its ripple starts, and from ~f36 pulls back to the whole shelf, all
// seven up (k ~1.04, landing ~f64), then creeps to f80: a settled, living wide (subjects ride their books' bob,
// film life). Subjects keep their 16:9 size relative to the covers (x P_SCALE). No text, no chain, no Neal.
//
// SOURCES: as InstantExpert (the covers: US first-edition jackets, fair use; the seven subjects and their credits are
// in InstantExpert.tsx's header and <working>/animation_source/refs/ASSETS_READY.md).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { SUBJECTS, popSpring, subjectStart } from "./InstantExpert";
import { LandedRowP, PCaptionBands, P_SCALE, P_SLOTS, PortraitPlane, pTransform } from "./booksWorldPortrait";
import { bookBob } from "./booksWorld";
import { NealFilmLife9x16, NealTallPaper, type TallCam } from "./nealPortraitShared";
import { Inked, NealSvg, PhotoCutOut } from "./nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 81;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

/** cut 45 portrait's global frame at our f0 (the books' bob continues its phase) */
const G0 = 105;
const PW = 1080;

// ---------------------------------------------------------------------------
// THE CAMERA: x(f), y(f), k(f) are sums of quintic smootherstep terms S(f; [a, b]) (C2: no jump in speed or
// acceleration), so the whole ride is one continuous move with no stops:
//   k: K0 until the pull-back, then K_WIDE (PULL), then a creep;  y: Y0 -> Y1 (TILT: down the shelf to row 1), then
//   -> Y_WIDE (PULL);  x: X0 -> X0 + X_RUN (RUN: drifting right with the ripple), then -> X_WIDE (PULL).
// ---------------------------------------------------------------------------
const CAM = {
  K0: 1.28,
  K_WIDE: 1.04,
  K_CREEP: 0.012,
  X0: 370,
  X_RUN: 230,
  X_WIDE: 540,
  Y0: 400,
  Y1: 948,
  Y_WIDE: 940,
  RUN: [-10, 30] as const,
  TILT: [5, 51] as const,
  PULL: [36, 64] as const,
  CREEP: [60, 100] as const,
};
const S = (f: number, [a, b]: readonly [number, number]) => {
  const t = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return t * t * t * (t * (6 * t - 15) + 10);
};
const camRaw = (f: number) => {
  const pull = S(f, CAM.PULL);
  const k = CAM.K0 - (CAM.K0 - CAM.K_WIDE) * pull - CAM.K_CREEP * S(f, CAM.CREEP);
  const xRun = CAM.X0 + CAM.X_RUN * S(f, CAM.RUN);
  const x = xRun + (CAM.X_WIDE - (CAM.X0 + CAM.X_RUN)) * pull;
  const y = CAM.Y0 + (CAM.Y1 - CAM.Y0) * S(f, CAM.TILT) + (CAM.Y_WIDE - CAM.Y1) * pull;
  return { x, y, k };
};
const C0 = camRaw(0);
export const camAt54P = (f: number): TallCam => ({ ...camRaw(f), x0: C0.x, y0: C0.y });

// ---------------------------------------------------------------------------
// THE SUBJECTS: InstantExpert's SUBJECTS at P_SCALE (the same size relative to the covers), on the portrait slots.
// ---------------------------------------------------------------------------
export const subjectStateP = (i: number, f: number) => {
  const s = SUBJECTS[i];
  const slot = P_SLOTS[i];
  const h = s.h * P_SCALE;
  const w = h * s.aspect;
  const sink = (s.sink ?? 0) * P_SCALE;
  const lift = (s.lift ?? 0) * P_SCALE;
  const dx = (s.dx ?? 0) * P_SCALE;
  const ax = (s.ax ?? 0) * P_SCALE;
  const top = slot.top + bookBob(i, G0 + f);
  const p = popSpring(f - subjectStart(i));
  const footX = slot.cx + dx + ax;
  if (s.grow) {
    // the eruption column billows out of the book about its stem (its foot stays behind the cover's top edge)
    return { x: footX - ax * p, foot: top + sink * Math.max(p, 0.35), scale: p, h, w, clipY: top + 6, p, visible: p > 0.02 };
  }
  // it rises from behind the cover no wider than the cover, opening to full size as it clears the top edge
  const s0 = Math.min(1, (slot.right - slot.left - 11) / w);
  const scale = s0 + (1 - s0) * p;
  const restFoot = top + sink - lift;
  const hiddenFoot = top + h * s0 + 5;
  return { x: footX - ax * scale, foot: hiddenFoot + (restFoot - hiddenFoot) * p, scale, h, w, clipY: top + 6, p, visible: p > 0 };
};

/** review aid: subject i's screen box at frame f (its image box, above the clip line) */
export const subjectBoxP = (i: number, f: number) => {
  const st = subjectStateP(i, f);
  const t = pTransform(camAt54P(f));
  const a = t.toScreen(st.x - (st.w * st.scale) / 2, st.foot - st.h * st.scale);
  const b = t.toScreen(st.x + (st.w * st.scale) / 2, Math.min(st.foot, st.clipY));
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
};

const SubjectOnBookP: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const s = SUBJECTS[i];
  const st = subjectStateP(i, f);
  if (!st.visible) return null;
  const w = st.w * st.scale;
  const h = st.h * st.scale;
  // everything below the cover's top edge is cut: the subject comes out of the book
  const clip = `polygon(-4000px -4000px, 6000px -4000px, 6000px ${st.clipY}px, -4000px ${st.clipY}px)`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: 1920, clipPath: clip, WebkitClipPath: clip }}>
      {s.src ? (
        <PhotoCutOut src={s.src} x={st.x} y={st.foot} w={w} aspect={s.aspect} anchor="bottom" />
      ) : (
        <NealSvg>
          <Inked render={(c) => <rect x={st.x - w / 2} y={st.foot - h} width={w} height={h} fill={c} />} />
        </NealSvg>
      )}
    </div>
  );
};

const InstantExpertPortrait: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt54P(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife9x16 frame={G0 + frame}>
        <NealTallPaper frame={G0 + frame} cam={cam} />
        <PortraitPlane cam={cam}>
          {SUBJECTS.map((s, i) => (
            <SubjectOnBookP key={s.key} i={i} f={frame} />
          ))}
        </PortraitPlane>
        <LandedRowP cam={cam} frame={G0 + frame} />
      </NealFilmLife9x16>
      <PCaptionBands on={bands} />
    </AbsoluteFill>
  );
};

if (P_SLOTS.length !== SUBJECTS.length) throw new Error("InstantExpertPortrait: the shelf and the subjects disagree");

export default InstantExpertPortrait;
