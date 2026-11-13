// ---------------------------------------------------------------------------
// RevolutProducts (nik-trend-friend, cut 34; replaces CrossSellTheCustomer, delivered under the same file name
// 34_CrossSellTheCustomer.mov). Cheeky Pint style (stout board) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 166 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Revolut is one company that keeps putting out product after product: card, exchange, stocks,
// crypto, savings, insurance, eSIM, stays."
//
// THE LINE (John Collison): "[...this Revolut model of developing] many new additional products to cross-sell
// the customer,"
// THE SLOT: the user cut the V8 item in two and switched the first half off; the live part is sequence
// 37.913 -> 41.625 s = 89 frames, playing FILE frames 77..165. LEAD = 77, t = file frame - 77 (t0..t88).
// WORD -> t: (developing -5) · many 14 · new 24 · additional 37 · products 52 · to 63 · cross 68 · -sell 72 ·
// the 77 · customer 80
// DURATION: the slot 34.701 -> 41.625 s = 6.924 s x 23.976 = 166 frames (f0..f165), kept so the open project's
// link and in-point stay valid.
//
// THE MOTION: Revolut's real R on a cream hub tile, big, in the middle. The handle (f0..f76, t < 0) is the hub
// alone under a very slow drift back that runs without a break into the cut's pull-back. From t0 eight product
// tiles slide out from behind the hub tile, one after another, each along its own spoke to its seat on a tall
// ring (round from the left, down through the bottom arc, up the right, across the top), trailing a cream stem,
// while the camera pulls back in one long move (k 1.76 at t0 -> 1.02 at t88, still creeping). Each tile lights
// its amber band from the frame it seats. From t73 the R sits ringed by eight products; nothing fades.
// AMBER = "this one is working" (traction); cream = Revolut and its products; the board is everything else.
//
// TILES (t; file frame = t + 77). leave = travel start, wholly behind the hub; out = first frame any of it
// shows; seat = contact frame (travel ends); amber from seat + 1, a 10-frame tone step. Leaves ~8 frames apart:
//   1 card       left          leave t-2  out t0   seat t19  (f75 / f77 / f96)
//   2 exchange   bottom-left   leave t6   out t9   seat t35  (f83 / f86 / f112)
//   3 stocks     bottom        leave t13  out t16  seat t41  (f90 / f93 / f118)
//   4 crypto     bottom-right  leave t20  out t21  seat t47  (f97 / f98 / f124)
//   5 savings    right         leave t27  out t29  seat t50  (f104 / f106 / f127)
//   6 insurance  top-right     leave t37  out t39  seat t59  (f114 / f116 / f136)
//   7 eSIM       top           leave t42  out t45  seat t64  (f119 / f122 / f141)
//   8 stays      top-left      leave t52  out t55  seat t73  (f129 / f132 / f150)
// The bottom tiles travel longest (24-29 frames, the long spokes under the caption hole); up to four are in
// flight at once around t20. Each tile reads as arrived ~70 % into its window (restToRest's long landing).
// Insurance and stays run their vertical ahead (riseLead) so they clear the seated side tile's corner. Each
// tile is lifted one elevation while it travels (museShared travel) and settles over its last 30 %; its shadow
// grows with the share of it outside the hub (a hidden tile casts nothing). No product shows before t0.
// CAMERA: x and k on the house clock (makeClockCam, file frames); y from k with the hub's lower edge pinned at
// screen y 1060 (the pull-back is anchored there; no tilt). Handle: k 1.93 -> 1.76 under 0.5 px/f until ~f62,
// then the pull-back accelerates into t0 (peak ~t10) and decelerates into a creep to the last frame. A lean
// left with the card (f68-98), back to centre as the right fills (f98-136).
// Per-frame check (scratch sim): no seated tile in the caption bands or out of frame, no tile out of frame
// while travelling, no mover over a seated tile or over another mover (beyond rounded-corner grazes),
// tile screen speed <= 54 px/f.
//
// SOURCES: the Revolut "R" (generated/components/nik-trend-friend/revolutMark.ts, from
// commons.wikimedia.org/wiki/File:Revolut_logo.svg). The eight products are real Revolut products, per
// revolut.com product pages: cards, currency exchange, stock trading (Revolut Invest, 2019), crypto (2017),
// Savings, insurance, eSIM (2024), Stays (2021). Glyphs: Lucide (ISC) credit-card, arrow-left-right,
// shield-check, piggy-bank, bed-double; candlestick chart, bitcoin coin and SIM card drawn in Lucide's grammar
// (crossSellParts). No figures, no text on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { Product, RP_CAM_REST, RP_LEAD, RP_SEATS, RevolutHub, Stem, productAt, rpCamAt, rpPoolAt } from "./crossSellParts";

export const FPS = 24000 / 1001;
export const DURATION = 166;
export const LEAD = RP_LEAD;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const RevolutProducts: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const t = S - LEAD;
  const cam = rpCamAt(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const states = RP_SEATS.map((s) => ({ s, p: productAt(s, t) }));
  // seated first, the travelling ones above them; all under the hub
  const order = [...states].sort((a, b) => Number(a.p.u > 0 && a.p.u < 1) - Number(b.p.u > 0 && b.p.u < 1));
  return (
    <StoutStage S={S} cam={cam} rest={RP_CAM_REST} pool={rpPoolAt(t)}>
      {states.map(({ s, p }) => (p.u > 0 ? <Stem key={`st${s.kind}`} x={p.x} y={p.y} k={k} /> : null))}
      {order.map(({ s, p }) =>
        p.u > 0 ? <Product key={s.kind} s={s} x={p.x} y={p.y} k={k} lift={p.lift} amber={p.amber} shadow={smoothstep(p.out / 0.6)} band={band} /> : null,
      )}
      <RevolutHub k={k} />
    </StoutStage>
  );
};

export default RevolutProducts;
