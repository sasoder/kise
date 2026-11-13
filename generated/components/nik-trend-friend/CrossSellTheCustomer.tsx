// ---------------------------------------------------------------------------
// CrossSellTheCustomer (nik-trend-friend, cut 34). Cheeky Pint style (stout board) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 166 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Revolut doesn't find a new customer for each product: it keeps adding products around the one
// customer it already has, and each one makes that customer worth more."
//
// THE LINE (John Collison): "operate in this Revolut model of developing many new additional products to
// cross-sell the customer,"
// WORD -> FRAME: operate 11 · in 31 · this 37 · Revolut 42 · model 51 · of 59 · developing 72 · many 91 · new 101 ·
// additional 114 · products 129 · to 140 · cross 145 · -sell 149 · the 154 · customer 157
// DURATION: the slot 34.701 -> 41.625 s = 6.924 s x 23.976 = 166 frames (f0..f165).
//
// THE MOTION: one customer card (an ink bust) at the hub; eight Revolut products slide out from behind it, one
// after another, each to its seat on a tall ring (filled counter-clockwise from the card, the lower half
// first), trailing a cream stem, while the camera pulls back in one long move (k ~2.0 at f0 -> 0.975) to keep
// the growing ring framed. Each product that seats lights
// an amber band at its foot and warms the customer one step toward amber; with the eighth (f138) the customer
// is full amber (f148), the one LightSweep crosses it under the ink bust (f148-162, on "the customer"
// f154-157), and the ring holds alive to f165 under the creeping camera.
// AMBER = traction: the revenue each product brings in from this one customer; cream = the products and the
// customer the line is about; the board is everything else.
//
// SEATS (contact frame = the travel's last frame; first amber frame = contact + 1, a 10-frame tone step).
// REV 1: the ring fills counter-clockwise from the card, so the lower half gets content first:
//   1 Revolut card   left         leaves f-16 (already sliding out at f0), contact f40, first amber f41
//   2 exchange       bottom-left  f26 -> contact f72,  amber f73
//   3 stocks         bottom       f38 -> contact f83,  amber f84
//   4 crypto         bottom-right f54 -> contact f94,  amber f95
//   5 savings        right        f76 -> contact f105, amber f106
//   6 insurance      top-right    f94 -> contact f116, amber f117
//   7 eSIM           top          f101 -> contact f127, amber f128
//   8 stays          top-left     f112 -> contact f138, amber f139 (customer full amber f148)
// Movers 2 and 6 run their vertical ahead (riseLead) to clear the seated side tile's corner; stays threads the
// gap between the seated card and eSIM (up out of the customer, across at y 686, up to its seat). A per-frame
// check: no mover crosses a seated tile or another mover, every mover in frame, peak tile speed < 45 px/f.
// Each product: lifted one elevation while it travels (museShared travel), settles over its last 30 %; its
// shadow grows with the share of it outside the customer (a hidden tile casts nothing).
// CAMERA: x and k on the house clock (makeClockCam); y derived from k: the customer's lower edge sits at
// screen y <= 1060 in every frame (above the caption band); from f20 the camera tilts down just enough to keep
// the bottom arc's foot inside the frame while it fills (its lower edge rises to ~y 930 at f42), easing back as it
// pulls out; the bottom arc lands below 1470.
//
// SOURCES: the Revolut "R" (generated/components/nik-trend-friend/revolutMark.ts, from
// commons.wikimedia.org/wiki/File:Revolut_logo.svg). The eight products are real Revolut products, per
// revolut.com product pages: cards, currency exchange, stock trading (Revolut Invest, 2019), crypto (2017),
// Savings, insurance, eSIM (2024), Stays (2021). Glyphs: Lucide (ISC) arrow-left-right, shield-check,
// piggy-bank, bed-double; candlestick chart, bitcoin coin and SIM card drawn here in Lucide's grammar.
// No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { CAM_REST, Customer, Product, SEATS, SWEEP_F, Stem, camAt, poolAt, productAt, warmthAt } from "./crossSellParts";

export const FPS = 24000 / 1001;
export const DURATION = 166;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CrossSellTheCustomer: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const states = SEATS.map((s) => ({ s, p: productAt(s, S) }));
  // seated (or not yet left) first, the travelling ones above them; all under the customer
  const order = [...states].sort((a, b) => Number(a.p.u > 0 && a.p.u < 1) - Number(b.p.u > 0 && b.p.u < 1));
  const sweep = (S - SWEEP_F.f0) / (SWEEP_F.f1 - SWEEP_F.f0); // linear: one even pass
  return (
    <StoutStage S={S} cam={cam} rest={CAM_REST} pool={poolAt(S)}>
      {states.map(({ s, p }) => (p.u > 0 ? <Stem key={`st${s.kind}`} x={p.x} y={p.y} k={k} /> : null))}
      {order.map(({ s, p }) =>
        p.u > 0 ? <Product key={s.kind} s={s} x={p.x} y={p.y} k={k} lift={p.lift} amber={p.amber} shadow={smoothstep(p.out / 0.6)} band={band} /> : null,
      )}
      <Customer k={k} warm={warmthAt(S)} band={band} sweep={sweep > 0 && sweep < 1 ? sweep : 0} />
    </StoutStage>
  );
};

export default CrossSellTheCustomer;
