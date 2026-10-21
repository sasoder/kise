// ---------------------------------------------------------------------------
// rodentFigures: Europe's people in RodentFromCentralAsia (kyle-pandemics, cut 1). The engraved commoners of the
// Kyle London cast (londonCastV2 Worker, read-only: cap / bare-headed, front / three-quarter, with the form shadow),
// rasterised ONCE per variant and ink to sprites (cream = alive, DEAD = fallen) and blitted on a canvas through the
// cut's camera, far to near: feet on the map ground plane, scale and haze by depth, a contact shadow under each.
// As the front reaches a figure, every second one (rodentCamera FIGURES: a fixed alternating pick in the order the
// front reaches them) falls: it topples to the west about its feet (gravity: slow off the vertical, fast to the
// ground), drains to DEAD as it goes and lies on the ground. The others stay standing, cream.
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { POSES, Worker, scaleForPx, type Ink } from "../kyle-london/londonCastV2";
import { FIGURES, FIG_H, H, W, fallAt, hazeAt, toScreen, type Cam } from "./rodentCamera";

const DARK = "#17120D";
const LAND = "#3F3428";
const CREAM: Ink = { main: "#E9DDBF", deep: "#D3C5A2", hair: "#8C7F60" };
const DEAD: Ink = { main: "#8A7B62", deep: "#76694F", hair: "#544A39" };

/** sprite: units box round a man (feet at 0, 0), px per unit */
const BOX = { x0: -120, x1: 120, y0: -345, y1: 30 };
const SPX = 210; // sprite px for a man (soles to skull)
const SC = scaleForPx(SPX);
const SW = Math.ceil((BOX.x1 - BOX.x0) * SC) + 2;
const SH = Math.ceil((BOX.y1 - BOX.y0) * SC) + 2;
const FOOT_X = -BOX.x0 * SC + 1;
const FOOT_Y = -BOX.y0 * SC + 1;
const VARIANTS = 4;
const poseOf = (v: number) => (v === 0 || v === 3 ? POSES.front() : POSES.stand(v === 1 ? 1 : -1));
const capOf = (v: number) => v < 2;
type Sprite = { img: HTMLCanvasElement; sil: HTMLCanvasElement };
const SPRITES = new Map<string, Sprite>();

const SpriteSource: React.FC<{ v: number; dead: boolean }> = ({ v, dead }) => (
  <svg data-sprite={`${v}-${dead ? 1 : 0}`} xmlns="http://www.w3.org/2000/svg" width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`}>
    <Worker pose={poseOf(v)} at={[FOOT_X, FOOT_Y]} scale={SC} uid={`rf${v}${dead ? "d" : "a"}`} coat={dead ? DEAD : CREAM} ink={dead ? DEAD : CREAM} cap={capOf(v)} shade={1} />
  </svg>
);
const rasterise = (key: string, node: Element) =>
  new Promise<void>((resolve, reject) => {
    const svg = new XMLSerializer().serializeToString(node);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = SW;
      c.height = SH;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);
      const s = document.createElement("canvas");
      s.width = SW;
      s.height = SH;
      const sx = s.getContext("2d") as CanvasRenderingContext2D;
      sx.drawImage(img, 0, 0);
      sx.globalCompositeOperation = "source-in";
      sx.fillStyle = LAND;
      sx.fillRect(0, 0, SW, SH);
      SPRITES.set(key, { img: c, sil: s });
      resolve();
    };
    img.onerror = () => reject(new Error(`rodentFigures: sprite ${key} did not rasterise`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

/** the screen direction of the map's west at a ground point (unit), for the fall */
const westOnScreen = (cam: Cam, x: number, y: number) => {
  const a = toScreen(cam, x, 0, y);
  // west ~ -RIGHT rotated to the local camera: use the camera's own right axis on the ground
  const b = toScreen(cam, x - cam.r[0] * 20, 0, y - cam.r[2] * 20);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
};

const drawFigures = (ctx: CanvasRenderingContext2D, cam: Cam, frame: number, scale: number) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const vis = FIGURES.map((q) => ({ q, s: toScreen(cam, q.x, 0, q.y) }))
    .filter(({ s }) => s.z > 10 && s.x > -120 && s.x < W + 120 && s.y > -60 && s.y < H + 260)
    .sort((a, b) => b.s.z - a.s.z);
  for (const { q, s } of vis) {
    const hPx = FIG_H * s.s;
    if (hPx < 3) continue;
    const k = hPx / SPX;
    const fall = fallAt(q, frame);
    const haze = hazeAt(Math.hypot(q.x - cam.C[0], cam.C[1], q.y - cam.C[2]), cam.D);
    // contact shadow: an ellipse on the ground, lower right of the feet; it stretches under a falling body
    const fore = Math.max(0.12, Math.abs(toScreen(cam, q.x, 0, q.y - 10).y - toScreen(cam, q.x, 0, q.y + 10).y) / (20 * s.s));
    const [wx] = westOnScreen(cam, q.x, q.y);
    const dirX = wx < 0 ? -1 : 1;
    const rx = hPx * (0.2 + 0.32 * fall);
    const ry = Math.max(1, hPx * 0.2 * fore);
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - haze);
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.ellipse(s.x + hPx * 0.06 + dirX * hPx * 0.42 * fall, s.y + ry * 0.25, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // the body: about its feet, toppling west; drained to DEAD on the way down
    const ang = dirX * (Math.PI / 2) * (0.92 + 0.12 * ((q.seed * 0.618) % 1)) * fall;
    const v = q.variant % VARIANTS;
    const alive = SPRITES.get(`${v}-0`);
    const dead = SPRITES.get(`${v}-1`);
    if (!alive || !dead) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(1, 1 - 0.32 * fall * (1 - fore));
    ctx.rotate(ang);
    ctx.scale(k, k);
    const dT = Math.max(0, Math.min(1, (fall - 0.08) / 0.7));
    const draw = (im: HTMLCanvasElement, a: number) => {
      if (a <= 0.003) return;
      ctx.globalAlpha = a;
      ctx.drawImage(im, -FOOT_X, -FOOT_Y);
    };
    draw(alive.img, 1 - dT);
    draw(dead.img, dT);
    // atmospheric depth: toward the page (the cut's one haze, weighted up for the cream figures so a far crowd recedes)
    draw(alive.sil, Math.min(0.92, haze * 1.8));
    ctx.restore();
  }
};

/** the figures' canvas (full frame) */
export const RodentFigures: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const bench = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(SPRITES.size === VARIANTS * 2);
  const [handle] = useState(() => (SPRITES.size === VARIANTS * 2 ? null : delayRender("rodentFigures: rasterising the sprites", { timeoutInMilliseconds: 120000 })));
  const scale = typeof window === "undefined" ? 1 : Math.min(1, window.devicePixelRatio || 1);
  const done = useRef(false);
  useEffect(() => {
    if (ready) return;
    const nodes = Array.from(bench.current?.querySelectorAll("svg[data-sprite]") ?? []);
    Promise.all(nodes.map((n) => rasterise(n.getAttribute("data-sprite") as string, n)))
      .then(() => setReady(true))
      .catch((e) => cancelRender(e));
  }, [ready]);
  useLayoutEffect(() => {
    if (!ready) return;
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawFigures(ctx, cam, frame, scale);
    if (handle !== null && !done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [ready, cam, frame, scale, handle]);
  return (
    <>
      <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      {ready ? null : (
        <div ref={bench} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
          {Array.from({ length: VARIANTS }, (_, v) => [false, true].map((d) => <SpriteSource key={`${v}${d}`} v={v} dead={d} />))}
        </div>
      )}
    </>
  );
};
