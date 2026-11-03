// deskProbe (robert-lbj-money): a still-probe of lbjDeskWorld for the builders (not a delivered cut). Props pick the
// camera, the telegram's notation and progress, the hand, the tray's contents and the paper's dim.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUT1_STRIPS, CUT1_STRIPS_V2, DESK_CAM_REST, DESK_CAM_REST_V2, DONE_STACK_CUT1, DONE_STACK_CUT1_V2, ELBOW_V2, PEN_LEN_V2, PEN_REST_DIR_V2, DeskDark, DeskScene, DeskStage, DoneTray, PenHand, TELEGRAM_REST, Telegram, deskView, handGrip, nibOnPaper, type DeskCam, type Notation } from "./lbjDeskWorld";

export const FPS = 24000 / 1001;
export const DURATION = 1;
export const schema = z.object({
  cam: z.enum(["wide", "rest", "mid"]),
  text: z.string(),
  colour: z.enum(["grant", "refuse"]),
  progress: z.number(),
  underline: z.number(),
  hand: z.boolean(),
  tray: z.boolean(),
  dim: z.number(),
  /** V2 (rev 2): DESK_CAM_REST_V2 for "rest", CUT1_STRIPS_V2, the pen hand, the V2 arm, the V2 tray stack */
  v2: z.boolean().default(false),
  ulFrom: z.number().optional(),
});
export const defaultProps = schema.parse({ cam: "rest", text: "OK $1500", colour: "grant", progress: 1, underline: 1, hand: true, tray: false, dim: 0 });

export const PROBE_WIDE: DeskCam = { tx: -4, ty: 0, tz: 38, dist: 84, pitch: 27, yaw: -9, f: 1900, sx: 540, sy: 1000 };

const DeskProbe: React.FC<z.infer<typeof schema>> = (p) => {
  const frame = useCurrentFrame();
  const rest = p.v2 ? DESK_CAM_REST_V2 : DESK_CAM_REST;
  const cam = p.cam === "wide" ? PROBE_WIDE : p.cam === "mid" ? { ...rest, dist: 60, pitch: 48, sy: 780 } : rest;
  const V = deskView(cam, frame);
  const n: Notation = { text: p.text, colour: p.colour, progress: p.progress, underline: p.underline as 0 | 1 | 2, ulFrom: p.ulFrom, hand: p.v2 ? "pen" : undefined };
  const nib = nibOnPaper(TELEGRAM_REST, n, p.progress);
  const nibAt = (f: number) => nibOnPaper(TELEGRAM_REST, n, Math.max(0, p.progress - (frame - f) * 0.03));
  const grip = handGrip(nibAt, frame);
  return (
    <DeskStage V={V}>
      <DeskScene V={V} />
      <DoneTray V={V} uid="tray" items={p.tray ? (p.v2 ? DONE_STACK_CUT1_V2 : DONE_STACK_CUT1) : []} />
      <Telegram V={V} pose={TELEGRAM_REST} strips={p.v2 ? CUT1_STRIPS_V2 : CUT1_STRIPS} notation={p.progress > 0 ? n : undefined} dim={p.dim} uid="tg" />
      {p.hand ? <PenHand V={V} nib={nib} grip={grip} uid="hand" ink={p.colour} elbow={p.v2 ? ELBOW_V2 : undefined} restDir={p.v2 ? PEN_REST_DIR_V2 : undefined} penLen={p.v2 ? PEN_LEN_V2 : undefined} /> : null}
      <DeskDark V={V} uid="dark" />
    </DeskStage>
  );
};

export default DeskProbe;
