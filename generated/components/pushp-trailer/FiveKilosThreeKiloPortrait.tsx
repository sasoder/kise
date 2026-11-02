// ---------------------------------------------------------------------------
// FiveKilosThreeKiloPortrait (pushp-trailer, cut 30, 9:16). The portrait twin of FiveKilosThreeKilo (V3, frozen). Core
// memory podcast style, the archive collage at 9:16: the show's squared paper turned 90 degrees is the world, every real
// thing is a black-and-white cut-out on it. Opaque 1080x1920, 23.976 fps, 120 frames; finals --scale 2.
//
// CHECK LINE: a small aircraft hauls up a load much heavier than itself.
//
// THE LINE: "What we've managed to do is we're lifting five kilos of payload with a three kilo aircraft."
// WORD -> FRAME: we've 2 · managed 11 · do 21 · is 27 · we're 34 · lifting 40 · five 47 · kilos 55 · of 62 ·
//   payload 68 · with 73 · a 85 · three 91 · kilo 97 · aircraft 102 · speech ends ~119
// DURATION: the slot 30.948 -> 35.953 s = 5.005 s x 23.976 = 120 frames (f0..f119). The trailer plays f0-115; settled by f108.
//
// THE MOTION: recomposed for the height, same beats as the 16:9. Already in motion on f0: a slow push, the slack tether
// swinging up out of the top of the frame, the clouds drifting. A blank iron weight nearly as wide as the frame sits on a
// print of Indian farmland. The tether goes taut f41 (cause), the weight's right side comes up about its left corner (first
// reaction), and on "five" the stamp is struck into the iron (landed f47) as it leaves the ground (air under the whole base
// by f52), the chain rising off its shoulders. The print sinks a long way down the frame and shrinks, the shadow on it
// shrinking and softening. From "with" f73 one eased tilt and pull-back brings the aircraft down into the top of the frame,
// wing tip to wing tip. On "three" the 3 KG comes down behind the wing at the upper right, stepped up from the 5 KG; a white
// ink leader curves from the fuselage's right side, under the wing, round the outside of its ring to its right shoulder, touching on "aircraft" (f102). To the last frame the aircraft pitches
// and heaves against the swinging load.
//
// LAYOUT (end frame, screen px): aircraft across the top; 5 KG hanging from it low left, stamp above the first caption
// band, base in the gap between the bands; 3 KG stepped up to the right, its ring behind the wing, stamp clear of the 5 KG's
// ring. Side by side at level does not fit at this size, so the 5 KG's right shoulder overlaps the 3 KG's lower corner.
//
// CHAIN (one meaning in this clip): what Airbound's aircraft outdoes. One sting: the 5 KG on "five kilos", off its
// shoulders only, rising f47-55 and back into the iron by about f78.
// AREAS: 3 KG drawn at sqrt(0.6) of the 5 KG's height = 60 % of its area.
//
// SOURCES: as FiveKilosThreeKilo: fk_land.png from Airbound's own aerial (fields_clean_healed.jpg); aircraft_flight_ai.png
// and iron_weight_ai.png AI-made from Airbound's photos / for this cut; clouds from public/zach-kelly-johnson (Fortepan,
// plate_sky_cumulus). All cut in scripts/clips/pushp-trailer/bake-five-kilos.ts.
// 5 kg on 3 kg is the speaker's own figure (episode ~12:48); the director flags it in the hand-off.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CHAIN, CROWN_STEP, Inked, PhotoCutOut, SHADOW, Silhouette, chainProgress, clamp, fontFamily, runCamera2 } from "../neal-stephenson-trailer/nealShared";
import { CaptionBands9x16, H9, NealFilmLife9x16, NealTallPaper, W9, type TallCam } from "../neal-stephenson-trailer/nealPortraitShared";
import { AIRCRAFT_FILTER, DURATION, FPS, defaultProps, schema } from "./FiveKilosThreeKilo";

export { DURATION, FPS, defaultProps, schema };

// -- assets --------------------------------------------------------------------
const IRON = "pushp-trailer/fk_iron.png";
const IRON_ASPECT = 751 / 995;
const AIR = "pushp-trailer/fk_aircraft.png";
const AIR_ASPECT = 1884 / 719;
const LAND = "pushp-trailer/fk_land.png";
const LAND_SOFT = "pushp-trailer/fk_land_soft.png";
const LAND_ASPECT = 3276 / 940;
const CLOUD_A = "pushp-trailer/fk_cloud_a.png";
const CLOUD_A_ASPECT = 2353 / 1207;
const CLOUD_B = "pushp-trailer/fk_cloud_b.png";
const CLOUD_B_ASPECT = 469 / 266;

const IRON_FILTER = "grayscale(1) sepia(0.14) contrast(1.02) brightness(1.08)";
const CLOUD_DARK_FILTER = "grayscale(1) sepia(0.14) contrast(0.6) brightness(1.3) blur(0.3px)";
const LAND_FILTER = "grayscale(1) sepia(0.14) contrast(0.8) brightness(1.3)";

// -- the rig, in world px at k = 1 (the end frame) ----------------------------------
const H5 = 880;
const H3 = H5 * Math.sqrt(0.6);
const AIR_W = 870; // ~900 on screen at the end
const AIR_H = AIR_W / AIR_ASPECT;
const BELLY = { x: 0.584, y: 0.716 };
const RING_Y = 0.03;
const BASE_Y = 0.985;
const TETHER = 315;
const TETHER_OFF = 600; // while the aircraft is off frame
const LEAN0 = 14; // the tether's lean at lift-off, degrees
const LEAN1 = 24; // as the aircraft hauls it along

const LAND_W = 3000;
const LAND_H = LAND_W / LAND_ASPECT;
const CONTACT = { u: 0.35, y: 300 };

const deg = (a: number) => (a * Math.PI) / 180;
const LIFT_OFF = 47;
const TAUT = 41;
const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], { easing: e, ...clamp });

const CAM_F = [0, 44, 60, 70, 100, 119];
const CAM_K = [1.2, 1.35, 1.37, 1.34, 1.02, 1.0];
const K_REF = CAM_K[0];
const CAM_BY = [1490, 1528, 1528, 1520, 1395, 1385];
const CAM_BX = [556, 540, 536, 516, 441, 437];
const PRE = 24;
const PRE_F = [0, ...CAM_F.map((v) => v + PRE)];
const PRE_K = [1.12, ...CAM_K];
const PRE_BY = [1470, ...CAM_BY];
const PRE_BX = [566, ...CAM_BX];

const ss = (v: number, a: number, b: number) => {
  const x = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
/** The ground as it leaves, screen px: the speed ramps in over f44-49 (no snap), holds, then eases away. */
const SINK_TABLE: number[] = (() => {
  const t = [0];
  for (let i = 1; i <= DURATION; i++) t.push(t[i - 1] + 10 * ss(i, 44, 49) * (1 - 0.99 * ss(i, 58, 112)));
  return t;
})();
const SINK = SINK_TABLE[114];
const sinkOf = (f: number) => SINK_TABLE[Math.max(0, Math.min(DURATION, Math.round(f)))];
const flowOf = (f: number) => {
  const r = 58;
  if (f <= LIFT_OFF) return 0;
  if (f < r) return (5 * (f - LIFT_OFF) ** 2) / (2 * (r - LIFT_OFF));
  return (5 * (r - LIFT_OFF)) / 2 + 5 * (f - r);
};
const LAND_FLOW = 0.72;
/** Everything that climbs past (clouds, paper): one eased rise with a creep. */
const riseOf = (f: number) => 760 * ease(f, 44, 112, Easing.bezier(0.45, 0, 0.3, 1)) + f * 0.25 + Math.max(0, f - 112) * 1;

// -- pieces --------------------------------------------------------------------
/** A weight, as in the 16:9 (copied, that file is frozen). Local coords: top-left of its box. */
const Weight: React.FC<{ h: number; label: string; crown?: number[] | null; strike?: number; icon?: boolean }> = ({ h, label, crown, strike = 1, icon }) => {
  const w = h * IRON_ASPECT;
  const fs = 0.222 * h;
  const stampTop = 0.386 * h;
  const place = { src: IRON, x: 0, y: 0, w, aspect: IRON_ASPECT, anchor: "top-left" as const };
  const text: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: stampTop,
    width: w,
    textAlign: "center",
    fontFamily,
    fontWeight: 900,
    fontSize: fs,
    lineHeight: 1,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  };
  const iconW = 0.56 * w;
  const iconX = (w - iconW) / 2;
  const iconY = 0.64 * h;
  const step = (CROWN_STEP - 2) * 1.5;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      <Silhouette {...place} colour={SHADOW} dx={7} dy={7} />
      {crown ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, clipPath: "polygon(0 29%, 33% 29%, 33% 42%, 67% 42%, 67% 29%, 100% 29%, 100% 100%, 0 100%)" }}>
          {CHAIN.map((c, i) => (crown[i] > 0 ? <Silhouette key={c} {...place} colour={c} dx={0} dy={-(3 - i) * step * crown[i]} /> : null))}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, isolation: "isolate" }}>
        <Img src={staticFile(IRON)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none", filter: IRON_FILTER }} />
        {strike > 0 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, opacity: Math.min(1, strike * 2), transformOrigin: `50% ${stampTop + fs / 2}px`, transform: `scale(${1 + 0.2 * (1 - strike)})` }}>
            <div style={{ ...text, color: "#000", transform: `translate(${0.006 * h}px, ${0.006 * h}px)` }}>{label}</div>
            <div style={{ ...text, color: "#F4F2EC" }}>{label}</div>
          </div>
        ) : null}
        {icon ? (
          <>
            <Silhouette src={AIR} x={iconX} y={iconY} w={iconW} aspect={AIR_ASPECT} anchor="top-left" colour="#000" dx={0.006 * h} dy={0.006 * h} />
            <Silhouette src={AIR} x={iconX} y={iconY} w={iconW} aspect={AIR_ASPECT} anchor="top-left" colour="#F4F2EC" />
          </>
        ) : null}
        <Img src={staticFile(IRON)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none", mixBlendMode: "multiply", filter: "grayscale(1) brightness(3.4) contrast(0.9)" }} />
      </div>
    </div>
  );
};

const Rotor: React.FC<{ frame: number; x: number; y: number; len: number; tilt: number; seed: number }> = ({ frame, x, y, len, tilt, seed }) => {
  const c = Math.cos(frame * 2.05 + seed);
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <ellipse cx={0} cy={0} rx={len} ry={len * 0.2} fill="#6f6d68" opacity={0.2 + 0.05 * Math.sin(frame * 1.3 + seed)} />
      <line x1={-len * c} y1={0} x2={len * c} y2={0} stroke="#111" strokeWidth={len * 0.09} strokeLinecap="round" opacity={0.38} />
    </g>
  );
};

const Cloud: React.FC<{ src: string; aspect: number; x: number; y: number; w: number; s: number; flip?: boolean; filter?: string; off?: number }> = ({ src, aspect, x, y, w, s, flip, filter, off = 4 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${x}px, ${y}px) scale(${s})` }}>
    <PhotoCutOut src={src} aspect={aspect} x={0} y={0} w={w} anchor="center" flipX={flip} filter={filter} shadowOff={off} />
  </div>
);

// -- the cut ---------------------------------------------------------------------
const FiveKilosThreeKiloPortrait: React.FC<{ bands: boolean }> = ({ bands }) => {
  const frame = useCurrentFrame();
  const f = frame;

  const c = runCamera2(f + PRE, PRE_F, PRE_BY, PRE_BX, PRE_K);
  const k = c.k;
  const by = c.cy;
  const bx = c.cx;

  const sink = sinkOf(f);
  const flow = flowOf(f);
  const travel = LAND_FLOW * flow;
  const rise = riseOf(f);
  const hgt = Math.min(1, sink / SINK);

  const swayAmp = interpolate(f, [LIFT_OFF, 66, 119], [0, 2.3, 1.9], clamp);
  const sway = swayAmp * Math.sin((f - LIFT_OFF) * 0.125);
  const effort = -2.1 * ease(f, TAUT - 3, LIFT_OFF, Easing.inOut(Easing.sin)) * (1 - ease(f, LIFT_OFF + 1, 68));

  // the 5 KG, placed by its ring so the tether is exact
  const hs = H5 * k;
  const ws = hs * IRON_ASPECT;
  const baseLeft = { x: bx - ws / 2, y: by };
  const ringRest = { x: bx, y: by - (BASE_Y - RING_Y) * hs };
  const rad = deg(effort);
  const vx = ringRest.x - baseLeft.x;
  const vy = ringRest.y - baseLeft.y;
  const heave = 6 * ss(f, 76, 96) * Math.sin((f - LIFT_OFF) * 0.125 + 1.1);
  const ring = {
    x: baseLeft.x + vx * Math.cos(rad) - vy * Math.sin(rad),
    y: baseLeft.y + vx * Math.sin(rad) + vy * Math.cos(rad) + heave,
  };
  const angle5 = effort + sway;

  // the tether: slack and alive, taut at f41, then leaning harder as the aircraft hauls the load along
  const taut = ease(f, 26, TAUT, Easing.inOut(Easing.quad));
  const lean = interpolate(f, [0, TAUT, 66, 98], [8, LEAN0, LEAN0, LEAN1], clamp);
  const phi = deg(lean + 3.5 * (1 - taut) * Math.sin(f * 0.1) + 1.1 * sway);
  const dir = { x: Math.sin(phi), y: -Math.cos(phi) };
  const tetherNow = interpolate(f, [66, 98], [TETHER_OFF, TETHER], { easing: Easing.inOut(Easing.sin), ...clamp });
  const belly = { x: ring.x + dir.x * tetherNow * k, y: ring.y + dir.y * tetherNow * k };
  const tetherPts: string[] = [];
  const tetherLen = taut >= 1 ? tetherNow * k : 900;
  for (let i = 0; i <= 40; i++) {
    const s = i / 40;
    const a = 90 * (1 - taut) * Math.sqrt(s) * Math.sin(s * 7.2 - f * 0.17);
    tetherPts.push(`${ring.x + dir.x * tetherLen * s - dir.y * a},${ring.y + dir.y * tetherLen * s + dir.x * a}`);
  }

  // the aircraft: pivots about the tether point on its belly, flying along its nose, straining
  const airS = k * (1 + 0.05 * ease(f, 80, 119));
  const pitch = -11 - 1.2 * Math.sin(f * 0.11 + 1) - 1.05 * sway;
  const rollX = 7 + 3 * Math.sin(f * 0.07);
  const rollY = -6 + 4 * Math.sin(f * 0.05 + 0.6);
  const airTransform: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: AIR_W,
    height: AIR_H,
    transform: `translate(${belly.x - BELLY.x * AIR_W}px, ${belly.y - BELLY.y * AIR_H}px) scale(${airS}) perspective(1500px) rotateX(${rollX}deg) rotateY(${rollY}deg) rotateZ(${pitch}deg)`,
    transformOrigin: `${BELLY.x * AIR_W}px ${BELLY.y * AIR_H}px`,
  };
  const airBox = (
    <div style={airTransform}>
      <Silhouette src={AIR} x={0} y={0} w={AIR_W} aspect={AIR_ASPECT} anchor="top-left" colour={SHADOW} dx={5} dy={5} />
      <Img src={staticFile(AIR)} style={{ position: "absolute", left: 0, top: 0, width: AIR_W, height: AIR_H, maxWidth: "none", filter: AIRCRAFT_FILTER }} />
      <svg viewBox="0 0 1884 719" width={AIR_W} height={AIR_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Rotor frame={f} x={640} y={118} len={138} tilt={18} seed={0.4} />
        <Rotor frame={f} x={1682} y={364} len={92} tilt={16} seed={2.1} />
      </svg>
    </div>
  );
  const airOn = f >= 60;

  // the 3 KG: comes down from above, behind the wing, and rides with the aircraft. Barely swings: it is not a load.
  const in3 = interpolate(f, [84, 104], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), ...clamp });
  const three = {
    x: belly.x + interpolate(in3, [0, 1], [150, 223]) * k,
    y: belly.y + interpolate(in3, [0, 1], [-780, 53]) * k,
  };
  const sway3 = 0.5 * Math.sin((f - 84) * 0.1 + 0.6) * in3;

  // the leader, white ink: aircraft = this weight. Fuselage dot first, the tip drawn across to the weight's far shoulder.
  const lead = ease(f, 91, 102, Easing.inOut(Easing.quad));
  const pr = deg(pitch);
  const aL = { x: 93 * airS, y: -47 * airS }; // the fuselage's lower right, near the wing root, on the far side from the rope
  const leadA = { x: belly.x + aL.x * Math.cos(pr) - aL.y * Math.sin(pr), y: belly.y + aL.x * Math.sin(pr) + aL.y * Math.cos(pr) };
  const r3 = deg(sway3);
  const bL = { x: 0.38 * H3 * IRON_ASPECT * k, y: (0.385 - RING_Y) * H3 * k };
  const leadB = { x: three.x + bL.x * Math.cos(r3) - bL.y * Math.sin(r3), y: three.y + bL.x * Math.sin(r3) + bL.y * Math.cos(r3) };
  // one gentle curve, leaving the hull below the wing, through the gap between the wing's fin and the ring, round the outside of the ring; the control point rides with the 3 KG, so it clears the ring through the sway
  const leadC = { x: three.x + 236 * k, y: three.y - 45 * k };
  const leadPts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * lead;
    const u = 1 - t;
    leadPts.push(`${u * u * leadA.x + 2 * u * t * leadC.x + t * t * leadB.x},${u * u * leadA.y + 2 * u * t * leadC.y + t * t * leadB.y}`);
  }
  const dotA = 11 * ss(f, 89, 92);
  const dotB = 11 * ss(f, 100, 103);

  const strike = interpolate(f, [43, 47], [0, 1], { easing: Easing.in(Easing.quad), ...clamp });

  const crownUp = chainProgress(f, 46);
  const crown = crownUp.map((v, i) => v * (1 - ease(f, 64 + 2 * (2 - i), 74 + 2 * (2 - i))));

  // the land print: locked to the weight until lift-off, then it sinks a long way, shrinks and slides back
  const shrink = 1 - 0.11 * ease(f, LIFT_OFF, 114, Easing.bezier(0.45, 0, 0.3, 1));
  const ls = (k / K_REF) * shrink;
  const contactX = bx - travel;
  const contactY = by + sink;
  const landX = contactX - CONTACT.u * LAND_W * ls;
  const landY = contactY - CONTACT.y * ls;

  const shW = ws * interpolate(hgt, [0, 1], [1.06, 0.5], clamp);
  const shH = shW * interpolate(hgt, [0, 0.12, 1], [0.13, 0.08, 0.16], clamp);
  const shDrop = 22 * ss(f, 45, 52);
  const shX = bx + 40 * hgt * k;
  const shBlur = interpolate(hgt, [0, 1], [5, 9], clamp);
  const shOp = interpolate(hgt, [0, 1], [0.86, 0.68], clamp);

  const cast = ease(f, LIFT_OFF, 90);

  const cam: TallCam = { x: W9 / 2 + flow, y: H9 / 2 - rise, k: k / CAM_K[5], x0: W9 / 2, y0: H9 / 2 };

  const cl = (x0: number, y0: number, par: number, drift: number) => ({
    x: x0 - flow * par - f * drift,
    y: y0 + rise * par,
    s: (k / K_REF) ** Math.min(1, par),
  });
  const a = cl(1130, 1200, 0.45, 0.9); // sits behind the horizon the whole way, its rough lower edge never in sight
  const b = cl(90, 330, 0.5, 1.2); // leaves by the left edge before the end
  const c2 = cl(1000, 170, 0.9, 1.4); // passes behind the 5 KG and stays hidden by its body
  const top = cl(1363, 457, 0.85, 1.2); // comes in from the right into the space under the 3 KG

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <NealFilmLife9x16 frame={f}>
        <NealTallPaper frame={f} cam={cam} />
        <Cloud src={CLOUD_A} aspect={CLOUD_A_ASPECT} x={a.x} y={a.y} w={620} s={a.s} filter={CLOUD_DARK_FILTER} />
        <Cloud src={CLOUD_B} aspect={CLOUD_B_ASPECT} x={b.x} y={b.y} w={400} s={b.s} />
        <Cloud src={CLOUD_B} aspect={CLOUD_B_ASPECT} x={c2.x} y={c2.y} w={340} s={c2.s} flip />
        <Cloud src={CLOUD_B} aspect={CLOUD_B_ASPECT} x={top.x} y={top.y} w={380} s={top.s} />

        {/* the land print lying on the paper */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `translate(${landX}px, ${landY}px) scale(${ls})` }}>
          <Img src={staticFile(LAND_SOFT)} style={{ position: "absolute", left: 0, top: -7, width: LAND_W, height: LAND_H, maxWidth: "none", opacity: 0.2 }} />
          <PhotoCutOut src={LAND} aspect={LAND_ASPECT} x={0} y={0} w={LAND_W} anchor="top-left" filter={LAND_FILTER} shadowOff={7} shade="linear-gradient(rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.42) 5%, rgba(0,0,0,0) 17%)" />
        </div>
        {/* the weight's shadow on the land */}
        <div
          style={{
            position: "absolute",
            left: shX - shW / 2,
            top: contactY + shDrop - shH / 2,
            width: shW,
            height: shH,
            borderRadius: "50%",
            background: "#000",
            opacity: shOp,
            filter: `blur(${shBlur}px)`,
          }}
        />

        {/* soft casts on the paper once they are in the air */}
        {cast > 0 ? (
          <div style={{ position: "absolute", inset: 0, filter: "blur(14px)", opacity: 0.3 * cast }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: H5 * IRON_ASPECT,
                height: H5,
                transformOrigin: `${0.5 * H5 * IRON_ASPECT}px ${RING_Y * H5}px`,
                transform: `translate(${ring.x - 0.5 * H5 * IRON_ASPECT + 44 * cast}px, ${ring.y - RING_Y * H5 + 50 * cast}px) rotate(${angle5}deg) scale(${k})`,
              }}
            >
              <Silhouette src={IRON} x={0} y={0} w={H5 * IRON_ASPECT} aspect={IRON_ASPECT} anchor="top-left" colour={SHADOW} />
            </div>
            {in3 > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: H3 * IRON_ASPECT,
                  height: H3,
                  transformOrigin: `${0.5 * H3 * IRON_ASPECT}px ${RING_Y * H3}px`,
                  transform: `translate(${three.x - 0.5 * H3 * IRON_ASPECT + 24}px, ${three.y - RING_Y * H3 + 46}px) rotate(${sway3}deg) scale(${k})`,
                }}
              >
                <Silhouette src={IRON} x={0} y={0} w={H3 * IRON_ASPECT} aspect={IRON_ASPECT} anchor="top-left" colour={SHADOW} />
              </div>
            ) : null}
            {airOn ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${44 + 10 * Math.sin(f * 0.05)}px, ${70 + 8 * Math.sin(f * 0.07)}px)` }}>
                <div style={airTransform}>
                  <Silhouette src={AIR} x={0} y={0} w={AIR_W} aspect={AIR_ASPECT} anchor="top-left" colour={SHADOW} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* the 3 KG behind the aircraft and behind the 5 KG */}
        {in3 > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: H3 * IRON_ASPECT,
              height: H3,
              transformOrigin: `${0.5 * H3 * IRON_ASPECT}px ${RING_Y * H3}px`,
              transform: `translate(${three.x - 0.5 * H3 * IRON_ASPECT}px, ${three.y - RING_Y * H3}px) rotate(${sway3}deg) scale(${k})`,
            }}
          >
            <Weight h={H3} label="3 KG" icon />
          </div>
        ) : null}

        {/* the tether, behind the ring's top and the aircraft */}
        <svg width={W9} height={H9} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <polyline points={tetherPts.join(" ")} fill="none" stroke="#0b0b0b" strokeWidth={5.5 * k} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* the 5 KG */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: H5 * IRON_ASPECT,
            height: H5,
            transformOrigin: `${0.5 * H5 * IRON_ASPECT}px ${RING_Y * H5}px`,
            transform: `translate(${ring.x - 0.5 * H5 * IRON_ASPECT}px, ${ring.y - RING_Y * H5}px) rotate(${angle5}deg) scale(${k})`,
          }}
        >
          <Weight h={H5} label="5 KG" crown={crown} strike={strike} />
        </div>

        {airOn ? airBox : null}

        {/* the leader: ink, drawn across, on top of everything */}
        {dotA > 0 ? (
          <svg width={W9} height={H9} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Inked
              render={(col) => (
                <>
                  {lead > 0 ? <polyline points={leadPts.join(" ")} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" /> : null}
                  <circle cx={leadA.x} cy={leadA.y} r={dotA} fill={col} />
                  {dotB > 0 ? <circle cx={leadB.x} cy={leadB.y} r={dotB} fill={col} /> : null}
                </>
              )}
            />
          </svg>
        ) : null}
      </NealFilmLife9x16>
      <CaptionBands9x16 on={bands} />
    </AbsoluteFill>
  );
};

export default FiveKilosThreeKiloPortrait;
