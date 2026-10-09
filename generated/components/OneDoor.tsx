import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK, INK_HI, Label, RED, Stage, WORD_PX, labelPx, paperShadow } from "./chinatalkShared";
import {
  DOOR_W,
  DURATION,
  FPS,
  PITCH,
  POST_H,
  POST_T,
  REST_CAM,
  ROW0_Y,
  R_DOT,
  WALL_T,
  camAt,
  fileRange,
  fileY,
  surgeY,
  viewBounds,
} from "./oneDoorGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// OneDoor -- Jordan Schneider, "Hu Jintao's 25 million jobs" (ChinaTalk),
// graphic B take 2, delivered as 48_BigSwathsNoJob.mov. ChinaTalk style,
// 1080x1920, 24 fps, opaque.
//
// CHECK LINE: "There is one door to a job and one line gets through it; everyone
// else, as far as you can see, is stuck."
//
// LINE: "(... generated when) you have big swaths of the economy that can't get a
// job in general or a job that they think befits (all the hard work ...)".
// IN = edit frame 1168 (out/jordan-hu/words.tsv: "you" starts at 1175 = local 7);
// the slot runs to the cut back to the speaker at edit 1312, so DURATION = 144 f.
// Local word frames: you 7 . have 11 . big 20 . swaths 29 . of the economy 42-56 .
// that 56 . can't 62 . get a job 68-83 . in general 83-95 . or a job 95-110 .
// that they think 111-127 . befits 127-139 . cut 144.
//
// MOTION: nothing enters and nothing changes state on a timer. A heavy ink wall
// crosses the whole world with one door in it (two posts, JOBS beside them); an
// endless exact grid of red dots stands in lanes against it; the one lane under
// the door shuffles forward at a constant 3 world px a frame (one dot through
// every 12 f). Whatever part of a dot is past the wall's centre line is ink, the
// rest is still red (a straight split that runs down the dot as it crosses);
// from the frame its centre is on the line it accelerates over one lane pitch
// (8 f) to 6 px a frame and leaves through the top of the frame, so the ink
// file opens up to twice the queue's spacing. The standing crowd presses: one
// slow surge rolls from the back to the wall (each row moves along its lanes
// only, 0..3 px, period 48 f, wavelength 10 rows; the front row touches the
// wall at the press and never enters it). The camera opens tight on the door
// (k 3.4, the door, JOBS and a few lanes), already moving, and makes ONE
// straight pull-back to k 1 (landing f122-128, then a slow residual creep), so
// the same picture simply gets bigger: nine lanes become thirty, the wall
// rises from mid-frame to y 480 and red owns three quarters of the frame.
//
// RED = young people without the job. Ink = the wall, the posts, the label and
// the few who are through. Three element types: wall, dots, one label.
//
// SIZES (world px = screen px in the final k = 1 frame; geometry, so they scale
// with the camera rather than through the stroke size law): lane pitch = row
// pitch 36 (= WORD_PX), wall 26 thick (7.5 x INK_W), dot diameter 26 (= the
// wall's thickness; the kit's DOT_R 11.5 a size up), door 36 (one pitch), posts
// 26 x 90, corner radius 3. In the f0 close-up a dot is 88 px across. JOBS is
// the kit Label, word class, through the kit size law with a screen floor of
// 1.5 x WORD_PX = 54 px (79 px at f0, 54 px from ~f47 on); it stands beside the
// right post because the file walks straight up the door's column.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** the screen floor of the one label: 1.5 x the kit's word size (54 px) */
const LABEL_MIN_PX = 1.5 * WORD_PX;
/** corner radius of the posts and the door jambs, world px */
const CORNER = 3;

const n2 = (v: number) => v.toFixed(2);
/** one dot as a closed sub-path */
const dotD = (cx: number, cy: number) =>
  `M${n2(cx - R_DOT)} ${n2(cy)}a${R_DOT} ${R_DOT} 0 1 0 ${2 * R_DOT} 0a${R_DOT} ${R_DOT} 0 1 0 ${-2 * R_DOT} 0Z`;

/** One side of the wall with its post, as ONE shape (sx = 1 right, -1 left):
 *  the bar from the door jamb out past the frame edge, the post standing on its
 *  far side at the jamb. */
const wallSideD = (sx: 1 | -1, xFar: number) => {
  const g = DOOR_W / 2;
  const h = WALL_T / 2;
  const top = -h - POST_H;
  const c = CORNER;
  const X = (x: number) => n2(sx * x);
  return [
    `M${X(g + c)} ${n2(h)}`,
    `L${n2(xFar)} ${n2(h)}`,
    `L${n2(xFar)} ${n2(-h)}`,
    `L${X(g + POST_T)} ${n2(-h)}`,
    `L${X(g + POST_T)} ${n2(top + c)}`,
    `Q${X(g + POST_T)} ${n2(top)} ${X(g + POST_T - c)} ${n2(top)}`,
    `L${X(g + c)} ${n2(top)}`,
    `Q${X(g)} ${n2(top)} ${X(g)} ${n2(top + c)}`,
    `L${X(g)} ${n2(h - c)}`,
    `Q${X(g)} ${n2(h)} ${X(g + c)} ${n2(h)}`,
    "Z",
  ].join("");
};

const OneDoor: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const b = viewBounds(cam);

  // the standing crowd: every lane but the door's, from the wall down past the
  // bottom edge and out past both sides (only what the camera can see is drawn);
  // each row rides the surge along its lanes
  const i0 = Math.floor((b.x0 - R_DOT) / PITCH);
  const i1 = Math.ceil((b.x1 + R_DOT) / PITCH);
  const j1 = Math.ceil((b.y1 + R_DOT - ROW0_Y) / PITCH);
  const crowd: string[] = [];
  for (let j = 0; j <= j1; j++) {
    const cy = ROW0_Y + j * PITCH + surgeY(j, S);
    for (let i = i0; i <= i1; i++) {
      if (i === 0) continue;
      crowd.push(dotD(i * PITCH, cy));
    }
  }

  // the door's lane: the queue below the line, the free file above it. A dot
  // astride the line is in both lists; each list is clipped at the line.
  const { jTop, jBot } = fileRange(b.y0, b.y1, S);
  const fileRed: string[] = [];
  const fileInk: string[] = [];
  for (let j = jTop; j <= jBot; j++) {
    const y = fileY(j, S);
    if (y > -R_DOT) fileRed.push(dotD(0, y));
    if (y < R_DOT) fileInk.push(dotD(0, y));
  }
  // the red side keeps 0.75 screen px under the ink so no paper shows in the seam
  const seam = 0.75 / k;
  const clipX = -R_DOT - 2;
  const clipW = 2 * R_DOT + 4;

  // JOBS: beside the right post, caps centred on the post's height
  const fs = Math.max(labelPx("word", k), LABEL_MIN_PX / k);
  const labelX = DOOR_W / 2 + POST_T + 0.5 * fs;
  const labelY = -(WALL_T / 2 + POST_H / 2);

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      <defs>
        <clipPath id="od-before">
          <rect x={clipX} y={n2(-seam)} width={clipW} height={n2(b.y1 + 2 * PITCH + seam)} />
        </clipPath>
        <clipPath id="od-past">
          <rect x={clipX} y={n2(b.y0 - 2 * PITCH)} width={clipW} height={n2(2 * PITCH - b.y0)} />
        </clipPath>
      </defs>

      {/* everyone who is not through: one red mass, one paper shadow */}
      <g style={{ filter: paperShadow(k) }}>
        <path d={crowd.join("")} fill={RED} />
        <path d={fileRed.join("")} fill={RED} clipPath="url(#od-before)" />
      </g>

      {/* the wall and its door (ink sits flat) */}
      <g fill={INK} opacity={INK_HI}>
        <path d={wallSideD(-1, b.x0 - 40)} />
        <path d={wallSideD(1, b.x1 + 40)} />
      </g>

      {/* the few who are through, and the part of the crossing dot that is */}
      {fileInk.length ? <path d={fileInk.join("")} fill={INK} fillOpacity={INK_HI} clipPath="url(#od-past)" /> : null}

      <Label text="Jobs" x={labelX} y={labelY} k={k} size="word" rung={INK_HI} anchor="start" minPx={LABEL_MIN_PX} />
    </Stage>
  );
};

export default OneDoor;
