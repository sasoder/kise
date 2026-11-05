// ---------------------------------------------------------------------------
// JumpedOntoLegacyBanks (nik-neobanks-us, cut 28). Cheeky Pint style (stout) in real 3D (bankWorld.tsx on nuclearWorld's stage).
// RENDER --gl=angle. Opaque 1080x1920, 23.976 fps, 94 frames.
//
// CHECK LINE: "Instead of becoming banks, the startups climbed on top of the old ones."
//
// THE LINE: "And as a result, they jumped into partnerships with legacy banks"
// WORD -> FRAME: as 2 · a result 11-19 · they 20 · jumped 22-36 · into 37 · partnerships 44-54 · with 55 · legacy 67-77 · banks 78-89
// DURATION: the slot 28.403 -> 32.324 s = 3.921 s x 23.976 = 94 frames (f0..f93).
//
// THE MOTION: one continuous camera drift into a truck along a street of banks. It opens on one big cream bank right of centre
// ("BANK" on its frieze), its next neighbour a dim part at the right edge, and one amber phone standing alone on the bare board to
// its left, already easing up a hair. On "they jumped" the phone lifts one elevation (takeoff f16, apex f32) and travels in one
// eased arc up and over the cornice onto the back of the bank's roof deck, its board shadow left behind and a contact shadow
// gathering under it on the roof, and settles without bounce: its descent eases to zero speed at the deck, so CONTACT and FIRST SETTLED FRAME are both f44 (0.12 units
// above the deck at f43). From f24 the camera eases back a little and trucks right along the row (yaw 7 -> 13, a gentle diagonal).
// Each later bank waits toned toward the board until the camera brings it in, its phone standing on the board in front of it;
// as the bank lights the phone hops up and back onto its roof (phone 1 f40-62, 2 f54-74, 3 f60-76). On "legacy banks" the frame
// holds two whole banks (~380-400 px) and parts at both edges, every roof carrying an amber phone (~180 px); then a creep.
// CAUSE: a phone's roof contact shadow forms under it only in the last 3.2 units of its descent (none while it is high), crisp at
// contact; no phone moves before its hop starts, and every hop starts as its bank lights.
// AMBER = THE NEOBANK (the startup's app); cream = the legacy banks; board = context. Nothing glows but the phones.
//
// SOURCES: no figures on screen. The real referent is US banking-as-a-service (e.g. Chime's accounts held at partner banks, The
// Bancorp Bank and Stride Bank): the app is the startup, the licence and compliance stay with the old bank. Only text: the frieze.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, SoftShadows, nuclearCamAt, nuclearProject, nuclearTrack, type NuclearCam, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { BANK, LegacyBank, NeobankPhone, PHONE, bankRoofOf, phoneShadowItems } from "./bankWorld";

export const FPS = 24000 / 1001;
export const DURATION = 94;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

// --- the row: banks on one line along X, facing the opening camera, close together (a street of banks). The hero's bank stands
// alone on its left (bank -1 sits well off, never in frame), so the hero phone has bare board. Each later phone waits on the board
// in front of its own bank, a little left of centre, and hops up and back onto that bank's roof deck.
const PITCH = 34;
const ROW = [-1, 0, 1, 2, 3, 4, 5, 6, 7];
const bankX = (n: number) => (n >= 0 ? n * PITCH : -58 + (n + 1) * PITCH);
const PS = 0.32; // phone scale: 16 units tall (the roof deck is at 16.75 on a 20.6-tall bank); ~265 px at f0, ~170 px at the end
const ROOF = bankRoofOf([0, 0]);
const DECK_Y = ROOF[1];
// phones stand toward the back of the deck: from the camera's height the deck shows in front of the foot, behind the pediment
const PZ = 6.5;

// the hop: lift one elevation (apex HOP_UP over the deck), travel over the cornice, settle on the deck with zero speed
const HOP_UP = 6.2;
const APEX_U = 0.55;
const ROOF_NEAR = 3.2; // the roof contact shadow shows only in the last 3.2 units of a phone's descent onto a deck
type Hop = { f0: number; dur: number };
// the wave follows the light: a bank waits toned toward the board until the camera brings it in (bankDim), and its phone starts
// to hop as it lights (phone 1 f40, 2 f54, 3 f60 as bank 3 comes in at the right edge); the ones never seen land early. All
// landed by f76.
const WAVE: Record<number, Hop> = { 0: { f0: 16, dur: 28 }, 1: { f0: 40, dur: 22 }, 2: { f0: 54, dur: 20 }, 3: { f0: 60, dur: 16 } };
const hopOf = (n: number): Hop => WAVE[n] ?? { f0: 54, dur: 20 };
const waitAt = (n: number): [number, number] => (n === 0 ? [-29, PZ] : [bankX(n) - 7, -17]);
/** world position of phone n at frame f: x, base height y, z; u = hop progress */
const phoneAt = (n: number, f: number) => {
  const xr = bankX(n);
  const [x0, z0] = waitAt(n);
  const h = hopOf(n);
  const u = c01((f - h.f0) / h.dur);
  // it lifts first, then travels: the base clears the cornice and the pediment before it is over them (checked by sampling)
  const p = smooth(n === 0 ? 0.2 : 0.3, 1, u);
  const apex = DECK_Y + HOP_UP;
  let y = u < APEX_U ? apex * smooth(0, APEX_U, u) : apex + (DECK_Y - apex) * smooth(APEX_U, 1, u);
  // the hero is already easing up a hair before its hop; that lift folds into the descent
  if (n === 0) y += 1.1 * smooth(-10, 20, f) * (1 - smooth(APEX_U, 1, u));
  return { x: x0 + (xr - x0) * p, y, z: z0 + (PZ - z0) * p, u };
};

// --- the roof shadow: a phone over a deck casts onto it (the stage's shadows land only on the board). The same capsule as nuclearWorld's
// SoftShadows, clipped to the deck, drawn after the bank and blended to the same shadow colour and strength.
const RS_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RS_FRAG = /* glsl */ `
uniform vec3 uC; uniform vec4 uA; uniform vec4 uB; uniform vec2 uDir; uniform vec4 uDeck;
uniform vec2 uFogRange; uniform vec3 uFogCol;
varying vec3 vW;
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  // deck clip (world x0, x1, z0, z1), a hair soft
  float clip = smoothstep(uDeck.x, uDeck.x + 0.25, p.x) * (1.0 - smoothstep(uDeck.y - 0.25, uDeck.y, p.x))
             * smoothstep(uDeck.z, uDeck.z + 0.25, p.y) * (1.0 - smoothstep(uDeck.w - 0.25, uDeck.w, p.y));
  vec2 d = uDir; vec2 s = vec2(-d.y, d.x);
  vec2 r = p - uA.xy;
  vec2 q = vec2(dot(r, d), dot(r, s));
  float t = clamp(q.x / max(uA.z, 0.0001), 0.0, 1.0);
  float soft = uB.y * (0.35 + 3.0 * t);
  float rad = uB.x * (1.0 + 0.25 * t);
  vec2 c = vec2(q.x - clamp(q.x, 0.0, uA.z), q.y);
  float a = 1.0 - smoothstep(rad - soft, rad + soft, length(c));
  a *= mix(1.0, 0.55, t);
  a *= uB.z * clip;
  if (a < 0.002) discard;
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(uC, a * (1.0 - fg));
}`;
const RoofShadow: React.FC<{ atX: number; item: ShadowItem | null; fog: [number, number] }> = ({ atX, item, fog }) => {
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(BANK.W + 4, BANK.ROOF_Z1 - BANK.ROOF_Z0 + 4);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      vertexShader: RS_VERT,
      fragmentShader: RS_FRAG,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        uC: { value: hex(COLOR.shadow) },
        uA: { value: new THREE.Vector4() },
        uB: { value: new THREE.Vector4() },
        uDir: { value: new THREE.Vector2(1, 0) },
        uDeck: { value: new THREE.Vector4() },
        uFogRange: { value: new THREE.Vector2(1e5, 2e5) },
        uFogCol: { value: hex(COLOR.ground) },
      },
    });
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = 4;
    return { me, m };
  }, []);
  // the deck: the cornice top, three z ROOF_Z0..ROOF_Z1 (world Z = -z), full width under the pediment's back
  const zc = -(BANK.ROOF_Z0 + BANK.ROOF_Z1) / 2;
  o.me.position.set(atX, DECK_Y + 0.05, -zc);
  const u = o.m.uniforms;
  u.uDeck.value.set(atX - BANK.W / 2 - 0.05, atX + BANK.W / 2 + 0.05, -BANK.ROOF_Z1, -BANK.ROOF_Z0);
  u.uFogRange.value.set(fog[0], fog[1]);
  o.me.visible = !!item && (item.alpha ?? 1) > 0.001;
  if (item) {
    u.uA.value.set(item.x, item.z, item.len, 0);
    u.uB.value.set(item.r, item.soft ?? item.r * 0.6, (item.alpha ?? 1) * 0.46, 0);
    u.uDir.value.set(item.dirX ?? 1, item.dirZ ?? 0);
  }
  return <primitive object={o.me} />;
};

// --- the camera: one damped track. A slow drift from before f0 (the hop's direction), then from f24 it eases back a little and
// trucks right along the row (yaw 7 -> 13, a gentle diagonal), close enough that two whole banks fill the frame with parts at both
// edges, the row's middle near y 850. Then a creep.
const CAM0: NuclearCam = { tx: -4, ty: 11, tz: 2, d: 82, yaw: 7, pitch: 22, f: 1500, cx: 640, cy: 700 };
const TRACK = nuclearTrack(
  CAM0,
  [
    { f0: -20, f1: 60, to: { tx: 1, pitch: 28, yaw: 9 } },
    { f0: 24, f1: 76, to: { tx: 54, ty: 12, d: 136, yaw: 13, pitch: 25, cy: 782, cx: 540 } },
    { f0: 72, f1: 150, to: { tx: 59 } },
  ],
  DURATION,
);
/** a bank's tone: toward the board while it waits at the right frame edge, cream once the camera has brought it in */
const bankDim = (n: number, cam: NuclearCam) => {
  if (n === 0) return 0;
  const sx = nuclearProject(cam, [bankX(n), 10, 0]).x;
  return Math.max(smooth(960, 1260, sx), 1 - smooth(-180, 120, sx));
};
const FOG: [number, number] = [1.6, 6];

const JumpedOntoLegacyBanks: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 600;
  const cam = nuclearCamAt(TRACK, f);
  const fogUnits: [number, number] = [cam.d * FOG[0], cam.d * FOG[1]];
  const phones = ROW.map((n) => ({ n, ...phoneAt(n, f) }));
  // the board shadows: one call for the group; a phone's board shadow lightens with its lift and is gone once it is on a deck
  const boardShadows: ShadowItem[] = [];
  phones.forEach((p) => {
    const a = 1 - smooth(0.82, 1, p.u);
    if (a <= 0) return;
    phoneShadowItems([p.x, p.z], { scale: PS, lift: p.y, alpha: a }).forEach((s) => boardShadows.push(s));
  });
  return (
    <NuclearStage
      cam={cam}
      S={S}
      fog={FOG}
      boardUnits={120}
      pool={{ x: 560, y: 800, strength: 1 }}
      world={
        <>
          <SoftShadows items={boardShadows} />
          {ROW.map((n) => (
            <LegacyBank key={`b${n}`} at={[bankX(n), 0]} dim={0.82 * bankDim(n, cam)} />
          ))}
          {phones.map((p) => {
            // the roof contact shadow: nothing while the phone is high; in the last ROOF_NEAR units of its descent it gathers directly
            // under the phone (no offset, so nothing runs ahead of it), shrinking and darkening, and is crisp at contact, where the
            // standing phone's own cast along the key grows in with it
            const over = Math.max(0, p.y - DECK_Y);
            const near = 1 - smooth(0, ROOF_NEAR, over);
            const base = near > 0 ? phoneShadowItems([p.x, p.z], { scale: PS, lift: 0, alpha: 1 })[0] : null;
            const half = PHONE.W * 0.5 * PS - PHONE.T * 0.75 * PS;
            const item = base
              ? {
                  ...base,
                  len: 2 * half + (base.len - 2 * half) * near * near,
                  r: base.r * (1 + 1.6 * (1 - near)),
                  soft: (base.soft ?? base.r * 0.6) * (1 + 3 * (1 - near)),
                  alpha: near * near,
                }
              : null;
            return <RoofShadow key={`s${p.n}`} atX={bankX(p.n)} item={item} fog={fogUnits} />;
          })}
          {phones.map((p) => (
            <NeobankPhone key={`p${p.n}`} at={[p.x, p.z]} y={0} lift={p.y} scale={PS} shadow={0} />
          ))}
        </>
      }
    />
  );
};

export default JumpedOntoLegacyBanks;

// world sizes this cut assumes (asserted so a bankWorld change shows up at load, not as a phone floating off a roof)
if (Math.abs(PHONE.H - 50) > 1e-6 || Math.abs(BANK.W - 30) > 1e-6) throw new Error("JumpedOntoLegacyBanks: bankWorld sizes changed; re-plan the row and the hop");
