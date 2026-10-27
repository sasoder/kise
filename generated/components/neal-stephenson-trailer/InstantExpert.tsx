// ---------------------------------------------------------------------------
// InstantExpert (neal-stephenson-trailer, cut 54). Core Memory podcast style, the clip's ARCHIVE COLLAGE at 16:9
// (./nealShared; the books and the row: ./booksWorld, read-only). Opaque 1920x1080, 23.976 fps, 81 frames.
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
// THE MOTION: cut 45's row of seven covers (booksWorld LandedRow, same books, order and look). The camera rides the
// ripple in one continuous move (camAt54): it opens close (k 1.5) on the left end of the row, Snow Crash and The
// Diamond Age, tracks right along the row with the ripple so each subject comes up big and inside the frame, and
// from ~f36-44 pulls back (x turning back toward the row's centre as k falls) to the whole row, landing ~f64 at k 1.0,
// then creeps to f80. From "become" (f5) a ripple runs left to right: out of the top of each cover (from behind it:
// the book is the occluder) the real thing its book is about rises on a damped spring (one overshoot), no wider than
// the cover until it clears the edge, then opening to full size (Pinatubo's column instead billows out of the book
// about its stem on the same spring), every SUB_STAGGER frames (first up on "instant" ~f13-17, last settled by
// "writing" ~f55). Vertical framing follows the zoom: the subjects stay in frame and above the caption bands at every
// zoom, the covers sink into the bands (they were read in cut 45; the subjects are the point here). f64-80: the
// settled wide lives on (each subject rides its book's bob <= 1.4 px, the camera creeps, film life). No text; no
// chain (the subjects are not Neal's own, and the books keep their plain look here).
//
// SOURCES (details: <working>/animation_source/refs/ASSETS_READY.md): the covers as booksWorld (US first-edition
// jackets, fair use). The subjects (refs/subjects/, cut out with the macOS Vision foreground mask,
// scripts/clips/neal-stephenson-trailer/neal-matte.swift + subject-cutout.py; the plume by a sky key and a traced
// stem): Snow Crash: NASA Ames VIEW VR headset + DataGloves, c.1989 (NASA, public domain); The Diamond Age: Kate
// Greenaway's Alphabet, 1885 cover illustration (public domain, BnF Gallica); Cryptonomicon: Enigma I, Museo della
// Scienza e della Tecnologia Milano (Alessandro Nassiri, CC BY-SA 4.0); Quicksilver: Godfrey Kneller's Isaac Newton,
// 1689 (public domain); Anathem: a planispheric astrolabe, History of Science Museum, University of Oxford, inv.
// 39540 (CC BY-SA 4.0); Seveneves: the Moon's nearside, LRO WAC mosaic (NASA/GSFC/Arizona State University, public domain); Termination
// Shock: Mount Pinatubo's eruption column, 12 June 1991 (Richard P. Hoblitt, USGS, public domain).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COVER_H, COVER_ROW, LandedRow, bookBob } from "./booksWorld";
import { CaptionBands, Inked, type NealCam, NealFilmLife, NealPaper, NealPlane, NealSvg, PhotoCutOut, W, depthTransform } from "./nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 81;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

/** cut 45's global frame at our f0 (the books' bob and the film life continue its phase) */
const G0 = 105;

// ---------------------------------------------------------------------------
// THE CAMERA rides the ripple: one continuous move, already under way at f0. It opens close on the left end of the
// row (k CAM.K0, Snow Crash and The Diamond Age), tracks right along the row with the ripple so each subject comes up
// big and well inside the frame, and from ~f44 pulls back (the x track turns back toward the row's centre as k
// falls) to the whole row with all seven up, landing ~f66, then a slow creep to f80.
//   x(f) = X0 + X_RUN * S(f; TRACK) - X_BACK * S(f; PULL) + creep, k(f) = K0 - (K0 - K_WIDE) * S(f; PULL) - creep, S =
//   quintic smootherstep over [a, b] (C2, so velocity and acceleration are continuous; TRACK starts before f0 so the
//   camera is already moving). Vertical framing follows k: the covers' top edge (the subjects' feet) sits at screen
//   coverTopY(k), from FEET_CLOSE at K0 to FEET_WIDE at K_WIDE, so the tallest subject's head stays in frame at every
//   zoom and the covers sink into the caption bands while the subjects stay above them.
// ---------------------------------------------------------------------------
const CAM = {
  K0: 1.5,
  K_WIDE: 1.0,
  K_CREEP: 0.016, // further k lost f66 -> f80
  X0: 410,
  X_RUN: 960,
  X_BACK: 371,
  X_CREEP: 6,
  TRACK: [-14, 56] as const,
  PULL: [30, 66] as const,
  CREEP: [62, 100] as const,
  FEET_CLOSE: 462,
  FEET_WIDE: 400,
};
const ROW_TOP = COVER_ROW[0].top; // 84 rest px
const ROW_BOTTOM = COVER_ROW[0].bottom; // 374
const smoother = (f: number, [a, b]: readonly [number, number]) => {
  const t = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return t * t * t * (t * (6 * t - 15) + 10);
};
const coverTopY = (k: number) => CAM.FEET_WIDE + ((CAM.FEET_CLOSE - CAM.FEET_WIDE) * (k - CAM.K_WIDE)) / (CAM.K0 - CAM.K_WIDE);
const camRaw = (f: number) => {
  const creep = smoother(f, CAM.CREEP);
  const k = CAM.K0 - (CAM.K0 - CAM.K_WIDE) * smoother(f, CAM.PULL) - CAM.K_CREEP * creep;
  const x = CAM.X0 + CAM.X_RUN * smoother(f, CAM.TRACK) - CAM.X_BACK * smoother(f, CAM.PULL) + CAM.X_CREEP * creep;
  return { x, y: ROW_TOP - (coverTopY(k) - 540) / k, k };
};
const C0 = camRaw(0);
export const camAt54 = (f: number): NealCam => ({ ...camRaw(f), x0: C0.x, y0: C0.y });

// ---------------------------------------------------------------------------
// THE SUBJECTS: one real thing per book, a graded cut-out (public/neal-stephenson-trailer/subjects/), standing on
// its cover. h = the cut-out's height in rest px, aspect = w / h, sink = rest px of its foot that stays behind the
// cover at rest (it grows out of the book), lift = rest px it floats above the cover top (the Moon), dx = its offset
// from the cover's centre.
// ---------------------------------------------------------------------------
const SUB = "neal-stephenson-trailer/subjects/";
type Subject = { key: string; what: string; src: string | null; aspect: number; h: number; sink?: number; lift?: number; dx?: number; ax?: number; grow?: boolean };
export const SUBJECTS: Subject[] = [
  { key: "snow-crash", what: "early VR: NASA Ames VIEW headset and DataGloves", src: SUB + "subject_1_vr-nasa-view.png", aspect: 547 / 640, h: 268, sink: 26 },
  { key: "diamond-age", what: "an illustrated primer: a mother teaching a girl", src: SUB + "subject_2_greenaway-primer.png", aspect: 545 / 640, h: 262, sink: 12 },
  { key: "cryptonomicon", what: "an Enigma machine", src: SUB + "subject_3_enigma.png", aspect: 567 / 620, h: 246, sink: 22 },
  { key: "quicksilver", what: "Isaac Newton (Kneller 1689)", src: SUB + "subject_4_newton-kneller.png", aspect: 468 / 640, h: 284, sink: 24 },
  { key: "anathem", what: "a brass astrolabe", src: SUB + "subject_5_astrolabe.png", aspect: 460 / 640, h: 276, sink: 6 },
  { key: "seveneves", what: "the Moon", src: SUB + "subject_6_moon.png", aspect: 1, h: 176, lift: 16, dx: -20 },
  { key: "termination-shock", what: "Pinatubo's eruption column, 1991", src: SUB + "subject_7_pinatubo-1991.png", aspect: 982 / 640, h: 222, sink: 12, dx: 36, ax: -36, grow: true },
];

// the ripple: subject i starts rising at SUB_T0 + i * SUB_STAGGER on a damped spring (zeta 0.62, peak at ~8 f, one
// ~7 % overshoot, settled within ~14 f)
const SUB_T0 = 5;
const SUB_STAGGER = 6;
const ZETA = 0.62;
const WD = Math.PI / 8; // damped angular frequency: the overshoot peaks 8 frames after the start
const W0 = WD / Math.sqrt(1 - ZETA * ZETA);
export const popSpring = (t: number) => {
  if (t <= 0) return 0;
  const e = Math.exp(-ZETA * W0 * t);
  return 1 - e * (Math.cos(WD * t) + ((ZETA * W0) / WD) * Math.sin(WD * t));
};
export const subjectStart = (i: number) => SUB_T0 + i * SUB_STAGGER;

/** subject i at frame f: its foot's rest y (bottom of the cut-out), rest px on the focus plane, and the clip line */
export const subjectState = (i: number, f: number) => {
  const s = SUBJECTS[i];
  const slot = COVER_ROW[i];
  const bob = bookBob(i, G0 + f);
  const top = slot.top + bob;
  const restFoot = top + (s.sink ?? 0) - (s.lift ?? 0);
  const p = popSpring(f - subjectStart(i));
  if (s.grow) {
    // the eruption column does not rise: it billows out of the book, growing about its stem (its foot stays behind
    // the cover's top edge, so only the column ever crosses that edge), on the same spring
    const footX = slot.cx + (s.dx ?? 0) + (s.ax ?? 0);
    return { x: footX - (s.ax ?? 0) * p, foot: top + (s.sink ?? 0) * Math.max(p, 0.35), scale: p, clipY: top + 8, p, visible: p > 0.02 };
  }
  // it comes out of the book no wider than the cover, and opens to its full size as it clears the top edge (scaled
  // about its foot point: the image's bottom centre, or `ax` rest px from it, which stays over the cover)
  const w = s.h * s.aspect;
  const s0 = Math.min(1, (slot.right - slot.left - 14) / w);
  const scale = s0 + (1 - s0) * p;
  const hiddenFoot = top + s.h * s0 + 6; // its top just under the cover's top edge: wholly behind the book
  const footX = slot.cx + (s.dx ?? 0) + (s.ax ?? 0);
  return { x: footX - (s.ax ?? 0) * scale, foot: hiddenFoot + (restFoot - hiddenFoot) * p, scale, clipY: top + 8, p, visible: p > 0 };
};

/** review aid: subject i's screen box at frame f */
export const subjectBox = (i: number, f: number) => {
  const s = SUBJECTS[i];
  const st = subjectState(i, f);
  const t = depthTransform(camAt54(f), 1);
  const a = t.toScreen(st.x - (s.h * s.aspect * st.scale) / 2, st.foot - s.h * st.scale);
  const b = t.toScreen(st.x + (s.h * s.aspect * st.scale) / 2, Math.min(st.foot, st.clipY));
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
};

const SubjectOnBook: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const s = SUBJECTS[i];
  const st = subjectState(i, f);
  if (!st.visible) return null;
  const w = s.h * s.aspect * st.scale;
  const h = s.h * st.scale;
  // everything below the cover's top edge is cut: the subject comes out of the book
  const clip = `polygon(-4000px -4000px, 6000px -4000px, 6000px ${st.clipY}px, -4000px ${st.clipY}px)`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1080, clipPath: clip, WebkitClipPath: clip }}>
      {s.src ? (
        <PhotoCutOut src={s.src} x={st.x} y={st.foot} w={w} aspect={s.aspect} anchor="bottom" />
      ) : (
        <NealSvg>
          <Inked render={(c) => <rect x={st.x - w / 2} y={st.foot - h} width={w} height={h} rx={18} fill={c} />} />
        </NealSvg>
      )}
    </div>
  );
};

const InstantExpert: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt54(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={G0 + frame}>
        <NealPaper frame={G0 + frame} cam={cam} />
        <NealPlane cam={cam}>
          {SUBJECTS.map((s, i) => (
            <SubjectOnBook key={s.key} i={i} f={frame} />
          ))}
        </NealPlane>
        <LandedRow cam={cam} frame={G0 + frame} />
      </NealFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

// the opening frames the row in the lower middle, clear of the caption bands, on every camera state
if (COVER_H !== ROW_BOTTOM - ROW_TOP || COVER_ROW.length !== SUBJECTS.length) throw new Error("InstantExpert: booksWorld's row changed");

export default InstantExpert;
