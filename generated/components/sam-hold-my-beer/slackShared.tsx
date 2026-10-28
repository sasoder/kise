// SLACK_READY
import React, { useId } from "react";
import { loadFont } from "@remotion/google-fonts/Lato";
import { COLOR, bloomFilter, clamp01, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, bustPaths, type PersonVariant } from "../kits/cheeky-pint/museShared";

// ===========================================================================
// slackShared — the one Slack world of "sam - the slack channel called hold my beer" (Cheeky Pint S4E07,
// Sam Altman), shared by cut 6 (HoldMyBeerChannel) and cut 20 (KnockingDownProblems).
//
// THE PICTURE: a real Slack desktop window (2020s layout: aubergine top bar with the search box, aubergine
// sidebar with the workspace header, quick items, a "Channels" section of `#` rows and a rounded selection
// pill; a warm near-white conversation pane with a channel header, message rows and a composer), lying on
// the stout board as ONE object: one UnionShadow from the window's outline under the stout key light, the
// light pool and the grain of StoutStage over it. Lato 400/700/900 is Slack's face.
//
// UNITS: WORLD px = Slack CSS px of the window (the window's top-left is the world origin). Everything,
// type included, is part of the object and scales with the camera like a real screen photographed close.
// A cut frames the window with its own camera (makeClockCam); the geometry below is exported so both cuts
// frame the same window.
//
// COLOUR: Slack's own colours, except: the conversation pane is warm near-white (#FBF8F3, never pure white),
// nothing is black (Slack ink #1D1C1D is the darkest value, only on the pane and the amber pill), and the
// selection pill of the model's channel is the stout AMBER (amber = the model in this clip). Amber appears
// nowhere else (the bot "astra"'s avatar is amber too: the model).
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- Lato (Slack's face), loaded once ------------------------------------------------------------------
export const LATO = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] }).fontFamily;

// --- palette -------------------------------------------------------------------------------------------
export const SLACK = {
  topBar: "#350D36", // the top bar (darker aubergine)
  sidebar: "#3F0E40", // the sidebar (aubergine)
  sidebarHi: "#4A154B", // Slack's brand aubergine (spare)
  sidebarLine: "#5A315B", // hairlines on aubergine (white at ~0.13)
  sidebarText: "#CFC3CF", // a read channel, quick items, section titles
  sidebarBold: "#F8F5F8", // an unread channel, the workspace name
  quietPill: "#5B335C", // the ordinary selection (white at ~0.14 on aubergine; not amber)
  searchBox: "#5D3D5E", // the search box (white at 0.2 on the top bar)
  searchText: "#E7DEE7",
  pane: "#FBF8F3", // the conversation pane: warm near-white, never pure white
  ink: "#1D1C1D", // Slack ink (names, body text, the text on the amber pill)
  meta: "#616061", // times, member count, placeholder
  hairline: "#E4DFD8", // hairlines on the pane
  greek: "#E2DCD3", // a greeked (unimportant) body line
  greekDark: "#D2CBC1", // a greeked name / title
  composerLine: "#CFC9C1", // the composer's border
  cardLine: "#DDD7CF", // an attachment card's left rule and border
  reactionBg: "#EFEDEA", // a reaction chip (not mine): light grey
  reactionLine: "#E0DDD8",
  reactionMineBg: "#E5F0F7", // a reaction chip I added: Slack's blue-grey
  reactionMineLine: "#1D9BD1",
  reactionMineText: "#1264A3",
  badgeBg: "#E8E5E0", // the APP badge
  badgeText: "#616061",
  link: "#1264A3",
  windowEdge: "#22150B", // the window's fine outline (the stout shadow brown)
  traffic: { red: "#FF5F57", yellow: "#FEBC2E", green: "#28C840" },
  // the model's selection pill = the stout amber (stoutShared tokens); ink on it
  amberTop: COLOR.amberTop,
  amberFoot: mixHex(COLOR.amberTop, COLOR.amberFoot, 0.55),
  amberHot: COLOR.amberHot,
  onAmber: "#1D1C1D",
} as const;

// --- type (WORLD px = Slack px) ------------------------------------------------------------------------
export const SLACK_TYPE = {
  row: 15, // sidebar rows and quick items
  workspace: 18, // the workspace name (Lato 900)
  header: 18, // the channel header name (Lato 900)
  name: 15, // a message's author (Lato 900)
  body: 15, // a message's text (Lato 400), line pitch BODY_LH
  time: 12, // a message's time
  search: 13,
  badge: 10, // "APP"
  composer: 15,
} as const;
export const BODY_LH = 22;

// --- geometry (WORLD px; the window's top-left = world 0, 0) -------------------------------------------
export const WIN = { x: 0, y: 0, w: 1040, h: 650, r: 10, topBar: 38 } as const;
export const SIDEBAR = {
  w: 200, // sidebar width (Slack's sidebar is resizable; narrow so a zoomed row's pill fits a 9:16 frame)
  headerY: 38, // the workspace header's top (under the top bar)
  headerH: 50,
  quickY: 98, // the first quick item's top
  rowH: 28, // row pitch (quick items and channels)
  sectionGap: 12,
  pillInset: 8, // the selection pill's inset from the sidebar's sides
  pillR: 6,
  iconCx: 25, // a row's icon centre x
  textX: 38, // a row's text x
} as const;
export const MAIN = { x0: SIDEBAR.w, headerH: 50, padX: 20, avatar: 36, nameX: 68 } as const;
export const QUICK_ITEMS = ["Threads", "Activity"] as const;
/** The cut-6 channel list, top to bottom (index 5 is the model's channel; see HoldMyBeerChannel's header). */
export const CHANNELS = ["announcements", "compute", "evals", "general", "research", "astra-hold-my-beer", "random"] as const;
export const ASTRA_CHANNEL = "astra-hold-my-beer";
export const ASTRA_INDEX = 5;
/** Top y of quick item i. */
export const quickTop = (i: number) => SIDEBAR.quickY + i * SIDEBAR.rowH;
/** Top y of the "Channels" section title (after `nQuick` quick items). */
export const sectionTop = (nQuick: number = QUICK_ITEMS.length) => quickTop(nQuick) + SIDEBAR.sectionGap;
/** Top y of channel row i (under the section title). */
export const channelTop = (i: number, nQuick: number = QUICK_ITEMS.length) => sectionTop(nQuick) + SIDEBAR.rowH * (i + 1);
/** A row's text baseline from its top. */
export const ROW_BASE = 19;
/** The selection pill of a row (top y): x, y, w, h. */
export const pillRect = (top: number) => ({ x: SIDEBAR.pillInset, y: top, w: SIDEBAR.w - 2 * SIDEBAR.pillInset, h: SIDEBAR.rowH });
/** Measured on cut 6's rendered landing frame (Lato Bold 15 px, Chrome): the ink of ASTRA_CHANNEL in its row runs
 *  from world x 38.6 to 168.5 (ASTRA_TEXT_W = its ink width); with the `#` glyph the row's ink runs x 18.0 -> 168.5. */
export const ASTRA_TEXT_W = 129.9;
export const ASTRA_INK = { x0: 18.0, text0: 38.6, x1: 168.5 } as const;

// --- the redaction ---------------------------------------------------------------------------------------
/** The blur of a redacted name (world px, CSS blur on the text): unreadable at 15 px, a soft cloud. */
export const REDACT_SIGMA = 3.0;

// ===========================================================================
// SMALL GLYPHS (Lucide geometry in a 24 box, inlined; stroked)
// ===========================================================================
const LUCIDE = {
  thread: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  search: ["M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z", "m21 21-4.3-4.3"],
  chevron: ["m6 9 6 6 6-6"],
  pen: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  help: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"],
  back: ["m15 18-6-6 6-6"],
  fwd: ["m9 18 6-6-6-6"],
  clock: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z", "M12 6v6l4 2"],
  plus: ["M5 12h14", "M12 5v14"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
} as const;
export type LucideName = keyof typeof LUCIDE;
/** A Lucide glyph `size` world px square, centred on (cx, cy), stroked in `color`. */
export const Glyph: React.FC<{ name: LucideName; cx: number; cy: number; size: number; color: string; weight?: number }> = ({ name, cx, cy, size, color, weight = 2 }) => (
  <g transform={`translate(${f3(cx - size / 2)} ${f3(cy - size / 2)}) scale(${f3(size / 24)})`} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
    {LUCIDE[name].map((d, i) => (
      <path key={i} d={d} />
    ))}
  </g>
);
/** Slack's channel hash (a slanted #), centred on (cx, cy), `size` tall. */
export const HashGlyph: React.FC<{ cx: number; cy: number; size?: number; color: string; weight?: number }> = ({ cx, cy, size = 13, color, weight = 1.5 }) => {
  const s = size / 13;
  const L = (x1: number, y1: number, x2: number, y2: number) => `M${f3(cx + x1 * s)} ${f3(cy + y1 * s)}L${f3(cx + x2 * s)} ${f3(cy + y2 * s)}`;
  const d = [L(-1.0, -6, -3.4, 6), L(3.8, -6, 1.4, 6), L(-5.6, -2.1, 5.9, -2.1), L(-6.2, 2.3, 5.3, 2.3)].join("");
  return <path d={d} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" />;
};

// ===========================================================================
// THE SLACK MARK (Wikimedia Commons "Slack_icon_2019.svg", assets-src/sam-hold-my-beer/slack_icon_commons.svg;
// its four paths and real four colours, viewBox 127)
// ===========================================================================
const SLACK_MARK: { d: string; fill: string }[] = [
  {
    d: "M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z",
    fill: "#E01E5A",
  },
  {
    d: "M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z",
    fill: "#36C5F0",
  },
  {
    d: "M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z",
    fill: "#2EB67D",
  },
  {
    d: "M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z",
    fill: "#ECB22E",
  },
];
/** The real Slack mark, `size` world px square, top-left (x, y). */
export const SlackMark: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g transform={`translate(${f3(x)} ${f3(y)}) scale(${f3(size / 127)})`}>
    {SLACK_MARK.map((p, i) => (
      <path key={i} d={p.d} fill={p.fill} />
    ))}
  </g>
);

// ===========================================================================
// THE WINDOW — chrome, top bar, one shadow on the board
// ===========================================================================
export const WINDOW_D = rectPath(WIN.x, WIN.y, WIN.w, WIN.h, WIN.r);
/** The window's shadow scale (UnionShadow `s`): a flat card-thin object resting on the board. */
export const WINDOW_SHADOW_S = 2.2;
/** The search box (world px). */
export const SEARCH = { x: 260, y: 7, w: 520, h: 24, r: 6 } as const;

export const TopBar: React.FC<{ workspace?: string }> = ({ workspace = "OpenAI" }) => (
  <g>
    <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.topBar} fill={SLACK.topBar} />
    {/* traffic lights */}
    {[SLACK.traffic.red, SLACK.traffic.yellow, SLACK.traffic.green].map((c, i) => (
      <circle key={i} cx={WIN.x + 18 + i * 20} cy={WIN.y + 19} r={6} fill={c} />
    ))}
    <SlackMark x={WIN.x + 82} y={WIN.y + 11} size={16} />
    {/* history: back, forward, recent */}
    <Glyph name="back" cx={WIN.x + 120} cy={WIN.y + 19} size={16} color={SLACK.searchText} weight={2} />
    <Glyph name="fwd" cx={WIN.x + 144} cy={WIN.y + 19} size={16} color={SLACK.sidebarLine} weight={2} />
    <Glyph name="clock" cx={WIN.x + 172} cy={WIN.y + 19} size={15} color={SLACK.searchText} weight={2} />
    {/* the search box */}
    <path d={rectPath(SEARCH.x, SEARCH.y, SEARCH.w, SEARCH.h, SEARCH.r)} fill={SLACK.searchBox} />
    <Glyph name="search" cx={SEARCH.x + 16} cy={SEARCH.y + SEARCH.h / 2} size={13} color={SLACK.searchText} weight={2.2} />
    <text x={SEARCH.x + 30} y={SEARCH.y + 16.5} fontFamily={LATO} fontWeight={400} fontSize={SLACK_TYPE.search} fill={SLACK.searchText}>
      Search {workspace}
    </text>
    {/* help and the user's avatar at the far right */}
    <Glyph name="help" cx={WIN.x + WIN.w - 56} cy={WIN.y + 19} size={16} color={SLACK.searchText} weight={2} />
    <path d={rectPath(WIN.x + WIN.w - 36, WIN.y + 7, 24, 24, 5)} fill="#7A9E7E" />
    <g fill="#EEF2EC">
      {bustPaths(WIN.x + WIN.w - 24, WIN.y + 20, 15, "plain").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  </g>
);

/**
 * SlackWindow — the window as one object on the board: its shadow (one UnionShadow of the outline), the
 * rounded body (clipped), the top bar, `children` (sidebar + pane, world px), a faint key-light grade (lit
 * from the top left, as everything on the board) and a fine outline.
 */
export const SlackWindow: React.FC<{ workspace?: string; shadow?: number; children?: React.ReactNode }> = ({ workspace = "OpenAI", shadow = 1, children }) => {
  const uid = `sw${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  return (
    <g>
      <UnionShadow sil={[{ d: WINDOW_D }]} s={WINDOW_SHADOW_S} elevation="rest" strength={shadow} />
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={WINDOW_D} />
        </clipPath>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={WIN.x} y1={WIN.y} x2={WIN.x + WIN.w * 0.55} y2={WIN.y + WIN.h}>
          <stop offset="0" stopColor="#FFF4E2" stopOpacity={0.05} />
          <stop offset="0.5" stopColor="#FFF4E2" stopOpacity={0} />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={0.07} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill={SLACK.pane} />
        <rect x={WIN.x} y={WIN.y} width={SIDEBAR.w} height={WIN.h} fill={SLACK.sidebar} />
        <TopBar workspace={workspace} />
        {children}
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill={`url(#${uid}g)`} />
      </g>
      <path d={WINDOW_D} fill="none" stroke={SLACK.windowEdge} strokeOpacity={0.45} strokeWidth={0.8} />
    </g>
  );
};

// ===========================================================================
// THE SIDEBAR
// ===========================================================================
/** The workspace header: the tile, the name in Lato 900 with its chevron, the compose button; a hairline under. */
export const WorkspaceHeader: React.FC<{ name?: string }> = ({ name = "OpenAI" }) => {
  const y = SIDEBAR.headerY;
  const cy = y + SIDEBAR.headerH / 2;
  return (
    <g>
      <path d={rectPath(16, cy - 13, 26, 26, 6)} fill={SLACK.sidebarBold} />
      <text x={29} y={cy + 6.4} textAnchor="middle" fontFamily={LATO} fontWeight={900} fontSize={17} fill={SLACK.sidebar}>
        {name.slice(0, 1)}
      </text>
      <text x={52} y={cy + 6.3} fontFamily={LATO} fontWeight={900} fontSize={SLACK_TYPE.workspace} fill={SLACK.sidebarBold}>
        {name}
      </text>
      <Glyph name="chevron" cx={52 + latoBlackW(name, SLACK_TYPE.workspace) + 11} cy={cy + 1} size={14} color={SLACK.sidebarBold} weight={2.6} />
      <circle cx={SIDEBAR.w - 26} cy={cy} r={15} fill={SLACK.sidebarBold} />
      <Glyph name="pen" cx={SIDEBAR.w - 26} cy={cy} size={15} color={SLACK.sidebar} weight={2.3} />
      <rect x={0} y={y + SIDEBAR.headerH - 1} width={SIDEBAR.w} height={1} fill={SLACK.sidebarLine} />
    </g>
  );
};
/** A quick item (Threads, Activity): icon + label in the read tone. */
export const QuickItem: React.FC<{ top: number; label: string; icon: LucideName }> = ({ top, label, icon }) => (
  <g>
    <Glyph name={icon} cx={SIDEBAR.iconCx} cy={top + SIDEBAR.rowH / 2} size={15} color={SLACK.sidebarText} weight={2} />
    <text x={SIDEBAR.textX} y={top + ROW_BASE} fontFamily={LATO} fontWeight={400} fontSize={SLACK_TYPE.row} fill={SLACK.sidebarText}>
      {label}
    </text>
  </g>
);
/** The "Channels" section title with its open caret. */
export const SectionTitle: React.FC<{ top: number; label?: string }> = ({ top, label = "Channels" }) => {
  const cy = top + SIDEBAR.rowH / 2;
  return (
    <g>
      <path d={`M${SIDEBAR.iconCx - 4.5} ${f3(cy - 2.5)}L${SIDEBAR.iconCx + 4.5} ${f3(cy - 2.5)}L${SIDEBAR.iconCx} ${f3(cy + 3)}Z`} fill={SLACK.sidebarText} />
      <text x={SIDEBAR.textX} y={top + ROW_BASE} fontFamily={LATO} fontWeight={400} fontSize={SLACK_TYPE.row} fill={SLACK.sidebarText}>
        {label}
      </text>
    </g>
  );
};

/**
 * ChannelRow — `# name` in the sidebar, at row top `top`.
 *   unread     bold near-white (an unread channel) instead of the read tone
 *   quiet      0..1: the ordinary selection pill (a lighter aubergine), and the text going near-white
 *   amber      0..1: the model's selection pill; with `amberFrom` it grows sideways out of that point (the
 *              click) until it spans the row; without, it is simply there at amber >= 1
 *   ink        0..1: the on-pill text's tone toward Slack ink (default 1: ink wherever the pill is)
 *   blur       the name's redaction: σ in world px, one number for the whole name or one per character
 *              (REDACT_SIGMA = redacted). A blurred character on amber is a lighter ink (a smudge); it
 *              comes up to full ink as it sharpens.
 *   k          the camera scale (for the amber bloom's screen radii)
 */
export const ChannelRow: React.FC<{
  top: number;
  name: string;
  k: number;
  unread?: boolean;
  quiet?: number;
  amber?: number;
  amberFrom?: { x: number; y: number };
  ink?: number;
  blur?: number | readonly number[];
  bloom?: boolean;
}> = ({ top, name, k, unread = false, quiet = 0, amber = 0, amberFrom, ink, blur = 0, bloom = true }) => {
  const uid = `cr${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const p = pillRect(top);
  const pillD = rectPath(p.x, p.y, p.w, p.h, SIDEBAR.pillR);
  const a = clamp01(amber);
  const inkT = clamp01(ink ?? 1);
  // the pill grows sideways out of the click point until it spans the row (a stub at first, then the pill)
  const gx0 = amberFrom ? p.x + (amberFrom.x - p.x) * (1 - a) : p.x;
  const gx1 = amberFrom ? p.x + p.w + (amberFrom.x - p.x - p.w) * (1 - a) : p.x + p.w;
  const growD = rectPath(gx0, p.y, Math.max(0.01, gx1 - gx0), p.h, SIDEBAR.pillR);
  const baseTone = unread ? SLACK.sidebarBold : SLACK.sidebarText;
  const lit = mixHex(baseTone, SLACK.sidebarBold, clamp01(quiet));
  // the text is drawn twice: in the sidebar tone where the pill is not, in Slack ink where it is (masked by the
  // growing pill itself, so the ink arrives exactly with the amber under it); `ink` < 1 holds the on-pill text
  // part-way (default: full ink wherever the pill is)
  const onPill = mixHex(lit, SLACK.onAmber, inkT);
  const weight = unread || a > 0 ? 700 : 400;
  const chars = [...name];
  const sig = chars.map((_, i) => Math.max(0, typeof blur === "number" ? blur : blur[i] ?? 0));
  // group characters of the same blur: each group is the whole string with only its characters painted
  // (so every group shares one layout, and the sharp string is exactly the groups' union)
  const groups = new Map<number, number[]>();
  sig.forEach((s, i) => {
    const key = Math.round(s * 1000) / 1000;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const smudge = mixHex(SLACK.onAmber, SLACK.amberTop, 0.42);
  const colorAt = (s: number, on: boolean) => (on ? (s <= 0 ? onPill : mixHex(onPill, mixHex(onPill, smudge, inkT), clamp01(s / REDACT_SIGMA))) : lit);
  const tx = SIDEBAR.textX;
  const ty = top + ROW_BASE;
  const content = (on: boolean) => (
    <g>
      <HashGlyph cx={SIDEBAR.iconCx} cy={top + SIDEBAR.rowH / 2} color={on ? onPill : lit} weight={weight >= 700 ? 1.9 : 1.5} />
      {[...groups.entries()].map(([s, idx]) => {
        const set = new Set(idx);
        return (
          <text
            key={s}
            x={tx}
            y={ty}
            fontFamily={LATO}
            fontWeight={weight}
            fontSize={SLACK_TYPE.row}
            style={s > 0.0005 ? { filter: `blur(${f3(s)}px)` } : undefined}
            fill="transparent"
          >
            {groups.size === 1 ? (
              <tspan fill={colorAt(s, on)}>{name}</tspan>
            ) : (
              chars.map((c, i) => (
                <tspan key={i} fill={set.has(i) ? colorAt(s, on) : "transparent"}>
                  {c}
                </tspan>
              ))
            )}
          </text>
        );
      })}
    </g>
  );
  return (
    <g>
      {quiet > 0.001 ? <path d={pillD} fill={SLACK.quietPill} opacity={f3(clamp01(quiet))} /> : null}
      {a > 0.001 ? (
        <g>
          <defs>
            <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1={0} y1={p.y} x2={0} y2={p.y + p.h}>
              <stop offset="0" stopColor={SLACK.amberTop} />
              <stop offset="1" stopColor={SLACK.amberFoot} />
            </linearGradient>
            <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1={gx0} y1={0} x2={gx1} y2={0}>
              <stop offset="0" stopColor={SLACK.amberHot} stopOpacity={0} />
              <stop offset="0.12" stopColor={SLACK.amberHot} stopOpacity={0.8} />
              <stop offset="0.88" stopColor={SLACK.amberHot} stopOpacity={0.8} />
              <stop offset="1" stopColor={SLACK.amberHot} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={growD} fill={`url(#${uid}a)`} style={bloom ? { filter: bloomFilter(k) } : undefined} />
          {/* the hot top edge (2 screen px), just inside the pill's top, fading out before the corners */}
          {gx1 - gx0 > 4 * SIDEBAR.pillR ? <rect x={gx0 + SIDEBAR.pillR} y={p.y + 0.8 / k} width={gx1 - gx0 - 2 * SIDEBAR.pillR} height={2 / k} fill={`url(#${uid}h)`} /> : null}
        </g>
      ) : null}
      {a < 0.999 || amberFrom ? (
        a > 0.001 ? (
          <g mask={`url(#${uid}m)`}>{content(false)}</g>
        ) : (
          content(false)
        )
      ) : null}
      {a > 0.001 ? <g clipPath={`url(#${uid}p)`}>{content(true)}</g> : null}
      {a > 0.001 ? (
        <defs>
          <clipPath id={`${uid}p`}>
            <path d={growD} />
          </clipPath>
          <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-20} y={top - 20} width={SIDEBAR.w + 40} height={SIDEBAR.rowH + 40}>
            <rect x={-20} y={top - 20} width={SIDEBAR.w + 40} height={SIDEBAR.rowH + 40} fill="#fff" />
            <path d={growD} fill="#000" />
          </mask>
        </defs>
      ) : null}
    </g>
  );
};

/**
 * SlackSidebar — the whole sidebar content (the window draws the aubergine): workspace header, quick items,
 * the Channels section. `rows` overrides a channel row's props by index (selection, redaction, unread);
 * `skip` leaves a row out so a cut can draw it itself on top (e.g. with a moving pill).
 */
export const SlackSidebar: React.FC<{
  k: number;
  workspace?: string;
  channels?: readonly string[];
  rows?: Record<number, Partial<React.ComponentProps<typeof ChannelRow>>>;
  skip?: readonly number[];
}> = ({ k, workspace = "OpenAI", channels = CHANNELS, rows = {}, skip = [] }) => (
  <g>
    <WorkspaceHeader name={workspace} />
    <QuickItem top={quickTop(0)} label={QUICK_ITEMS[0]} icon="thread" />
    <QuickItem top={quickTop(1)} label={QUICK_ITEMS[1]} icon="bell" />
    <SectionTitle top={sectionTop()} />
    {channels.map((c, i) => (skip.includes(i) ? null : <ChannelRow key={c} top={channelTop(i)} name={c} k={k} {...rows[i]} />))}
  </g>
);

// ===========================================================================
// THE CONVERSATION PANE
// ===========================================================================
/** The channel header across the pane: `# name` (Lato 900), the member count at the right, a hairline. */
export const ChannelHeader: React.FC<{ name: string; members?: number; x0?: number; x1?: number; y?: number }> = ({
  name,
  members = 48,
  x0 = MAIN.x0,
  x1 = WIN.x + WIN.w,
  y = WIN.topBar,
}) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={MAIN.headerH} fill={SLACK.pane} />
    <HashGlyph cx={x0 + MAIN.padX + 6} cy={y + 25} size={15} color={SLACK.ink} weight={2.2} />
    <text x={x0 + MAIN.padX + 17} y={y + 31.5} fontFamily={LATO} fontWeight={900} fontSize={SLACK_TYPE.header} fill={SLACK.ink}>
      {name}
    </text>
    <Glyph name="chevron" cx={x0 + MAIN.padX + 17 + latoBlackW(name, SLACK_TYPE.header) + 12} cy={y + 26} size={13} color={SLACK.ink} weight={2.4} />
    {/* the member count: a small avatar stack and the number, at the right */}
    <path d={rectPath(x1 - 108, y + 13, 72, 26, 6)} fill="none" stroke={SLACK.hairline} strokeWidth={1} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={rectPath(x1 - 102 + i * 12, y + 17, 18, 18, 4)} fill={AVATAR_COLORS[(i * 2 + 1) % AVATAR_COLORS.length]} stroke={SLACK.pane} strokeWidth={1.5} />
    ))}
    <text x={x1 - 54} y={y + 31} fontFamily={LATO} fontWeight={700} fontSize={13} fill={SLACK.meta}>
      {members}
    </text>
    <rect x={x0} y={y + MAIN.headerH - 1} width={x1 - x0} height={1} fill={SLACK.hairline} />
  </g>
);

/** Avatar colours: one muted family (never amber: amber is the model). */
export const AVATAR_COLORS = ["#4E8A86", "#7A5C9E", "#B8655B", "#5E8A57", "#4271A8", "#9A6B8E", "#6B7F96"] as const;
export type AvatarSpec = { kind: "person"; color: string; variant?: PersonVariant } | { kind: "initials"; color: string; text: string } | { kind: "astra" };
/** The bot "astra"'s mark: a four-point spark in ink (the model's avatar is amber). */
const SPARK = (cx: number, cy: number, r: number) => {
  const w = r * 0.26;
  return `M${f3(cx)} ${f3(cy - r)}Q${f3(cx + w)} ${f3(cy - w)} ${f3(cx + r)} ${f3(cy)}Q${f3(cx + w)} ${f3(cy + w)} ${f3(cx)} ${f3(cy + r)}Q${f3(cx - w)} ${f3(cy + w)} ${f3(cx - r)} ${f3(cy)}Q${f3(cx - w)} ${f3(cy - w)} ${f3(cx)} ${f3(cy - r)}Z`;
};
/** A Slack avatar: a rounded square (`size`, top-left x, y) with a flat bust, initials, or astra's spark. */
export const Avatar: React.FC<{ x: number; y: number; size?: number; spec: AvatarSpec }> = ({ x, y, size = MAIN.avatar, spec }) => {
  const r = size * 0.17;
  const box = rectPath(x, y, size, size, r);
  const uid = `av${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (spec.kind === "astra") {
    return (
      <g>
        <path d={box} fill={SLACK.amberTop} />
        <path d={SPARK(x + size / 2, y + size / 2, size * 0.33)} fill={SLACK.onAmber} />
      </g>
    );
  }
  if (spec.kind === "initials") {
    return (
      <g>
        <path d={box} fill={spec.color} />
        <text x={x + size / 2} y={y + size * 0.66} textAnchor="middle" fontFamily={LATO} fontWeight={900} fontSize={size * 0.44} fill={SLACK.pane}>
          {spec.text}
        </text>
      </g>
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={box} />
        </clipPath>
      </defs>
      <path d={box} fill={spec.color} />
      <g clipPath={`url(#${uid}c)`} fill={mixHex(spec.color, SLACK.pane, 0.78)}>
        {bustPaths(x + size / 2, y + size * 0.6, size * 0.78, spec.variant ?? "plain").map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </g>
  );
};
/** The "APP" tag after a bot's name; returns its width via APP_BADGE_W. */
export const APP_BADGE_W = 30;
export const AppBadge: React.FC<{ x: number; baseline: number }> = ({ x, baseline }) => (
  <g>
    <path d={rectPath(x, baseline - 11.5, APP_BADGE_W, 15, 3)} fill={SLACK.badgeBg} />
    <text x={x + APP_BADGE_W / 2} y={baseline} textAnchor="middle" fontFamily={LATO} fontWeight={700} fontSize={SLACK_TYPE.badge} letterSpacing={0.3} fill={SLACK.badgeText}>
      APP
    </text>
  </g>
);
/** A reaction chip under a message (top-left x, y): an emoji / glyph and a count; `mine` = Slack's blue-grey. */
export const REACTION_H = 24;
export const reactionW = (count: number) => 34 + String(count).length * 8;
export const ReactionChip: React.FC<{ x: number; y: number; glyph: React.ReactNode; count: number; mine?: boolean }> = ({ x, y, glyph, count, mine = false }) => {
  const w = reactionW(count);
  return (
    <g>
      <path
        d={rectPath(x, y, w, REACTION_H, REACTION_H / 2)}
        fill={mine ? SLACK.reactionMineBg : SLACK.reactionBg}
        stroke={mine ? SLACK.reactionMineLine : SLACK.reactionLine}
        strokeWidth={1}
      />
      {typeof glyph === "string" ? (
        <text x={x + 9} y={y + 17} fontSize={14}>
          {glyph}
        </text>
      ) : (
        <g transform={`translate(${f3(x + 8)} ${f3(y + 4)})`}>{glyph}</g>
      )}
      <text x={x + 29} y={y + 16.5} fontFamily={LATO} fontWeight={700} fontSize={12} fill={mine ? SLACK.reactionMineText : SLACK.meta}>
        {count}
      </text>
    </g>
  );
};

export type MessageSpec = {
  name: string;
  time: string;
  avatar: AvatarSpec;
  app?: boolean; // the APP badge after the name (a bot)
  body?: readonly string[]; // real text, one string per line (Lato 400, ink)
  greek?: readonly number[]; // OR greeked lines: each a bar width (world px)
  attachment?: { w: number; h: number; title?: string; greek?: readonly number[] }; // a link card under the body
  reactions?: readonly { glyph: React.ReactNode; count: number; mine?: boolean }[];
};
/** A message row's height (top of the avatar to the next row's top). */
export const messageHeight = (m: MessageSpec) => {
  const lines = (m.body ?? m.greek ?? []).length;
  let h = 8 + 20 + lines * BODY_LH;
  if (m.attachment) h += m.attachment.h + 8;
  if (m.reactions?.length) h += REACTION_H + 8;
  return Math.max(h + 8, MAIN.avatar + 16);
};
/** Lato Black advances (em), for placing what follows a bold name (the time, the APP badge, a chevron). */
const LATO_BLACK_EM: Record<string, number> = {
  a: 0.53, b: 0.58, c: 0.47, d: 0.58, e: 0.53, f: 0.35, g: 0.52, h: 0.58, i: 0.27, j: 0.27, k: 0.55, l: 0.27, m: 0.86,
  n: 0.58, o: 0.57, p: 0.58, q: 0.58, r: 0.39, s: 0.44, t: 0.37, u: 0.58, v: 0.52, w: 0.78, x: 0.52, y: 0.52, z: 0.46,
  " ": 0.2, "-": 0.36, I: 0.3, M: 0.86, W: 0.95,
};
/** A Lato Black string's advance at `px` (approximate: capitals 0.68 em, digits 0.55 em). */
export const latoBlackW = (s: string, px: number = SLACK_TYPE.name) =>
  [...s].reduce((a, c) => a + (LATO_BLACK_EM[c] ?? (/[A-Z]/.test(c) ? 0.68 : /[0-9]/.test(c) ? 0.55 : 0.55)), 0) * px;
const nameW = (s: string) => latoBlackW(s, SLACK_TYPE.name);
/**
 * MessageRow — one message at row top `y` in the pane starting at `x0`: the rounded-square avatar, the bold
 * name (+ APP badge), the grey time, the body (real text or greeked bars), an optional link card and reaction
 * chips. `bodyColor` overrides the body ink (e.g. greyed rows).
 */
export const MessageRow: React.FC<{ x0?: number; y: number; m: MessageSpec; bodyColor?: string; nameColor?: string }> = ({ x0 = MAIN.x0, y, m, bodyColor = SLACK.ink, nameColor = SLACK.ink }) => {
  const ax = x0 + MAIN.padX;
  const tx = x0 + MAIN.nameX;
  const top = y + 8;
  const nameBase = top + 13;
  const nw = nameW(m.name);
  const timeX = tx + nw + 8 + (m.app ? APP_BADGE_W + 6 : 0);
  const lines = m.body ?? m.greek ?? [];
  let cursor = nameBase + 6;
  const bodyEls = lines.map((ln, i) => {
    const base = nameBase + (i + 1) * BODY_LH;
    cursor = base + 6;
    return typeof ln === "string" ? (
      <text key={i} x={tx} y={base} fontFamily={LATO} fontWeight={400} fontSize={SLACK_TYPE.body} fill={bodyColor}>
        {ln}
      </text>
    ) : (
      <path key={i} d={rectPath(tx, base - 9.5, ln as number, 10, 5)} fill={SLACK.greek} />
    );
  });
  const att = m.attachment;
  const attY = cursor + 6;
  if (att) cursor = attY + att.h + 2;
  const reactY = cursor + 6;
  return (
    <g>
      <Avatar x={ax} y={top} spec={m.avatar} />
      <text x={tx} y={nameBase} fontFamily={LATO} fontWeight={900} fontSize={SLACK_TYPE.name} fill={nameColor}>
        {m.name}
      </text>
      {m.app ? <AppBadge x={tx + nw + 6} baseline={nameBase - 1} /> : null}
      <text x={timeX} y={nameBase} fontFamily={LATO} fontWeight={400} fontSize={SLACK_TYPE.time} fill={SLACK.meta}>
        {m.time}
      </text>
      {bodyEls}
      {att ? (
        <g>
          <rect x={tx} y={attY} width={4} height={att.h} rx={2} fill={SLACK.cardLine} />
          {att.title ? (
            <text x={tx + 14} y={attY + 15} fontFamily={LATO} fontWeight={700} fontSize={SLACK_TYPE.body} fill={SLACK.link}>
              {att.title}
            </text>
          ) : null}
          {(att.greek ?? []).map((w, i) => (
            <path key={i} d={rectPath(tx + 14, attY + (att.title ? 26 : 6) + i * 18, w, 9, 4.5)} fill={i === 0 && !att.title ? SLACK.greekDark : SLACK.greek} />
          ))}
        </g>
      ) : null}
      {(m.reactions ?? []).reduce<{ x: number; els: React.ReactNode[] }>(
        (acc, r, i) => ({
          x: acc.x + reactionW(r.count) + 6,
          els: [...acc.els, <ReactionChip key={i} x={acc.x} y={reactY} glyph={r.glyph} count={r.count} mine={r.mine} />],
        }),
        { x: tx, els: [] },
      ).els}
    </g>
  );
};
/** The composer at the bottom of the pane: a rounded box with the placeholder "Message #name". */
export const COMPOSER = { h: 40, inset: 20, bottomPad: 14 } as const;
export const Composer: React.FC<{ channel: string; x0?: number; x1?: number; y?: number }> = ({ channel, x0 = MAIN.x0, x1 = WIN.x + WIN.w, y = WIN.h - COMPOSER.h - COMPOSER.bottomPad }) => (
  <g>
    <path d={rectPath(x0 + COMPOSER.inset, y, x1 - x0 - 2 * COMPOSER.inset, COMPOSER.h, 8)} fill={SLACK.pane} stroke={SLACK.composerLine} strokeWidth={1} />
    <Glyph name="plus" cx={x0 + COMPOSER.inset + 20} cy={y + COMPOSER.h / 2} size={16} color={SLACK.meta} weight={2} />
    <text x={x0 + COMPOSER.inset + 38} y={y + 25} fontFamily={LATO} fontWeight={400} fontSize={SLACK_TYPE.composer} fill={SLACK.meta}>
      Message #{channel}
    </text>
    <Glyph name="send" cx={x1 - COMPOSER.inset - 22} cy={y + COMPOSER.h / 2} size={15} color={SLACK.composerLine} weight={2} />
  </g>
);

// ===========================================================================
// THE POINTER — macOS arrow, Slack ink with a near-white keyline and a soft screen shadow
// ===========================================================================
const POINTER_D = "M0 0L0 16.2L3.9 12.6L6.6 18.9L9.3 17.8L6.7 11.6L11.9 11.6Z";
/** The pointer: (x, y) = its tip (world px); `size` its height (macOS: ~19 px at 1x); `press` 0..1 a click. */
export const SlackCursor: React.FC<{ x: number; y: number; size?: number; press?: number }> = ({ x, y, size = 19, press = 0 }) => {
  const sc = (size / 18.9) * (1 - 0.1 * clamp01(press));
  const tf = `translate(${f3(x)} ${f3(y)}) scale(${f3(sc)})`;
  return (
    <g>
      <path d={POINTER_D} transform={`translate(${f3(x + 0.6)} ${f3(y + 1.4)}) scale(${f3(sc)})`} fill={COLOR.shadow} opacity={0.32} style={{ filter: "blur(1.1px)" }} />
      <path d={POINTER_D} transform={tf} fill={SLACK.ink} stroke={SLACK.pane} strokeWidth={1.3} strokeLinejoin="round" paintOrder="stroke" />
    </g>
  );
};

// ===========================================================================
// CUT 6's PANE CONTENT (exported so cut 20 can reuse the people and the look)
// ===========================================================================
export const PEOPLE: Record<string, AvatarSpec> = {
  Maya: { kind: "person", color: AVATAR_COLORS[0], variant: "bun" },
  Daniel: { kind: "person", color: AVATAR_COLORS[4], variant: "plain" },
  Priya: { kind: "person", color: AVATAR_COLORS[1], variant: "curly" },
  Leo: { kind: "person", color: AVATAR_COLORS[3], variant: "cap" },
  Hannah: { kind: "person", color: AVATAR_COLORS[2], variant: "plain" },
  Sam: { kind: "person", color: AVATAR_COLORS[6], variant: "plain" },
  astra: { kind: "astra" },
};
/** #general as cut 6 opens on it: greeked bodies (unimportant), real names; every name stays clear of the
 *  caption bands along cut 6's whole push (rows at y 96, 184, 250, 356; the last carries a tall greeked link card,
 *  so no name sits low in the pane, where the push would carry it through the bands). */
export const GENERAL_MESSAGES: { y: number; m: MessageSpec }[] = [
  { y: 96, m: { name: "Maya", time: "9:41 AM", avatar: PEOPLE.Maya, greek: [520, 380] } },
  { y: 184, m: { name: "Daniel", time: "9:58 AM", avatar: PEOPLE.Daniel, greek: [440] } },
  { y: 250, m: { name: "Priya", time: "10:12 AM", avatar: PEOPLE.Priya, greek: [600, 470, 210] } },
  { y: 334 + 22, m: { name: "Leo", time: "10:30 AM", avatar: PEOPLE.Leo, greek: [380], attachment: { w: 420, h: 150, greek: [220, 380, 340, 360, 300, 240, 330, 190] } } },
];
