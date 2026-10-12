// ---------------------------------------------------------------------------
// OverwhelmingNumbers (cut C of "Sheppard_Conquistador_Advantages"; Dwarkesh
// Patel with Si Sheppard). Dwarkesh map style, "beyond maps" umber page, seen
// from above like a parade-ground plan. Opaque 1080x1920, 23.976 fps, 89 frames.
//
// CHECK LINE: After this cut the viewer can say: "the Spaniards were one small
// company at the head of an enormous army of native allies - the numbers were
// the allies'."
//
// THE LINE: "[...] without the support of those indigenous allies. So those
// overwhelming numbers."
// WORD -> FRAME: without -6 · the 3 · support 12 · of 20 · those 23 ·
//   indigenous 26 · allies 31-39 · So 50 · those 50 · overwhelming 62-75 ·
//   numbers 75-83 · cut back to the speaker at 89.
//
// THE MOTION (one move): the frame opens tight on the Spanish company, 200
// orange dots in ranks, marching up the page and seemingly alone. One eased
// log-space pull-back, already under way on f0 and landing on f60, lets the
// cream companies of the allied host come in over ALL FOUR frame edges
// (f12-16, "support"), then more and more of them, until the orange block is
// one small mark in the middle of a sea of companies that runs off the frame
// on every side ("overwhelming"); the hold creeps out ~0.14 % a frame while
// the march goes on (the ground slides down the frame). Nothing fades in: all
// 40,200 dots are there from frame 0 and only the camera reveals them.
//
// Colour: ORANGE = the Spaniards' men; the allies are CREAM. 1 dot = 1
// man-symbol, 200 : 40,000 = 1 : 200 (Cortes's Third Letter: ~900 Spaniards at
// the 1521 siege; modern estimates of the allied force run up to ~200,000).
// No text, no numbers, no banners.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, DARK, FRAME_H, FRAME_W, INK, PlanPage, SCREEN_CX, SCREEN_CY, type Cam } from "./incaShared";
import { COMPANIES, DOT_R, SPANISH, camAt, groundCam, pull, stepShift, type Company } from "./overwhelmingMotion";

export const FPS = 24000 / 1001;
export const DURATION = 89;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const TAU = Math.PI * 2;

/** every company in view as dots on one canvas: the dark casings of a colour first, then its fills */
const Host: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    const { k } = cam;
    const tx = SCREEN_CX - cam.cx * k;
    const ty = SCREEN_CY - cam.cy * k;
    const r = DOT_R * k; // screen px
    const cs = Math.min(1.8, 0.3 * r); // the dark rim, screen px
    const m = r + cs + 2;
    const pass = (cos: Company[], rad: number, style: string, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = style;
      ctx.beginPath();
      for (const c of cos) {
        // cull the whole company first
        const bx0 = tx + c.x * k;
        const by0 = ty + c.y * k;
        if (bx0 > FRAME_W + m || by0 > FRAME_H + m || bx0 + (c.files - 1) * k < -m || by0 + (c.ranks - 1) * k < -m) continue;
        for (let j = 0; j < c.ranks; j++) {
          const sy = by0 + (j + stepShift(frame, j, c.seed)) * k;
          if (sy < -m || sy > FRAME_H + m) continue;
          const n = j === c.ranks - 1 ? (c.last ?? c.files) : c.files;
          for (let i = 0; i < n; i++) {
            const sx = bx0 + i * k;
            if (sx < -m || sx > FRAME_W + m) continue;
            ctx.moveTo(sx + rad, sy);
            ctx.arc(sx, sy, rad, 0, TAU);
          }
        }
      }
      ctx.fill();
    };
    // the rim thins out with the dots, so a company far off reads as cream texture, not as a grey tile
    const rim = 0.62 * Math.min(1, r / 7);
    pass(COMPANIES, r + cs / 2, DARK, rim);
    pass(COMPANIES, r - cs / 2, INK, 0.95);
    // the orange men grow a touch heavier (and lose most of their rim) as the camera leaves, so the company
    // holds as one bright orange mark in the wide
    const e = pull(frame);
    const ro = r * (1.1 + 0.22 * e);
    pass([SPANISH], ro + cs / 2, DARK, rim * (1 - 0.7 * e));
    pass([SPANISH], ro - (cs / 2) * (1 - 0.7 * e), ACCENT, 1);
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />;
};

const OverwhelmingNumbers: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <PlanPage cam={groundCam(cam, frame)} vignette={0.5}>
      <Host cam={cam} frame={frame} />
    </PlanPage>
  );
};

export default OverwhelmingNumbers;
