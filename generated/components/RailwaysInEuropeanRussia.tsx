import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { FRAME_H, FRAME_W, clamp, sway } from "./fieldShared";
// The map is drawn in two halves. The STATIC layers (sea, water-lines,
// graticule, land + rim, lakes, 1914 borders, coast, and the idle 1914 railway
// network in the cream chequered symbol at 0.5) are a raster LOD pyramid baked
// once by `scripts/bake-european-russia-rasters.mjs` (public/european-russia/,
// rects in erLevels.ts). The DYNAMIC overlays (coins, the orange railway, the
// front, the army, two names) are light vectors from
// `scripts/build-european-russia-map.mjs` (erMapData.ts), moved by erMotion.ts.
import { EURO1_ARC_D, EURO2_ARC_D, EURO_SPACING, FEEDERS, FRONT_PTS, ORANGE_EDGES, WWI_ARC_D } from "./erMapData";
import {
  CAM_TRACK,
  DURATION,
  F_HEAD_AT_SPUR,
  SPUR,
  coinScreen,
  EDGE_POLYS,
  FEEDER_POLYS,
  FPS,
  FRONT,
  LIGHT_AT,
  SOLDIERS,
  T,
  coinsAt,
  edgeCover,
  levelDrawn,
  levelOps,
  penS,
  reachAt,
  smoothstep,
  soldierAt,
} from "./erMotion";
import { LEVELS } from "./erLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// Sarah Paine, clip "SarahWar_Japan_won_and_the_Romanovs_were_shot". Previous
// sentence: "If Russia spends money on this war [the Russo-Japanese War] ..."
// This cut: "... it means it's not spending all that money in, say, doing
// something useful, which would be expanding its railway system in European
// Russia. That would have been really helpful fighting World War I,"
//
// TIMELINE. The SRT (media-to-srt output ..._c4_p0.5.srt) is on the EDIT
// timeline: it was transcribed from input/..._shot.mp3 (78.49 s), NOT from the
// clip folder's .mov (84.83 s, the longer raw cut; ~3.5 s later at this line, so
// a silencedetect on the .mov lands on different words). Verified against the
// mp3's energy envelope + spectral fricatives (20 ms windows) and a word-level
// re-transcription (faster-whisper large-v3-turbo) of 44.5-57.5 s:
//   in-point 45.80 s = f0 (the end of "war"; silence 45.84-45.92).
//   frame = round((t - 45.80) * 24)
//   it f3 (45.93; the SRT's token "war it" starts 45.38) · means f7 · it's f12 ·
//   not f17 · spending f22 · all f30 · that f34 · money f37 · in f44 · say f58 ·
//   doing f63 · something f65 · useful f70 · which f82 · would f85 · be f88 ·
//   expanding f92 · its f104 · railway f118 · system f127 · in f141 ·
//   European f149 · Russia f159 · that f171 · would f184 · have f188 · been f191 ·
//   really f196 · helpful f208 · fighting f216 (the f fricative at 55.80;
//   SRT f218) · World f228 · War f236 · I f245 (voiced 56.00-56.26; SRT f240),
//   line ends f252 (56.27; SRT 56.40).
//   There is NO pause f25-38 on the edit timeline ("spending" f22 -> "all" f30
//   run on); the .mov pauses the brief quoted are the raw cut's.
// DURATION: the SRT line end 56.40 s -> round(10.60 * 24) = 254, + the 16-frame
// house tail = 270 frames (the verified end f252 is inside it).
//
// DWARKESH MAP STYLE (MEMORY.md; reference SouthManchuriaRailway.tsx,
// TroopsOutOfAsia.tsx): sea #1B2226, land #3F3428 with the #6A5838 rim, cream
// ink #E9DDBF, 4 engraved water-lines, 5 deg graticule, baked mottle + grain,
// vignette, IM Fell English SC, the chequered railway symbol, 1914 borders fine
// dashed cream 0.5. Opaque 1080x1920, 24 fps.
//
// COLOUR RULE: ORANGE (#FFB000 / #D98A0C) = THE MONEY and what it would have
// bought: the coins, the railway they turn into, the frontier ends that railway
// reaches. Nothing else is orange. Everything else is cream #E9DDBF at two
// opacities: full for things in play (the front once drawn, the two
// names), ~0.5 for idle context (the 1914 network, the borders).
//
// THE GESTURES, each with its word (frames at 24 fps). One continuous motion:
// the camera never rests (|d camera| >= 0.35 px/f on every frame, centre pan
// <= 16 px/f), every group moves with individual phase.
//   1. "it means it's not spending all that money" f0-44. Open at k 2.6 on the
//      Moscow-Samara line between Penza and the Volga: a single file of orange
//      coins (orange discs ~14 px, a thin engraved cream ring, 15 world px
//      apart) rides EAST on the north side of the line toward Samara and the
//      Urals, toward the war; the camera drifts east with the head (600 -> 700
//      px on screen).
//   2. "in, say, doing something useful" f36-90. The stream eases down (from
//      f26) and the head swings round one balloon loop just past Samara (far
//      point on f52) and comes back WEST on the south side of the line; every
//      coin follows the head's path at the same spacing (no rewind: the
//      stream is a hairpin while it turns). The camera turns at f52 and travels
//      west, pulling back (k 2.45 -> 1.4); the stream accelerates and overtakes
//      it toward Moscow.
//   3. "which would be expanding its railway system" f92-153. The head reaches
//      Moscow on f92 ("expanding"). Every coin that arrives shrinks into Moscow
//      (7 f) and the ORANGE chequered railway advances by its share: laid
//      length = coins consumed x (total orange length / 50 coins); it covers
//      every line out to one network distance from Moscow at once, so a front
//      runs along every line (Petersburg, the west, Kiev, the south, branch by
//      branch), each with a soft glow at its tip. The stream picks up again as
//      the web branches (so no front bursts or stalls); the last coin lands on
//      f146 and the growth stops on ~f153, when the last fronts (Granica,
//      Aleksandrow) reach the frontier. The camera pulls back with it (k 1.4 ->
//      1.0); "railway" f118 / "system" f127 is where the web reads as a web.
//      Once the last coin is round the loop (f112) the returning file slides
//      from the lane onto the line.
//   4. "in European Russia" f141-170. The European Russia wide (k 1.0, world ==
//      screen, the web y 320-1135), creeping; EUROPEAN / RUSSIA in IM Fell
//      English SC, widely spaced, set on two parallels centred on the web
//      (build script: the orange lines that meet a row pass through letter
//      gaps, never a glyph), slide up 24 px + fade from f151, full by f160
//      ("Russia"); they fade out during the glide west (f176-196).
//   5. "That would have been really helpful fighting" f168-227. One long glide
//      west with a push-in (k 1.02 -> 1.73, landing f202) onto Russia's 1914
//      frontier with Germany and Austria-Hungary (centred on x 540, y 690). From
//      f194 a pen draws it north -> south as a solid cream FRONT over the dashed
//      border (done f209). Each frontier line's end lights orange as the pen
//      passes it (f197-206, around "helpful" f208): a dot and one ring. Army
//      dots (the house dot-army, 9.5 k^0.35 px, spacing 1.3 x dot, cream at the
//      second rung 0.72) appear on the orange lines nearest their slots, roll
//      up them in two-abreast columns and peel off into one even blue-noise
//      band behind the front (Russian side, a clear 8.5 world px gap, 3 rows
//      deep swelling to 4 where a line meets the front), packed f213-219
//      ("fighting" f216). The orange lines are drawn over the band, so each
//      visibly runs through it to the front.
//   6. "World War I" f228-269. WORLD WAR I in IM Fell English SC spaced caps
//      slides up on the 53.8 N parallel over East and West Prussia, beside
//      the front, from f229 (full f238, landed f243; "I" f245). Hold: the
//      camera creeps 3 % and drifts; a faint highlight keeps travelling each
//      frontier line toward the front (hashed phase, to the last frame); the
//      ends breathe; the band keeps its individual drift.
// Nothing else: no city names, no dates, no legend, no title, no numbers.
//
// SOURCES. Stations: Wikipedia / GeoNames town and station coordinates (list
// and 1914 routings in scripts/build-european-russia-map.mjs). Borders: 1914
// polity field (Natural Earth 10m countries + aourednik/historical-basemaps
// world_1914 + the hand corrections of scripts/build-ww1-map.mjs). Lakes:
// Natural Earth 10m lakes, reservoirs excluded, pre-1960 Aral.
// ---------------------------------------------------------------------------

export const SEA = "#1B2226";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const CORE_ORANGE = "#2B1B06";
const SHADOW = "#0B0907";
const ARMY_OP = 0.72; // the second rung of the opacity ladder: the army is the consequence, the orange the subject

export const schema = z.object({
  sea: z.string(),
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
  labels: z.object({
    europe1: z.string(),
    europe2: z.string(),
    wwi: z.string(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  sea: SEA,
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  vignette: 0.55,
  labels: { europe1: "EUROPEAN", europe2: "RUSSIA", wwi: "WORLD WAR I" },
});

// ---------------------------------------------------------------------------
const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const slide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], clamp),
});
const DASH = 8; // screen px at the bottom of each octave
const octaves = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { d: a, op: 1 - t },
    { d: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
type P2 = [number, number];
const toD = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
const FRONT_D = toD(FRONT_PTS as P2[]);
const FEEDER_DS = FEEDERS.map((fd) => toD(fd.pts as P2[]));
const SPUR_D = toD(SPUR.pts);

// ---------------------------------------------------------------------------
const RailwaysInEuropeanRussia: React.FC<Props> = ({ sea, ink, accent, accentDeep, grainSrc, mottleSrc, vignette, labels }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(DURATION, Math.max(0, Math.round(frame)));

  // -- camera ----------------------------------------------------------------
  const cam = CAM_TRACK[fi];
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx / k;
  const cy = cam.cy + drift.dy / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const grow = (v: number, e = 0.35) => (v * Math.pow(k, e)) / k;
  const view = { x0: cx - 600 / k, x1: cx + 600 / k, y0: cy - 1020 / k, y1: cy + 1020 / k };
  const inView = (x: number, y: number, m = 0) => x > view.x0 - m && x < view.x1 + m && y > view.y0 - m && y < view.y1 + m;

  // -- the static map: the LOD level(s) for this k -----------------------------
  const ops = levelOps(k, fi);
  const levelImgs = LEVELS.map((L, li) => {
    if (!levelDrawn(ops, li)) return null;
    return (
      <Img
        key={L.name}
        src={staticFile(`european-russia/lod-${L.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
          opacity: ops[li],
        }}
      />
    );
  });

  // -- the orange railway: every line covered out to the reach d ----------------
  const d = reachAt(frame);
  const dPrev = reachAt(frame - 1);
  const growing = smoothstep((d - dPrev) / 2.5);
  const RW = 5.4 * Math.pow(k, 0.12); // the idle symbol's width (screen px), as baked
  const RWJ = RW + 1.6; // the bought line, a touch heavier
  const oct = octaves(k);
  let caseD = "";
  const dashParts: { d: string; off: number }[] = [];
  const tips: P2[] = [];
  if (d > 0.01) {
    ORANGE_EDGES.forEach((e, ei) => {
      const cover = edgeCover(e, d);
      if (!cover.length) return;
      const poly = EDGE_POLYS[ei];
      for (const [s0, s1] of cover) {
        const pts = s0 <= 0.001 && s1 >= e.len - 0.001 ? (e.pts as P2[]) : poly.sub(s0, s1);
        const dd = toD(pts);
        caseD += dd;
        dashParts.push({ d: dd, off: s0 });
      }
      const full = cover.length === 1 && cover[0][0] <= 0.001 && cover[0][1] >= e.len - 0.001;
      if (!full) for (const [s0, s1] of cover) tips.push(s0 <= 0.001 ? poly.at(s1) : poly.at(s0));
    });
  }

  // -- coins -------------------------------------------------------------------
  const coins = coinsAt(frame);
  const coinR = coinScreen(k) / 2 / k;
  // the balloon-loop spur: drawn in along its length, east foot first, just
  // ahead of the head; then it stays, idle
  const spurT = smoothstep((frame - (F_HEAD_AT_SPUR - 16)) / 13);
  const spurOn = spurT > 0.001 && inView(SPUR.pts[0][0], SPUR.pts[0][1], 200);

  // -- the front ---------------------------------------------------------------
  const pen = penS(frame);
  const penOn = frame >= T.pen[0] && pen > 0.5;
  const penTip = FRONT.at(pen);
  const penLive = smoothstep((frame - T.pen[0]) / 3) * (1 - smoothstep((frame - T.pen[1]) / 5));

  // -- the army ----------------------------------------------------------------
  const rDot = (9.5 * Math.pow(k, 0.35)) / 2 / k;
  const soldiers: { x: number; y: number; vis: number; key: number }[] = [];
  if (frame >= 190) {
    SOLDIERS.forEach((sd, i) => {
      const p = soldierAt(sd, frame, k);
      if (p && inView(p.x, p.y, 10)) soldiers.push({ ...p, key: i });
    });
  }

  // -- the hold's travelling highlight on each frontier line -------------------
  const shimmers: React.ReactNode[] = [];
  if (frame >= T.shimmer) {
    const fadeIn = smoothstep((frame - T.shimmer) / 10);
    FEEDERS.forEach((fd, i) => {
      const poly = FEEDER_POLYS[i];
      const PERIOD = 34 + 8 * ((i * 0.618) % 1);
      const u = (((frame - T.shimmer) / PERIOD + ((i * 0.37) % 1)) % 1 + 1) % 1;
      const sEnd = poly.len - 4;
      const sStart = Math.max(0, sEnd - 300);
      const s = sStart + (sEnd - sStart) * smoothstep(u);
      const op = Math.sin(Math.PI * u) * 0.5 * fadeIn;
      if (op < 0.01) return;
      [
        [80, 0.3],
        [40, 0.45],
        [14, 0.7],
      ].forEach(([len, o]) =>
        shimmers.push(
          <path
            key={`sh-${i}-${len}`}
            d={FEEDER_DS[i]}
            fill="none"
            stroke="#FFE3A6"
            strokeOpacity={o * op}
            strokeWidth={px(RWJ - 1)}
            strokeLinecap="round"
            strokeDasharray={`${px(len)} ${poly.len * 2}`}
            strokeDashoffset={-(s - px(len) / 2)}
          />,
        ),
      );
    });
  }

  // -- type --------------------------------------------------------------------
  const euroIn = slide(frame, T.euroLabel);
  // it leaves quietly as the glide west carries it off the right edge
  const euroSl = { dy: euroIn.dy, op: euroIn.op * (1 - smoothstep((frame - 176) / 20)) };
  const wwiSl = slide(frame, T.wwiLabel);
  const arcText = (text: string, href: string, size: number, spacing: number, sl: { dy: number; op: number }, key: string) =>
    sl.op > 0 ? (
      <g key={key} transform={`translate(0 ${px(sl.dy)})`} opacity={sl.op}>
        <text
          fill={ink}
          stroke={sea}
          strokeOpacity={0.6}
          strokeWidth={size * 0.12}
          paintOrder="stroke"
          style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * spacing }}
        >
          <textPath href={href} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </g>
    ) : null;

  // Mottle tiles, world space, in octaves (TroopsOutOfAsia).
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((o * 173) % 640) - 320;
    const oy = ((o * 311) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((view.y0 - oy) / S) * S + oy;
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
      {/* ---------------- THE MAP: the baked static layers ---------------- */}
      {levelImgs}

      {/* ---------------- PAPER MOTTLING, world space ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {tiles.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile(mottleSrc)}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>

      {/* ---------------- RAILWAY, FRONT, COINS, ARMY, NAMES ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <path id="euro1Arc" d={EURO1_ARC_D} />
          <path id="euro2Arc" d={EURO2_ARC_D} />
          <path id="wwiArc" d={WWI_ARC_D} />
          <mask id="spurReveal" maskUnits="userSpaceOnUse" x={-500} y={-500} width={3000} height={3000}>
            <path
              d={SPUR_D}
              fill="none"
              stroke="#fff"
              strokeWidth={px(24)}
              strokeDasharray={`${Math.max(0.001, SPUR.len * spurT)} ${SPUR.len * 2}`}
            />
          </mask>
          <radialGradient id="tipGlow">
            <stop offset="0%" stopColor={accent} stopOpacity={0.75} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="penGlow">
            <stop offset="0%" stopColor="#FFF6DC" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#FFF6DC" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={camT}>
          {/* the names */}
          {arcText(labels.europe1, "#euro1Arc", grow(34), EURO_SPACING, euroSl, "e1")}
          {arcText(labels.europe2, "#euro2Arc", grow(34), EURO_SPACING, euroSl, "e2")}

          {/* the army: the second rung (0.72), under the orange lines that feed it */}
          <g>
            {soldiers.map((s) => (
              <circle
                key={`a-${s.key}`}
                cx={s.x}
                cy={s.y}
                r={rDot * (0.4 + 0.6 * s.vis)}
                fill={ink}
                fillOpacity={ARMY_OP * s.vis}
                stroke={SHADOW}
                strokeOpacity={0.6 * s.vis}
                strokeWidth={px(1.6)}
              />
            ))}
          </g>

          {/* the bought railway: orange chequered, world-anchored dashes */}
          {caseD ? (
            <g fill="none" strokeLinejoin="round">
              <path d={caseD} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(RWJ + 4)} />
              <path d={caseD} stroke={accent} strokeWidth={px(RWJ)} />
              <path d={caseD} stroke={CORE_ORANGE} strokeWidth={px(RWJ - 3.4)} />
              {oct.map((o) =>
                dashParts.map((p, i) => (
                  <path
                    key={`od-${o.d}-${i}`}
                    d={p.d}
                    stroke={accent}
                    strokeOpacity={o.op}
                    strokeWidth={px(RWJ - 3.4)}
                    strokeDasharray={`${o.d} ${o.d}`}
                    strokeDashoffset={p.off}
                  />
                )),
              )}
            </g>
          ) : null}
          {growing > 0.01
            ? tips.map(([x, y], i) =>
                inView(x, y, 20) ? (
                  <circle key={`tip-${i}`} cx={x} cy={y} r={px(15)} fill="url(#tipGlow)" opacity={growing} />
                ) : null,
              )
            : null}
          {shimmers}

          {/* the front: a pen draws it north -> south */}
          {penOn ? (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={FRONT_D} stroke={SHADOW} strokeOpacity={0.5} strokeWidth={px(5.2)} strokeDasharray={`${pen} ${FRONT.len * 2}`} />
              <path d={FRONT_D} stroke={ink} strokeOpacity={0.95} strokeWidth={px(2.6)} strokeDasharray={`${pen} ${FRONT.len * 2}`} />
            </g>
          ) : null}
          {penLive > 0.01 ? <circle cx={penTip[0]} cy={penTip[1]} r={px(16)} fill="url(#penGlow)" opacity={penLive} /> : null}

          {/* the frontier ends: lit as the pen passes */}
          {FEEDERS.map((fd, i) => {
            const t = frame - LIGHT_AT[i];
            if (t < 0) return null;
            const [x, y] = fd.pts[fd.pts.length - 1];
            const ring = Math.min(1, t / 16);
            const breathe = 1 + 0.06 * Math.sin(frame * 0.12 + i * 1.7);
            const dotIn = smoothstep(t / 6);
            return (
              <g key={`end-${i}`}>
                <circle cx={x} cy={y} r={px(18 * breathe)} fill="url(#tipGlow)" opacity={0.55 * dotIn} />
                {ring < 1 ? (
                  <circle
                    cx={x}
                    cy={y}
                    r={px(5 + 17 * EASE_LAND(ring))}
                    fill="none"
                    stroke={accent}
                    strokeWidth={px(2)}
                    opacity={0.9 * (1 - ring)}
                  />
                ) : null}
                <circle
                  cx={x}
                  cy={y}
                  r={px(5.2 * dotIn * breathe)}
                  fill={accent}
                  stroke={SHADOW}
                  strokeOpacity={0.6}
                  strokeWidth={px(1.6)}
                />
              </g>
            );
          })}

          {/* the balloon-loop spur, the idle symbol (0.5 cream) */}
          {spurOn ? (
            <g opacity={0.5} fill="none" strokeLinejoin="round">
              {[
                [SHADOW, 0.55, RW + 3.5, undefined],
                [ink, 1, RW, undefined],
                ["#15120E", 1, RW - 2.8, undefined],
                [ink, 1, RW - 2.8, octaves(k)[0].d],
              ].map(([c, o, w, dash], j) => (
                <path
                  key={`spur-${j}`}
                  d={SPUR_D}
                  stroke={c as string}
                  strokeOpacity={o as number}
                  strokeWidth={px(w as number)}
                  strokeDasharray={dash ? `${dash} ${dash}` : undefined}
                  mask="url(#spurReveal)"
                />
              ))}
            </g>
          ) : null}

          {/* the coins */}
          {coins.map((c) =>
            inView(c.x, c.y, 10) ? (
              <g key={`c-${c.i}`} opacity={Math.min(1, c.scale * 1.4)}>
                <circle cx={c.x} cy={c.y} r={coinR * c.scale} fill={accent} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={px(1.5)} />
                <circle cx={c.x} cy={c.y} r={coinR * c.scale * 0.6} fill={accentDeep} />
                <circle cx={c.x} cy={c.y} r={coinR * c.scale * 0.64} fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth={px(1.1)} />
              </g>
            ) : null,
          )}

          {arcText(labels.wwi, "#wwiArc", grow(41), 0.26, wwiSl, "wwi")}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
            3,
          )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default RailwaysInEuropeanRussia;
