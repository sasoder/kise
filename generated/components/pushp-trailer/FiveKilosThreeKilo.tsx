// ---------------------------------------------------------------------------
// FiveKilosThreeKilo (pushp-trailer, cut 30), round 2. Core memory podcast style, the archive collage at 16:9
// (the Neal Stephenson / Kelly Johnson look): the show's squared paper is the world, every real thing is a
// black-and-white cut-out on it. Opaque 1920x1080, 23.976 fps, 120 frames; finals --scale 2.
//
// CHECK LINE: a small aircraft hauls up a load much heavier than itself.
//
// THE LINE: "What we've managed to do is we're lifting five kilos of payload with a three kilo aircraft."
// WORD -> FRAME: we've 2 · managed 11 · do 21 · is 27 · we're 34 · lifting 40 · five 47 · kilos 55 · of 62 ·
//   payload 68 · with 73 · a 85 · three 91 · kilo 97 · aircraft 102 · speech ends ~119
// DURATION: the slot 30.948 -> 35.953 s = 5.005 s x 23.976 = 120 frames (f0..f119).
//
// THE MOTION (round 3; the user's slot plays f0-115, settled by f108): Already in motion on f0: a visible slow push and
// pan, the slack tether swinging, the clouds drifting. A huge blank iron weight sits on a print of Indian farmland lying on
// the paper. The tether goes taut f41 (cause), the weight's right side comes up about its left corner (first reaction),
// and on "five" the stamp is struck into the iron (landed f47) as it leaves the ground (air under the whole base by f52),
// the chain rising off its shoulders. The print sinks, shrinks and slides back as the shadow on it shrinks and softens.
// From "with" f73 one eased tilt and pull-back brings down the aircraft that is pulling, flying along its nose. On "three"
// the 3 KG comes down behind the wing and rides with the aircraft; a white ink leader is drawn from the fuselage to it,
// touching on "aircraft" (f102). Ink is the annotation, the black rope is the load: the leader runs across, it does not hang.
// To the last frame the aircraft pitches and heaves against the swinging load.
//
// CHAIN (one meaning in this clip): what Airbound's aircraft outdoes. One sting: the 5 KG on "five kilos", off its
// shoulders only (never the ring or the tether point), rising f47-55 and back into the iron by about f78.
// AREAS: 3 KG drawn at sqrt(0.6) of the 5 KG's height = 60 % of its area.
//
// SOURCES: fk_land.png from Airbound's own aerial (fields_clean_healed.jpg); aircraft_flight_ai.png and
// iron_weight_ai.png AI-made from Airbound's photos / for this cut; clouds from public/zach-kelly-johnson
// (Fortepan, plate_sky_cumulus). All cut in scripts/clips/pushp-trailer/bake-five-kilos.ts.
// 5 kg on 3 kg is the speaker's own figure (episode ~12:48); the director flags it in the hand-off.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBands, CHAIN, CROWN_STEP, Inked, type NealCam, NealFilmLife, NealPaper, NealSvg, PhotoCutOut, SHADOW, Silhouette, W, chainProgress, clamp, fontFamily, runCamera2 } from "../neal-stephenson-trailer/nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({ bands: z.boolean().default(false) });
export const defaultProps = schema.parse({});

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
/** The aircraft in the iron's tonal family (use with fk_aircraft.png): dark carbon, real blacks, the checker reading. */
export const AIRCRAFT_FILTER = "grayscale(1) sepia(0.14) contrast(1.12) brightness(1.02)";
const CLOUD_DARK_FILTER = "grayscale(1) sepia(0.14) contrast(0.6) brightness(1.3) blur(0.3px)"; // never as heavy as the iron
const LAND_FILTER = "grayscale(1) sepia(0.14) contrast(0.8) brightness(1.3)";

// -- the rig, in world px at k = 1 ------------------------------------------------
const H5 = 560;
const H3 = H5 * Math.sqrt(0.6);
const AIR_W = 683; // 660 on screen at the end frame
const AIR_H = AIR_W / AIR_ASPECT;
const BELLY = { x: 0.584, y: 0.716 }; // tether point on the aircraft, of its box
const RING_Y = 0.03; // tether point on a weight, of its height (hidden behind the ring's top)
const BASE_Y = 0.985; // where the weight meets the ground, of its height
const TETHER = 126;
const TETHER_OFF = 270; // while the aircraft is off frame the rope above it is out of shot; it reads the same
const LEAN = 14; // the tether's lean forward, degrees: the load drags behind the aircraft

const LAND_W = 3000;
const LAND_H = LAND_W / LAND_ASPECT;
const CONTACT = { u: 0.35, y: 58 + 175 }; // the weight's spot on the print, in print world px (u of its width)

const deg = (a: number) => (a * Math.PI) / 180;
const LIFT_OFF = 47;
const TAUT = 41;
const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], { easing: e, ...clamp });

const CAM_F = [0, 44, 60, 70, 100, 119];
const CAM_K = [1.12, 1.25, 1.26, 1.25, 0.94, 0.92];
const K_REF = CAM_K[0]; // the print is 1:1 at the opening scale
const CAM_BY = [812, 812, 796, 790, 814, 806];
const CAM_BX = [978, 960, 955, 935, 825, 815];
// the track starts before f0, so the push is already under way on the first frame
const PRE = 24;
const PRE_F = [0, ...CAM_F.map((v) => v + PRE)];
const PRE_K = [1.05, ...CAM_K];
const PRE_BY = [812, ...CAM_BY];
const PRE_BX = [988, ...CAM_BX];

const ss = (v: number, a: number, b: number) => {
  const x = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
/** The ground as it leaves, screen px: the speed ramps in over f44-49 (no snap), holds, then eases away. Air under the whole base by f52. */
const SINK_TABLE: number[] = (() => {
  const t = [0];
  for (let i = 1; i <= DURATION; i++) t.push(t[i - 1] + 5.2 * ss(i, 44, 49) * (1 - 0.99 * ss(i, 58, 112)));
  return t;
})();
const SINK = SINK_TABLE[114];
const sinkOf = (f: number) => SINK_TABLE[Math.max(0, Math.min(DURATION, Math.round(f)))];
/** Forward flight: constant speed once under way. The land uses less of it so its right side never reaches the frame. */
const flowOf = (f: number) => {
  const r = 58; // end of the ramp
  if (f <= LIFT_OFF) return 0;
  if (f < r) return (5 * (f - LIFT_OFF) ** 2) / (2 * (r - LIFT_OFF));
  return (5 * (r - LIFT_OFF)) / 2 + 5 * (f - r);
};
const LAND_FLOW = 0.72;
/** Everything that climbs past (clouds, paper): one eased rise with a creep. */
const riseOf = (f: number) => 520 * ease(f, 44, 112, Easing.bezier(0.45, 0, 0.3, 1)) + f * 0.25 + Math.max(0, f - 112) * 1;

// -- pieces --------------------------------------------------------------------
/** A weight: iron photo core, hard shadow, stamp in the iron, optional shoulder chain. Local coords: top-left of its box.
 *  `strike` 0..1: the stamp coming down into the iron (0 = not there yet). `icon`: the aircraft's silhouette stamped below the label. */
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
  const iconW = 0.62 * w;
  const iconX = (w - iconW) / 2;
  const iconY = 0.665 * h;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      <Silhouette {...place} colour={SHADOW} dx={5} dy={5} />
      {crown ? (
        // the shoulders only: the band over the ring and the neck is cut away, its edges hidden behind the ring
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, clipPath: "polygon(0 29%, 33% 29%, 33% 42%, 67% 42%, 67% 29%, 100% 29%, 100% 100%, 0 100%)" }}>
          {CHAIN.map((c, i) => (crown[i] > 0 ? <Silhouette key={c} {...place} colour={c} dx={0} dy={-(3 - i) * (CROWN_STEP - 2) * crown[i]} /> : null))}
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
        {/* the iron's own mottling over the stamp, so it is printed on the metal rather than floating over it */}
        <Img src={staticFile(IRON)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none", mixBlendMode: "multiply", filter: "grayscale(1) brightness(3.4) contrast(0.9)" }} />
      </div>
    </div>
  );
};

/** A soft spinning disc over a baked rotor, in the aircraft's box px. */
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
const FiveKilosThreeKilo: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const f = frame;

  // the camera's track: the weight's base on screen and the focus-plane scale. One push, one tilt and pull-back.
  const c = runCamera2(f + PRE, PRE_F, PRE_BY, PRE_BX, PRE_K);
  const k = c.k;
  const by = c.cy;
  const bx = c.cx;

  const sink = sinkOf(f);
  const flow = flowOf(f);
  const travel = LAND_FLOW * flow;
  const rise = riseOf(f);
  const hgt = Math.min(1, sink / SINK);

  // the sway: nothing before lift-off, swells with the load swinging free, then calms but never stops
  const swayAmp = interpolate(f, [LIFT_OFF, 66, 119], [0, 2.3, 1.9], clamp);
  const sway = swayAmp * Math.sin((f - LIFT_OFF) * 0.125);
  // effort: right side up about the left corner of the base, then it rights itself under the tether
  const effort = -2.1 * ease(f, TAUT - 3, LIFT_OFF, Easing.inOut(Easing.sin)) * (1 - ease(f, LIFT_OFF + 1, 68));

  // the 5 KG, placed by its ring so the tether is exact
  const hs = H5 * k;
  const ws = hs * IRON_ASPECT;
  const baseLeft = { x: bx - ws / 2, y: by };
  const ringRest = { x: bx, y: by - (BASE_Y - RING_Y) * hs };
  const rad = deg(effort);
  const vx = ringRest.x - baseLeft.x;
  const vy = ringRest.y - baseLeft.y;
  // the load heaving the whole rig: one slow dip per swing, once it is well up
  const heave = 5 * ss(f, 76, 96) * Math.sin((f - LIFT_OFF) * 0.125 + 1.1);
  const ring = {
    x: baseLeft.x + vx * Math.cos(rad) - vy * Math.sin(rad),
    y: baseLeft.y + vx * Math.sin(rad) + vy * Math.cos(rad) + heave,
  };
  const angle5 = effort + sway;

  // the tether: slack and alive, taut at f41, then leaning forward with the sway
  const taut = ease(f, 26, TAUT, Easing.inOut(Easing.quad));
  const phi = deg(interpolate(f, [0, TAUT], [8, LEAN], clamp) + 3.5 * (1 - taut) * Math.sin(f * 0.1) + 1.1 * sway);
  const dir = { x: Math.sin(phi), y: -Math.cos(phi) };
  const tetherNow = interpolate(f, [66, 94], [TETHER_OFF, TETHER], { easing: Easing.inOut(Easing.sin), ...clamp });
  const belly = { x: ring.x + dir.x * tetherNow * k, y: ring.y + dir.y * tetherNow * k };
  const tetherPts: string[] = [];
  const tetherLen = taut >= 1 ? tetherNow * k : 900;
  for (let i = 0; i <= 40; i++) {
    const s = i / 40;
    const a = 78 * (1 - taut) * Math.sqrt(s) * Math.sin(s * 7.2 - f * 0.17);
    tetherPts.push(`${ring.x + dir.x * tetherLen * s - dir.y * a},${ring.y + dir.y * tetherLen * s + dir.x * a}`);
  }

  // the aircraft: pivots about the tether point on its belly; flies along its nose, straining
  const airS = k * (1 + 0.05 * ease(f, 80, 119));
  // strain: the nose hauls up and sags with each swing of the load, to the last frame
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
      <Silhouette src={AIR} x={0} y={0} w={AIR_W} aspect={AIR_ASPECT} anchor="top-left" colour={SHADOW} dx={4} dy={4} />
      <Img src={staticFile(AIR)} style={{ position: "absolute", left: 0, top: 0, width: AIR_W, height: AIR_H, maxWidth: "none", filter: AIRCRAFT_FILTER }} />
      <svg viewBox="0 0 1884 719" width={AIR_W} height={AIR_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Rotor frame={f} x={640} y={118} len={138} tilt={18} seed={0.4} />
        <Rotor frame={f} x={1682} y={364} len={92} tilt={16} seed={2.1} />
      </svg>
    </div>
  );
  const airOn = f >= 60; // far above the frame until then

  // the 3 KG: comes down from above, behind the wing, and rides with the aircraft. Barely swings: it is not a load.
  const in3 = interpolate(f, [84, 104], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1), ...clamp });
  const three = {
    x: belly.x + interpolate(in3, [0, 1], [110, 470]) * k,
    y: belly.y + interpolate(in3, [0, 1], [-760, -20]) * k,
  };
  const sway3 = 0.5 * Math.sin((f - 84) * 0.1 + 0.6) * in3;

  // the leader, white ink: aircraft = this weight. Fuselage dot first, the tip drawn across to the weight's shoulder.
  const lead = ease(f, 91, 102, Easing.inOut(Easing.quad));
  const pr = deg(pitch);
  const aL = { x: 47 * airS, y: -24 * airS };
  const leadA = { x: belly.x + aL.x * Math.cos(pr) - aL.y * Math.sin(pr), y: belly.y + aL.x * Math.sin(pr) + aL.y * Math.cos(pr) };
  const r3 = deg(sway3);
  const bL = { x: -0.3 * H3 * IRON_ASPECT * k, y: (0.385 - RING_Y) * H3 * k };
  const leadB = { x: three.x + bL.x * Math.cos(r3) - bL.y * Math.sin(r3), y: three.y + bL.x * Math.sin(r3) + bL.y * Math.cos(r3) };
  const tip = { x: leadA.x + (leadB.x - leadA.x) * lead, y: leadA.y + (leadB.y - leadA.y) * lead };
  const dotA = 9 * ss(f, 89, 92);
  const dotB = 9 * ss(f, 100, 103);

  // the stamp struck into the 5 KG: lands on "five"
  const strike = interpolate(f, [43, 47], [0, 1], { easing: Easing.in(Easing.quad), ...clamp });

  // the one chain sting: off the 5 KG's shoulders on "five kilos", back into the iron before the reveal
  const crownUp = chainProgress(f, 46);
  const crown = crownUp.map((v, i) => v * (1 - ease(f, 64 + 2 * (2 - i), 74 + 2 * (2 - i))));

  // the land print: locked to the weight until lift-off (same anchor, same scale), then it sinks, shrinks, slides back
  const shrink = 1 - 0.11 * ease(f, LIFT_OFF, 114, Easing.bezier(0.45, 0, 0.3, 1));
  const ls = (k / K_REF) * shrink;
  const contactX = bx - travel;
  const contactY = by + sink;
  const landX = contactX - CONTACT.u * LAND_W * ls;
  const landY = contactY - CONTACT.y * ls;

  // the shadow on the land: under the weight, on the print's own contact row. Shrinks and softens with height.
  const shW = ws * interpolate(hgt, [0, 1], [1.06, 0.5], clamp);
  // it thins and drops clear of the base as soon as the weight is up, so daylight shows between them
  const shH = shW * interpolate(hgt, [0, 0.12, 1], [0.13, 0.08, 0.16], clamp);
  const shDrop = 16 * ss(f, 45, 52);
  const shX = bx + 40 * hgt * k;
  const shBlur = interpolate(hgt, [0, 1], [5, 9], clamp);
  const shOp = interpolate(hgt, [0, 1], [0.86, 0.68], clamp);

  // the soft cast on the paper grows as things leave it
  const cast = ease(f, LIFT_OFF, 90);

  const cam: NealCam = { x: W / 2 + flow, y: 540 - rise, k: k / CAM_K[5] };

  const cl = (x0: number, y0: number, par: number, drift: number) => ({
    x: x0 - flow * par - f * drift,
    y: y0 + rise * par,
    s: (k / K_REF) ** Math.min(1, par),
  });
  const a = cl(1760, 600, 0.3, 0.9); // sits down behind the horizon, its lower edge out of sight until the print has sunk
  const b = cl(560, 300, 0.42, 1.6);
  const top = cl(2081, -300, 0.78, 1.2);

  return (
    <AbsoluteFill>
      <NealFilmLife frame={f}>
        <NealPaper frame={f} cam={cam} />
        {/* far clouds lie on the paper behind the print */}
        <Cloud src={CLOUD_A} aspect={CLOUD_A_ASPECT} x={a.x} y={a.y} w={560} s={a.s} filter={CLOUD_DARK_FILTER} />
        <Cloud src={CLOUD_B} aspect={CLOUD_B_ASPECT} x={b.x} y={b.y} w={430} s={b.s} />
        <Cloud src={CLOUD_B} aspect={CLOUD_B_ASPECT} x={top.x} y={top.y} w={400} s={top.s} flip />

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

        {/* soft casts on the paper once they are in the air: the offset grows with height */}
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
                  transform: `translate(${three.x - 0.5 * H3 * IRON_ASPECT + 40}px, ${three.y - RING_Y * H3 + 46}px) rotate(${sway3}deg) scale(${k})`,
                }}
              >
                <Silhouette src={IRON} x={0} y={0} w={H3 * IRON_ASPECT} aspect={IRON_ASPECT} anchor="top-left" colour={SHADOW} />
              </div>
            ) : null}
            {airOn ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transform: `translate(${58 + 10 * Math.sin(f * 0.05)}px, ${70 + 8 * Math.sin(f * 0.07)}px)` }}>
                <div style={airTransform}>
                  <Silhouette src={AIR} x={0} y={0} w={AIR_W} aspect={AIR_ASPECT} anchor="top-left" colour={SHADOW} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* the 3 KG behind the aircraft */}
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
        <svg width={W} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <polyline points={tetherPts.join(" ")} fill="none" stroke="#0b0b0b" strokeWidth={4.5 * k} strokeLinecap="round" strokeLinejoin="round" />
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

        {/* the leader: ink, drawn across, on top of both */}
        {dotA > 0 ? (
          <NealSvg>
            <Inked
              render={(c) => (
                <>
                  {lead > 0 ? <line x1={leadA.x} y1={leadA.y} x2={tip.x} y2={tip.y} stroke={c} strokeWidth={4} strokeLinecap="round" /> : null}
                  <circle cx={leadA.x} cy={leadA.y} r={dotA} fill={c} />
                  {dotB > 0 ? <circle cx={leadB.x} cy={leadB.y} r={dotB} fill={c} /> : null}
                </>
              )}
            />
          </NealSvg>
        ) : null}
      </NealFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default FiveKilosThreeKilo;
