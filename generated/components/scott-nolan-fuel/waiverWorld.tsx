// ---------------------------------------------------------------------------
// waiverWorld: the props of WaiverRunsOut (scott-nolan-fuel, cut 30), on nuclearWorld's stage. RENDER --gl=angle.
// The sea lane St Petersburg -> Baltimore on the tall map, the UF6 transport cylinders (amber = fuel), the cream depots (with
// a door light and a shutter), the empty slot in the US land. World units as in nuclearWorld (X right, Y up, Z north; map: mapProjectTall).
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { nuclearMaterial, withClayAttrs } from "../scott-nolan-uranium/nuclearWorld";
import { CYL_ASPECT, LANE, laneAt } from "./waiverMotion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
export type V3 = [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hex3 = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

export { LANE, laneAt, laneSOf } from "./waiverMotion";
const LANE_N = LANE.n;

// ===================================================================================================================
// THE LANE RIBBON: a thin flat strip on the board, lit (warm cream, low) where fuel still runs, drained to board dim where it
// no longer does. lit(s) comes in as a small texture (1 x 512) written each frame.
// ===================================================================================================================
const LIT_N = 512;
const RIB_VERT = /* glsl */ `
attribute float aS;
varying float vS;
varying vec3 vW;
varying float vAcross;
attribute float aAcross;
void main() {
  vS = aS;
  vAcross = aAcross;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RIB_FRAG = /* glsl */ `
uniform sampler2D uLit;
uniform float uLen;
uniform vec3 uOn;
uniform vec3 uOff;
uniform vec3 uFogCol;
uniform vec2 uFogRange;
varying float vS;
varying vec3 vW;
varying float vAcross;
void main() {
  float lit = texture2D(uLit, vec2(clamp(vS / uLen, 0.0, 1.0), 0.5)).r;
  vec3 col = mix(uOff, uOn, lit);
  // soft edges across the strip, held to about a pixel by the derivative
  float w = fwidth(vAcross) * 1.2;
  float a = 1.0 - smoothstep(1.0 - w, 1.0, abs(vAcross));
  float fg = smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition));
  gl_FragColor = vec4(mix(col, uFogCol, fg), a * mix(0.55, 1.0, lit));
}`;
export const LaneRibbon: React.FC<{ lit: (s: number) => number; halfWidth: (s: number) => number; yAt?: (s: number) => number }> = ({ lit, halfWidth, yAt = () => 0.18 }) => {
  const o = useMemo(() => {
    const n = LANE_N;
    const pos = new Float32Array((n + 1) * 2 * 3);
    const aS = new Float32Array((n + 1) * 2);
    const aA = new Float32Array((n + 1) * 2);
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const s = LANE.ss[i];
      const p = laneAt(s);
      const nx = -p.tz;
      const nz = p.tx;
      for (let k = 0; k < 2; k++) {
        const side = k === 0 ? -1 : 1;
        const j = i * 2 + k;
        pos[j * 3] = p.x + nx * side * halfWidth(s);
        pos[j * 3 + 1] = yAt(s);
        pos[j * 3 + 2] = -(p.z + nz * side * halfWidth(s));
        aS[j] = s;
        aA[j] = side;
      }
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
    g.setAttribute("aAcross", new THREE.BufferAttribute(aA, 1));
    g.setIndex(idx);
    const data = new Uint8Array(LIT_N * 4);
    const tex = new THREE.DataTexture(data, LIT_N, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    const shared = nuclearMaterial("glass").uniforms;
    const on = hex3(COLOR.cream).map((v, i) => lerp(v, hex3(COLOR.ground)[i], 0.32));
    const off = hex3(COLOR.board).map((v, i) => lerp(v, hex3(COLOR.ground)[i], 0.72));
    const mat = new THREE.ShaderMaterial({
      vertexShader: RIB_VERT,
      fragmentShader: RIB_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        uLit: { value: tex },
        uLen: { value: LANE.length },
        uOn: { value: new THREE.Vector3(...on) },
        uOff: { value: new THREE.Vector3(...off) },
        uFogCol: shared.uFogCol,
        uFogRange: shared.uFogRange,
      },
    });
    const me = new THREE.Mesh(g, mat);
    me.frustumCulled = false;
    me.renderOrder = -60;
    return { me, data, tex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  for (let i = 0; i < LIT_N; i++) {
    const v = Math.round(255 * c01(lit((i / (LIT_N - 1)) * LANE.length)));
    o.data[i * 4] = v;
    o.data[i * 4 + 1] = v;
    o.data[i * 4 + 2] = v;
    o.data[i * 4 + 3] = 255;
  }
  o.tex.needsUpdate = true;
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// THE CYLINDER: a 30B UF6 transport cylinder (the one used for enriched product): 30 in across, 81 in long (2.7 : 1), plain
// body, a skirt ring at each end standing proud of the recessed 2:1 heads. Unit diameter, length CYL_ASPECT along +Y.
// Amber clay (nuclearWorld's amberFuel shading) with a clip plane, so it can slide into a port and be cut at its mouth.
// ===================================================================================================================
const cylGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const L = CYL_ASPECT;
    const R = 0.5;
    const Rs = 0.515;
    const Ri = 0.488;
    const pts: [number, number][] = [];
    // bottom head (recessed), out to the skirt's inner wall, the lip, the skirt, the body ... and back in at the top
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * (Math.PI / 2);
      pts.push([Ri * Math.sin(a) + 0.0001, 0.07 + 0.2 * (1 - Math.cos(a))]);
    }
    pts.push([Ri, 0.012], [Rs - 0.006, 0], [Rs, 0.012], [Rs, 0.13], [R + 0.004, 0.155], [R, 0.17]);
    pts.push([R, L - 0.17], [R + 0.004, L - 0.155], [Rs, L - 0.13], [Rs, L - 0.012], [Rs - 0.006, L], [Ri, L - 0.012]);
    for (let i = 10; i >= 0; i--) {
      const a = (i / 10) * (Math.PI / 2);
      pts.push([Ri * Math.sin(a) + 0.0001, L - 0.07 - 0.2 * (1 - Math.cos(a))]);
    }
    g = withClayAttrs(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 40));
    g.computeVertexNormals();
    return g;
  };
})();
const CYL_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CYL_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec4 uClip;
varying vec3 vW;
varying vec3 vN;
void main() {
  if (dot(uClip.xyz, vW) + uClip.w < 0.0) discard;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float lit = smoothstep(-0.5, 0.9, dot(n, uL));
  vec3 col = mix(uAmberFoot, uAmberTop, lit);
  col = mix(col, uAmberHot, 0.5 * pow(max(n.y, 0.0), 6.0));
  gl_FragColor = vec4(mix(col, uFogCol, smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition))), 1.0);
}`;
export type CylPose = { p: V3; dir: V3; clip?: [number, number, number, number] };
/** n cylinders of diameter D, posed each frame: p = the centre, dir = the axis (unit). Off when p is null. */
export const Cylinders: React.FC<{ poses: (CylPose | null)[]; D: number }> = ({ poses, D }) => {
  const n = poses.length;
  const o = useMemo(() => {
    const sh = nuclearMaterial("amberFuel").uniforms;
    const list = Array.from({ length: n }, () => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: CYL_VERT,
        fragmentShader: CYL_FRAG,
        side: THREE.DoubleSide,
        uniforms: { uL: sh.uL, uFogRange: sh.uFogRange, uFogCol: sh.uFogCol, uAmberTop: sh.uAmberTop, uAmberFoot: sh.uAmberFoot, uAmberHot: sh.uAmberHot, uClip: { value: new THREE.Vector4(0, 1, 0, 1e6) } },
      });
      const me = new THREE.Mesh(cylGeo(), mat);
      me.frustumCulled = false;
      me.renderOrder = 4;
      return { me, mat };
    });
    return { list, up: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(), q: new THREE.Quaternion() };
  }, [n]);
  poses.forEach((ps, i) => {
    const c = o.list[i];
    if (!ps) {
      c.me.visible = false;
      return;
    }
    c.me.visible = true;
    o.v.set(ps.dir[0], ps.dir[1], -ps.dir[2]).normalize();
    o.q.setFromUnitVectors(o.up, o.v);
    c.me.quaternion.copy(o.q);
    c.me.scale.setScalar(D);
    // the geometry runs 0..L along its axis: shift so p is the middle
    const hl = (CYL_ASPECT * D) / 2;
    c.me.position.set(ps.p[0] - o.v.x * hl, ps.p[1] - o.v.y * hl, -ps.p[2] - o.v.z * hl);
    const cl = ps.clip ?? [0, 1, 0, 1e6];
    // the clip plane comes in world (x, y, Z north); three's z = -Z
    c.mat.uniforms.uClip.value.set(cl[0], cl[1], -cl[2], cl[3]);
  });
  return (
    <>
      {o.list.map((c, i) => (
        <primitive key={i} object={c.me} />
      ))}
    </>
  );
};

// ===================================================================================================================
// CLAY HELPERS
// ===================================================================================================================
const rboxGeo = (w: number, h: number, d: number, r: number, tone = 1) => {
  // a soft-edged box: a box with its corners pulled onto a rounded shell (cheap, smooth enough at this size)
  const g = new THREE.BoxGeometry(w, h, d, 6, 6, 6);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  const hd = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const cx = Math.max(-hw, Math.min(hw, v.x));
    const cy = Math.max(-hh, Math.min(hh, v.y));
    const cz = Math.max(-hd, Math.min(hd, v.z));
    const dx = v.x - cx;
    const dy = v.y - cy;
    const dz = v.z - cz;
    const l = Math.hypot(dx, dy, dz) || 1;
    p.setXYZ(i, cx + (dx / l) * r, cy + (dy / l) * r, cz + (dz / l) * r);
  }
  g.computeVertexNormals();
  return withClayAttrs(g, tone);
};
const clayMesh = (g: Any, dim = false, order = 1) => {
  const me = new THREE.Mesh(g, nuclearMaterial(dim ? "clayDim" : "clay"));
  me.frustumCulled = false;
  me.renderOrder = order;
  return me;
};

// ===================================================================================================================
// THE DEPOT: a small cream clay store at St Petersburg, a low shed with a shallow gable roof and a dark door facing the lane.
// at = the door's centre on the ground, facing = the lane's direction out of it (unit x, z). W along the facing, D across.
// ===================================================================================================================
export const DEPOT = { W: 3.2, D: 2.0, H: 1.5, ROOF: 0.5, DOOR_W: 1.2, DOOR_H: 1.15 } as const;
const DOOR_DARK = hex3("#2A1B11");
const DOOR_WARM = hex3("#FBE2B0"); // a warm lit interior (a pale light, not the fuel's amber)
const GLOW_VERT = /* glsl */ `
varying vec2 vQ;
void main() {
  vQ = position.xy * 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const GLOW_FRAG = /* glsl */ `
uniform vec3 uCol;
uniform float uA;
varying vec2 vQ;
void main() {
  float d = length(vQ);
  if (d > 1.0) discard;
  float a = uA * pow(1.0 - d, 2.2);
  gl_FragColor = vec4(uCol, a);
}`;
/** light 0..1: the door's warm interior light (1 = lit, 0 = the dark opening); shut 0..1: the shutter over the door */
export const Depot: React.FC<{ at: [number, number]; facing: [number, number]; y: number; scale?: number; shut?: number; light?: number }> = ({ at, facing, y, scale = 1, shut = 0, light = 0 }) => {
  const o = useMemo(() => {
    const grp = new THREE.Group();
    const body = clayMesh(rboxGeo(DEPOT.W, DEPOT.H, DEPOT.D, 0.16, 0.9));
    body.position.set(-DEPOT.W / 2, DEPOT.H / 2, 0);
    grp.add(body);
    // the roof: a shallow gable along the depot's length (a prism)
    const sh = new THREE.Shape();
    sh.moveTo(-DEPOT.D / 2 - 0.12, 0);
    sh.lineTo(0, DEPOT.ROOF);
    sh.lineTo(DEPOT.D / 2 + 0.12, 0);
    sh.lineTo(-DEPOT.D / 2 - 0.12, 0);
    const rg = new THREE.ExtrudeGeometry(sh, { depth: DEPOT.W + 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
    rg.rotateY(-Math.PI / 2);
    rg.translate(0.1, DEPOT.H - 0.03, 0);
    rg.computeVertexNormals();
    const roof = clayMesh(withClayAttrs(rg, 1));
    grp.add(roof);
    // the door: a dark opening on the end wall (a thin ground-toned panel just proud of it)
    const dg = new THREE.PlaneGeometry(DEPOT.DOOR_W, DEPOT.DOOR_H);
    const dm = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...hex3("#2A1B11"), THREE.LinearSRGBColorSpace) });
    const door = new THREE.Mesh(dg, dm);
    door.rotation.y = Math.PI / 2;
    door.position.set(0.02, DEPOT.DOOR_H / 2, 0);
    door.renderOrder = 2;
    door.frustumCulled = false;
    grp.add(door);
    // the light's spill: a soft warm disc on the end wall and the water in front of the door (never writes the canvas alpha)
    const gm = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: { uCol: { value: new THREE.Vector3(...DOOR_WARM) }, uA: { value: 0 } },
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(DEPOT.DOOR_W * 3.2, DEPOT.DOOR_W * 3.2), gm);
    glow.rotation.y = Math.PI / 2;
    glow.position.set(0.12, DEPOT.DOOR_H * 0.45, 0);
    glow.renderOrder = 3;
    glow.frustumCulled = false;
    grp.add(glow);
    // the dispatch shutter: a cream clay panel that rolls down over the door from its head (shut 0 = open, 1 = closed)
    const shutter = clayMesh(rboxGeo(0.08, DEPOT.DOOR_H, DEPOT.DOOR_W + 0.14, 0.03, 1));
    shutter.position.set(0.06, DEPOT.DOOR_H / 2, 0);
    shutter.visible = false;
    grp.add(shutter);
    return { grp, shutter, dm, gm };
  }, []);
  const l = Math.max(0, Math.min(1, light));
  o.dm.color.setRGB(...(DOOR_DARK.map((v, i) => v + (DOOR_WARM[i] - v) * l) as V3), THREE.LinearSRGBColorSpace);
  o.gm.uniforms.uA.value = 0.55 * l;
  const k = Math.max(0, Math.min(1, shut));
  o.shutter.visible = k > 0.001;
  o.shutter.scale.set(1, Math.max(0.001, k), 1);
  o.shutter.position.y = DEPOT.DOOR_H * (1 - k / 2);
  // local +X is the facing (the door's outward normal); three's z = -Z
  o.grp.position.set(at[0], y, -at[1]);
  o.grp.rotation.y = Math.atan2(facing[1], facing[0]);
  o.grp.scale.setScalar(scale);
  return <primitive object={o.grp} />;
};

// ===================================================================================================================
// THE EMPTY SLOT: a rectangular opening in the land, ground-dark inside, its inner walls lit by the key. Drawn as the inside
// of an open box with depth test off after the land (the land's top would hide it otherwise), before every object.
// ===================================================================================================================
const SLOT_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uWall;
uniform vec3 uFloor;
uniform vec3 uFogCol;
uniform vec2 uFogRange;
uniform float uDepth;
uniform float uTopY;
uniform vec4 uRect;
uniform vec2 uRot;
varying vec3 vW;
varying vec3 vN;
void main() {
  // only what is seen through the opening: the view ray must cross the land's top inside the rectangle (the near rim hides the rest)
  vec3 rd = vW - cameraPosition;
  float t = (uTopY - cameraPosition.y) / rd.y;
  vec3 q = cameraPosition + rd * t;
  vec2 lq = vec2(q.x - uRect.x, q.z - uRect.y);
  lq = vec2(uRot.x * lq.x + uRot.y * lq.y, -uRot.y * lq.x + uRot.x * lq.y);
  if (abs(lq.x) > uRect.z || abs(lq.y) > uRect.w) discard;
  vec3 n = normalize(-vN);
  float floorish = smoothstep(0.6, 0.9, n.y);
  float lit = smoothstep(-0.4, 0.9, dot(n, uL));
  float h = clamp((vW.y - (uTopY - uDepth)) / uDepth, 0.0, 1.0);
  vec3 wall = mix(uFloor, uWall, (0.35 + 0.65 * lit) * (0.35 + 0.65 * h));
  vec3 col = mix(wall, uFloor, floorish);
  gl_FragColor = vec4(mix(col, uFogCol, smoothstep(uFogRange.x, uFogRange.y, length(vW - cameraPosition))), 1.0);
}`;
const SLOT_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
/** w along the unit (x, Z) direction `along` (default X), d across it */
export const EmptySlot: React.FC<{ at: [number, number]; w: number; d: number; depth: number; y: number; along?: [number, number] }> = ({ at, w, d, depth, y, along = [1, 0] }) => {
  const o = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    // drop the top face (indices of +Y face: group 2)
    const keep = g.groups.filter((gr: Any, i: number) => i !== 2);
    const idx = g.index.array;
    const ni: number[] = [];
    for (const gr of keep) for (let k = gr.start; k < gr.start + gr.count; k++) ni.push(idx[k]);
    g.setIndex(ni);
    g.clearGroups();
    const sh = nuclearMaterial("glass").uniforms;
    const mat = new THREE.ShaderMaterial({
      vertexShader: SLOT_VERT,
      fragmentShader: SLOT_FRAG,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uL: sh.uL,
        uFogCol: sh.uFogCol,
        uFogRange: sh.uFogRange,
        uWall: { value: new THREE.Vector3(...hex3(COLOR.creamFoot)) },
        uFloor: { value: new THREE.Vector3(...hex3("#3A2618")) },
        uDepth: { value: 1 },
        uTopY: { value: 0 },
        uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
        uRot: { value: new THREE.Vector2(1, 0) },
      },
    });
    const me = new THREE.Mesh(g, mat);
    me.frustumCulled = false;
    me.renderOrder = -62;
    return { me, mat };
  }, []);
  o.me.scale.set(w, depth, d);
  o.me.position.set(at[0], y - depth / 2, -at[1]);
  o.mat.uniforms.uRect.value.set(at[0], -at[1], w / 2, d / 2);
  // three's frame: x, z = -Z; the local axis along `along` in that frame is (ax, -az)
  o.mat.uniforms.uRot.value.set(along[0], -along[1]);
  o.me.rotation.y = Math.atan2(along[1], along[0]);
  o.mat.uniforms.uDepth.value = depth;
  o.mat.uniforms.uTopY.value = y;
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// THE SLOT'S RIM: a low cream kerb round the empty slot, so it reads as a site with nothing on it.
// ===================================================================================================================
export const SlotRim: React.FC<{ at: [number, number]; w: number; d: number; y: number; along?: [number, number]; rim: number }> = ({ at, w, d, y, along = [1, 0], rim }) => {
  const o = useMemo(() => {
    const grp = new THREE.Group();
    const h = rim * 0.32;
    const sides: [number, number, number, number][] = [
      // cx, cz (local), length x, length z
      [0, d / 2 + rim / 2, w + 2 * rim, rim],
      [0, -d / 2 - rim / 2, w + 2 * rim, rim],
      [w / 2 + rim / 2, 0, rim, d],
      [-w / 2 - rim / 2, 0, rim, d],
    ];
    for (const [cx, cz, lx, lz] of sides) {
      const me = clayMesh(rboxGeo(lx, h, lz, Math.min(h, rim) * 0.4, 1));
      me.position.set(cx, h / 2, cz);
      grp.add(me);
    }
    return grp;
  }, [w, d, rim]);
  o.position.set(at[0], y, -at[1]);
  o.rotation.y = Math.atan2(along[1], along[0]);
  return <primitive object={o} />;
};
