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
// tiles slide out from behind the hub tile, one after another, each to its seat on a WIDE ring round the hub
// (round from the left, down through the bottom arc, up the right, across the top), trailing a cream stem,
// while the camera pulls back (k 1.65 at t0 -> 0.97 at t19, then easing into a creep: 0.872 at t88, still
// moving). Each tile lights its amber band from the frame it seats. From t73 the R sits ringed by eight
// products; nothing fades.
// AMBER = "this one is working" (traction); cream = Revolut and its products; the board is everything else.
//
// SAFE ZONES (the user's note, Nov 13, round 3; COMMON.md): the hub and every tile, from its first visible
// pixel, sit wholly inside the keep-in box (screen x 65-1015, y 290-1070; x <= 955 below y 900) on every frame,
// sway included; nothing goes below y 1070, so the caption bands and the dead bottom are board and light only.
// Ring (crossSellParts RP_RING, world px from the hub centre): card / savings at x -/+422 on the hub's height;
// three across the top and three across the bottom at x 0, +/-305 (y -/+320 in the middle, -/+300 at the
// corners). Resolved (t88): hub 262 px wide at (540, 680), R 153 px tall, tiles 183 px, ring x 81-999 by
// y 310-1050, gaps tile-to-tile 78-83 px, tile-to-hub 44-57 px (146 at the sides).
//
// TILES (t; file frame = t + 77). leave = travel start, wholly behind the hub; out = first frame any of it
// shows; whole = first frame wholly out from behind the hub; seat = contact frame (travel ends); amber from
// seat + 1, a 10-frame tone step:
//   1 card       left          leave t-2  out t0   whole t8   seat t19  (f75 / f77 / f85 / f96)
//   2 exchange   bottom-left   leave t6   out t8   whole t16  seat t35  (f83 / f85 / f93 / f112)
//   3 stocks     bottom        leave t13  out t17  whole t31  seat t41  (f90 / f94 / f108 / f118)
//   4 crypto     bottom-right  leave t20  out t22  whole t27  seat t47  (f97 / f99 / f104 / f124)
//   5 savings    right         leave t28  out t30  whole t39  seat t50  (f105 / f107 / f116 / f127)
//   6 insurance  top-right     leave t37  out t39  whole t45  seat t59  (f114 / f116 / f122 / f136)
//   7 eSIM       top           leave t42  out t45  whole t56  seat t64  (f119 / f122 / f133 / f141)
//   8 stays      top-left      leave t52  out t55  whole t66  seat t73  (f129 / f132 / f143 / f150)
// Each tile reads as arrived ~70 % into its window (restToRest's long landing). The neighbours sit closer than a
// tile's width, so each corner tile takes its own way out: exchange and insurance run their vertical ahead
// (riseLead), clear of the seated card / savings; crypto runs its horizontal ahead (lead < 0), clear of stocks;
// stays, the last, threads the one gap between the seated card and eSIM (a vertical leg 212 left of the hub
// centre, then into its seat). Each tile is lifted one elevation while it travels (museShared travel) and
// settles over its last 30 %; its shadow grows with the share of it outside the hub (a hidden tile casts
// nothing). No product shows before t0.
// CAMERA: x and k on the house clock (makeClockCam, file frames); y from k with the hub's centre pinned at
// screen y 680, the middle of the keep-in box (no tilt). Handle: k 1.96 -> 1.90 (hub width -0.26 px/f) to
// ~f64, then the pull-back accelerates into t0 (peak -13.8 px/f of hub width at ~t1) and has settled by t25
// into the creep (-0.1 -> -0.21 px/f, still moving at t88). The card's seat (t19) is the ring's widest point,
// so the camera has to be near the resolved scale by then. A lean toward the card (hub centre x 540 at f60 ->
// 622 at t12 -> 540 by t45). camCheck: max screen speed 22.3 px/f, max |dv| 1.94 px/f^2.
// Per-frame check (scratch sim, real parts module): keep-in excess 0 px on every frame (+/-3/5 px sway), the
// hub in the box f0..f165; visible overlap between two tiles at most ~320 screen px^2 (an ~18 px corner
// graze, crypto/savings t33-34, both in flight; the rest <= 100); no seated tile touched; tile screen speed
// <= 37 px/f (was 54).
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
