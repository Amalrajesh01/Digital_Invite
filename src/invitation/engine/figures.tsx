import type { CSSProperties, ReactNode } from "react";
import type { FigureStyle } from "@/domain/doc/event-types";

/**
 * The two small illustrated figures (bride and groom). Hand-drawn vector art in one consistent, quiet style:
 * faceless, slender, long garments, gold trims that follow the theme's accent colour. No external assets.
 *
 * Every figure is drawn on a 100 × 200 canvas, standing on y = 198. The arm that reaches towards the partner
 * is its own group (`.fig-arm`) that the journey rotates with the `--join` custom property: 0 = hanging at the
 * side, 1 = extended so the two hands meet.
 */
export interface Palette {
  skin: string; skinShade: string; hair: string; gold: string; goldLight: string; blush: string;
  red: string; redDeep: string; redLight: string; ivory: string; ivoryShade: string; saffron: string; marigold: string;
  white: string; navy: string; rose: string; green: string;
}

export const PALETTE: Palette = {
  skin: "#C58B63", skinShade: "#B27853", hair: "#1D1511", gold: "#D6AC47", goldLight: "#F0D98C", blush: "#D9707A",
  red: "#A8142F", redDeep: "#7A0E23", redLight: "#C42A47", ivory: "#F6EDD8", ivoryShade: "#E6D8B8", saffron: "#E5802B", marigold: "#F4A81E",
  white: "#FFFFFF", navy: "#1F2A44", rose: "#C9626E", green: "#2F6B52",
};

/** The same palette, but gold follows the invitation's accent colour (a CSS variable), with a safe fallback. */
export const THEMED_PALETTE: Palette = { ...PALETTE, gold: "var(--c-accent, #D6AC47)", goldLight: "color-mix(in srgb, var(--c-accent, #D6AC47) 55%, #fff)" };

type P = { p: Palette };

const armStyle = (dir: 1 | -1, sx: number, sy: number): CSSProperties => ({
  transformOrigin: `${sx}px ${sy}px`,
  transform: `rotate(calc(var(--join, 0) * ${dir * 30}deg))`,
});

/** A slender arm: sleeve over the upper arm, skin forearm, a hand and optional bangles. Drawn hanging from (sx, sy). */
function Arm({ p, sx, sy, dx = 0, sleeve, sleeveLen = 0.5, cuff, bangles, dir, className }: P & { sx: number; sy: number; dx?: number; sleeve: string; sleeveLen?: number; cuff?: string; bangles?: string[]; dir: 1 | -1; className?: string }) {
  const len = 62;
  const ex = sx + dx, ey = sy + len;
  const mx = sx + (ex - sx) * sleeveLen, my = sy + (ey - sy) * sleeveLen;
  return (
    <g className={className} style={className ? armStyle(dir, sx, sy) : undefined}>
      <path d={`M${sx} ${sy} L${ex} ${ey}`} stroke={p.skin} strokeWidth="4.4" strokeLinecap="round" fill="none" />
      <path d={`M${sx} ${sy} L${mx} ${my}`} stroke={sleeve} strokeWidth="6.4" strokeLinecap="round" fill="none" />
      {cuff && <path d={`M${mx - 3.4} ${my} L${mx + 3.4} ${my}`} stroke={cuff} strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${(Math.atan2(dx, len) * -180) / Math.PI} ${mx} ${my})`} />}
      {bangles?.map((c, i) => (
        <path key={i} d={`M${ex - 2.6 - dx * 0.0} ${ey - 5 - i * 1.9} L${ex + 2.6} ${ey - 5 - i * 1.9}`} stroke={c} strokeWidth="1.3" strokeLinecap="round" transform={`rotate(${(Math.atan2(dx, len) * -180) / Math.PI} ${ex} ${ey - 5})`} />
      ))}
      <ellipse cx={ex} cy={ey + 2.4} rx="2.7" ry="3.5" fill={p.skin} />
    </g>
  );
}

function Svg({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <svg viewBox="0 0 100 200" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" overflow="visible" className="block h-full w-auto">
      <ellipse cx="50" cy="198.4" rx="36" ry="2.2" fill="#000" opacity=".16" />
      {children}
    </svg>
  );
}

/* ───────────────────────── BRIDES ───────────────────────── */

function BrideClassic({ p }: P) {
  return (
    <>
      {/* veil, behind everything */}
      <path d="M50 3.5C34 3.5 27 16 27 31C27 55 21 86 18 126L82 126C79 86 73 55 73 31C73 16 66 3.5 50 3.5Z" fill={p.redDeep} />
      {/* lehenga */}
      <path d="M40 88L60 88C65 122 87 152 93 191Q50 201 7 191C13 152 35 122 40 88Z" fill={p.red} />
      <path d="M50 90C47 130 41 162 31 195Q41 198 50 198Z" fill="#fff" opacity=".08" />
      {[-26, -13, 0, 13, 26].map((o) => (<path key={o} d={`M${50 + o * 0.18} 92L${50 + o * 1.6} 194`} stroke="#000" strokeOpacity=".13" strokeWidth=".7" fill="none" />))}
      <path d="M10 179Q50 191 90 179L93 191Q50 201 7 191Z" fill={p.gold} />
      <path d="M10.5 179Q50 191 89.5 179" stroke={p.goldLight} strokeWidth=".9" strokeDasharray="1.1 1.7" fill="none" />
      <path d="M19 147Q50 157 81 147" stroke={p.gold} strokeWidth="1.5" fill="none" />
      <path d="M17.5 152Q50 162 82.5 152" stroke={p.goldLight} strokeWidth=".8" strokeDasharray="1 2" fill="none" />
      {/* midriff and waist band */}
      <path d="M39 62L61 62L60 89L40 89Z" fill={p.skin} />
      <path d="M39.4 86L60.6 86L61 90.5L39 90.5Z" fill={p.gold} />
      {/* choli */}
      <path d="M34 39C40 35 60 35 66 39L63.5 64C57 67 43 67 36.5 64Z" fill={p.redLight} />
      <path d="M41 36.5Q50 44 59 36.5" stroke={p.gold} strokeWidth="1.1" fill="none" />
      <path d="M36.8 62.5Q50 67.5 63.2 62.5" stroke={p.gold} strokeWidth="1.2" fill="none" />
      {/* pallu draped over the shoulder */}
      <path d="M33 37L42 39.5C52 56 62 78 67 101L57 103C51 85 41 62 33 37Z" fill={p.red} />
      <path d="M33 37L42 39.5C52 56 62 78 67 101" stroke={p.gold} strokeWidth="1.3" fill="none" />
      {/* neck, jewellery */}
      <path d="M46.3 28L53.7 28L54.6 38L45.4 38Z" fill={p.skinShade} />
      <path d="M44.4 33.5Q50 42 55.6 33.5" stroke={p.gold} strokeWidth="1.6" fill="none" />
      <path d="M43 36Q50 54 57 36" stroke={p.gold} strokeWidth="1" fill="none" />
      <circle cx="50" cy="48.2" r="1.7" fill={p.gold} />
      <g transform="rotate(4 50 30)">
        <path d="M41.6 16C40.8 6.8 59.2 6.8 58.4 16C56 11 44 11 41.6 16Z" fill={p.hair} />
        <ellipse cx="50" cy="19.4" rx="8" ry="10.4" fill={p.skin} />
        <path d="M41.6 16C40.8 6.8 59.2 6.8 58.4 16C56 11 44 11 41.6 16Z" fill={p.hair} />
        <ellipse cx="44.6" cy="23.6" rx="2.4" ry="1.5" fill={p.blush} opacity=".45" />
        <ellipse cx="55.4" cy="23.6" rx="2.4" ry="1.5" fill={p.blush} opacity=".45" />
        <path d="M48.3 26.3Q50 27.6 51.7 26.3" stroke={p.red} strokeWidth="1" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="12.6" r="1.1" fill={p.red} />
        <path d="M50 3.2C36 3.2 29 14 28.5 29C33 18.5 40 12.2 50 11.2C60 12.2 67 18.5 71.5 29C71 14 64 3.2 50 3.2Z" fill={p.red} />
        <path d="M28.5 29C33 18.5 40 12.2 50 11.2C60 12.2 67 18.5 71.5 29" stroke={p.gold} strokeWidth="1.3" fill="none" />
        <path d="M50 11.2L50 15.4" stroke={p.gold} strokeWidth=".7" />
        <circle cx="50" cy="16.4" r="1" fill={p.gold} />
        <circle cx="41.9" cy="25.2" r="1.3" fill={p.gold} />
        <circle cx="58.1" cy="25.2" r="1.3" fill={p.gold} />
        <circle cx="53" cy="22.8" r=".55" fill={p.gold} />
      </g>
      {/* arms: outer hangs, inner reaches */}
      <Arm p={p} sx={35} sy={41} dx={-2.5} sleeve={p.redLight} cuff={p.gold} bangles={[p.red, p.gold, p.red, p.gold]} dir={-1} />
      <Arm p={p} sx={65} sy={41} dx={3} sleeve={p.redLight} cuff={p.gold} bangles={[p.red, p.gold, p.red, p.gold]} dir={-1} className="fig-arm" />
    </>
  );
}

function BrideKerala({ p }: P) {
  return (
    <>
      {/* saree: straight fall, wide kasavu border */}
      <path d="M38.5 88L61.5 88C64 130 70 160 73 191Q50 197 27 191C30 160 36 130 38.5 88Z" fill={p.ivory} />
      <path d="M27.2 178Q50 184 72.8 178L73.4 191Q50 197 26.6 191Z" fill={p.gold} />
      <path d="M27.6 183Q50 189 72.4 183" stroke={p.goldLight} strokeWidth=".8" strokeDasharray="1 1.6" fill="none" />
      <path d="M33 140Q50 146 67 140" stroke={p.gold} strokeWidth="1.1" fill="none" />
      {[-9, -4.5, 0, 4.5, 9].map((o) => (<path key={o} d={`M${50 + o * 0.3} 92L${50 + o * 1.5} 188`} stroke="#8a7440" strokeOpacity=".16" strokeWidth=".7" fill="none" />))}
      <path d="M50 90C48 130 44 160 38 195Q44 197 50 197Z" fill="#fff" opacity=".35" />
      {/* midriff, blouse */}
      <path d="M39 62L61 62L60 89L40 89Z" fill={p.skin} />
      <path d="M34.6 39C40 35 60 35 65.4 39L63.2 64C57 66.6 43 66.6 36.8 64Z" fill={p.redDeep} />
      <path d="M41 36.6Q50 43.6 59 36.6" stroke={p.gold} strokeWidth="1.1" fill="none" />
      <path d="M36.6 62.6Q50 67 63.4 62.6" stroke={p.gold} strokeWidth="1" fill="none" />
      {/* pallu: kasavu cloth over the shoulder and falling at the back */}
      <path d="M33.5 37L42 39.5C50 54 59 72 64 96L54 99C49 80 41 60 33.5 37Z" fill={p.ivory} />
      <path d="M33.5 37L42 39.5C50 54 59 72 64 96" stroke={p.gold} strokeWidth="2.2" fill="none" />
      <path d="M64 96L54 99L58.5 128L68.5 124Z" fill={p.ivory} />
      <path d="M64 96L68.5 124" stroke={p.gold} strokeWidth="2.2" fill="none" />
      {/* neck, temple jewellery */}
      <path d="M46.3 28L53.7 28L54.6 38L45.4 38Z" fill={p.skinShade} />
      <path d="M44.2 33.6Q50 42.4 55.8 33.6" stroke={p.gold} strokeWidth="1.8" fill="none" />
      <path d="M43 36.6Q50 56 57 36.6" stroke={p.gold} strokeWidth="1" fill="none" />
      <circle cx="50" cy="49.6" r="1.8" fill={p.gold} />
      <g transform="rotate(4 50 30)">
        {/* hair, bun and jasmine */}
        <circle cx="50" cy="5.6" r="5.4" fill={p.hair} />
        <path d="M44.4 7.6Q50 12 55.6 7.6" stroke="#fff" strokeWidth="2.4" strokeDasharray=".2 2.4" strokeLinecap="round" fill="none" />
        <ellipse cx="50" cy="19.6" rx="8" ry="10.4" fill={p.skin} />
        <path d="M41.2 16.5C40.6 7.4 59.4 7.4 58.8 16.5C56.4 11.4 43.6 11.4 41.2 16.5Z" fill={p.hair} />
        <ellipse cx="44.6" cy="23.8" rx="2.4" ry="1.5" fill={p.blush} opacity=".45" />
        <ellipse cx="55.4" cy="23.8" rx="2.4" ry="1.5" fill={p.blush} opacity=".45" />
        <path d="M48.3 26.4Q50 27.7 51.7 26.4" stroke={p.red} strokeWidth="1" strokeLinecap="round" fill="none" />
        <circle cx="50" cy="13.4" r="1" fill={p.red} />
        <circle cx="41.9" cy="25.4" r="1.2" fill={p.gold} />
        <circle cx="58.1" cy="25.4" r="1.2" fill={p.gold} />
      </g>
      <Arm p={p} sx={35} sy={41} dx={-2} sleeve={p.redDeep} sleeveLen={0.34} cuff={p.gold} bangles={[p.gold, p.gold, p.red, p.gold]} dir={-1} />
      <Arm p={p} sx={65} sy={41} dx={2.5} sleeve={p.redDeep} sleeveLen={0.34} cuff={p.gold} bangles={[p.gold, p.gold, p.red, p.gold]} dir={-1} className="fig-arm" />
    </>
  );
}

function BrideWestern({ p }: P) {
  return (
    <>
      {/* long veil behind */}
      <path d="M50 4C38 4 31 14 31 28C31 56 24 96 16 150Q50 160 84 150C76 96 69 56 69 28C69 14 62 4 50 4Z" fill="#fff" opacity=".55" />
      <path d="M50 4C38 4 31 14 31 28C31 56 24 96 16 150Q50 160 84 150C76 96 69 56 69 28C69 14 62 4 50 4Z" fill="none" stroke="#E6E0D2" strokeWidth=".8" />
      {/* gown */}
      <path d="M39 86L61 86C66 120 88 152 96 192Q50 202 4 192C12 152 34 120 39 86Z" fill={p.white} />
      <path d="M39 86L61 86C66 120 88 152 96 192Q50 202 4 192C12 152 34 120 39 86Z" fill="none" stroke="#E4DDCB" strokeWidth=".8" />
      <path d="M50 88C47 130 40 162 28 196Q40 199 50 199Z" fill="#E9E1CF" opacity=".5" />
      {[-24, -12, 0, 12, 24].map((o) => (<path key={o} d={`M${50 + o * 0.15} 92L${50 + o * 1.8} 195`} stroke="#B9AE93" strokeOpacity=".28" strokeWidth=".7" fill="none" />))}
      <path d="M40 85.4Q50 91 60 85.4L60.4 89Q50 94.6 39.6 89Z" fill="#E7DFC9" />
      {/* bodice with sweetheart neckline and cap sleeves */}
      <path d="M36 40C40 36.4 60 36.4 64 40L61.4 86Q50 92 38.6 86Z" fill={p.white} />
      <path d="M36 40C40 36.4 60 36.4 64 40L61.4 86Q50 92 38.6 86Z" fill="none" stroke="#E4DDCB" strokeWidth=".8" />
      <path d="M40.5 38.4Q45.5 46 50 41.4Q54.5 46 59.5 38.4" stroke="#E4DDCB" strokeWidth="1" fill={p.skin} />
      <path d="M46.3 28L53.7 28L54.6 38.4L45.4 38.4Z" fill={p.skinShade} />
      <g transform="rotate(4 50 30)">
        <path d="M41.2 16C40.4 7.2 59.6 7.2 58.8 16C56.4 11 43.6 11 41.2 16Z" fill={p.hair} />
        <circle cx="50" cy="6.2" r="4.6" fill={p.hair} />
        <ellipse cx="50" cy="19.4" rx="8" ry="10.4" fill={p.skin} />
        <path d="M41.2 16C40.4 7.2 59.6 7.2 58.8 16C56.4 11 43.6 11 41.2 16Z" fill={p.hair} />
        <ellipse cx="44.6" cy="23.6" rx="2.4" ry="1.5" fill={p.blush} opacity=".45" />
        <ellipse cx="55.4" cy="23.6" rx="2.4" ry="1.5" fill={p.blush} opacity=".45" />
        <path d="M48.3 26.3Q50 27.6 51.7 26.3" stroke={p.rose} strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M43 6Q50 2 57 6" stroke="#fff" strokeWidth="2.2" fill="none" opacity=".9" />
        <circle cx="41.9" cy="25" r="1" fill={p.goldLight} />
        <circle cx="58.1" cy="25" r="1" fill={p.goldLight} />
      </g>
      <path d="M45 34.5Q50 39 55 34.5" stroke={p.goldLight} strokeWidth="1" fill="none" />
      <Arm p={p} sx={35.5} sy={42} dx={-2} sleeve={p.white} sleeveLen={0.2} dir={-1} />
      {/* bouquet in the outer hand */}
      <g>
        <circle cx="29.6" cy="104" r="4.2" fill={p.blush} opacity=".85" />
        <circle cx="33.6" cy="102" r="3.2" fill="#fff" />
        <circle cx="26.6" cy="101" r="2.8" fill="#F3C9C4" />
        <circle cx="31" cy="99.4" r="2.2" fill={p.green} opacity=".8" />
      </g>
      <Arm p={p} sx={64.5} sy={42} dx={2.5} sleeve={p.white} sleeveLen={0.2} dir={-1} className="fig-arm" />
    </>
  );
}

/* ───────────────────────── GROOMS ───────────────────────── */

function GroomClassic({ p }: P) {
  return (
    <>
      {/* churidar + juttis */}
      <path d="M40.5 128L59.5 128L60.4 188L51.2 188L50 140L48.8 188L39.6 188Z" fill={p.ivoryShade} />
      <path d="M38.6 188H50Q51.4 195 43 197.4Q36 198 38.6 188Z" fill={p.gold} />
      <path d="M50 188H61.4Q64 198 57 197.4Q48.6 195 50 188Z" fill={p.gold} />
      {/* sherwani */}
      <path d="M33.5 39C40 35.5 60 35.5 66.5 39L69 100C70 113 71.5 126 73 142Q50 149 27 142C28.5 126 30 113 31 100Z" fill={p.ivory} />
      <path d="M33.5 39C40 35.5 60 35.5 66.5 39L69 100C70 113 71.5 126 73 142Q50 149 27 142C28.5 126 30 113 31 100Z" fill="none" stroke={p.ivoryShade} strokeWidth=".8" />
      <path d="M50 38L50 146" stroke={p.gold} strokeWidth="1.5" />
      {[52, 63, 74, 85, 96, 107, 118, 129].map((y) => (<circle key={y} cx="50" cy={y} r="1.15" fill={p.gold} />))}
      <path d="M27.4 136Q50 143 72.6 136" stroke={p.gold} strokeWidth="1.4" fill="none" />
      <path d="M27.8 140Q50 147 72.2 140" stroke={p.goldLight} strokeWidth=".8" strokeDasharray="1 1.8" fill="none" />
      <path d="M46 36.4L54 36.4L54 40.6Q50 43 46 40.6Z" fill={p.gold} />
      {/* stole */}
      <path d="M39.5 37L46.5 38.4L44.6 122L35.2 119Z" fill={p.red} />
      <path d="M60.5 37L53.5 38.4L55.4 122L64.8 119Z" fill={p.red} />
      <path d="M35.2 119L44.6 122" stroke={p.gold} strokeWidth="1.6" />
      <path d="M64.8 119L55.4 122" stroke={p.gold} strokeWidth="1.6" />
      {/* marigold garland */}
      <path d="M38.5 36.5Q50 84 61.5 36.5" stroke={p.marigold} strokeWidth="3.6" strokeDasharray=".1 3.9" strokeLinecap="round" fill="none" />
      <path d="M38.5 36.5Q50 84 61.5 36.5" stroke={p.saffron} strokeWidth="1.6" strokeDasharray=".1 7.8" strokeDashoffset="3.9" strokeLinecap="round" fill="none" />
      <path d="M46.3 28L53.7 28L54 38L46 38Z" fill={p.skinShade} />
      <g transform="rotate(-4 50 30)">
        <ellipse cx="50" cy="20.4" rx="7.8" ry="10" fill={p.skin} />
        <ellipse cx="45" cy="24.2" rx="2.3" ry="1.4" fill={p.blush} opacity=".35" />
        <ellipse cx="55" cy="24.2" rx="2.3" ry="1.4" fill={p.blush} opacity=".35" />
        <path d="M46 25.2Q50 23.4 54 25.2Q50 27 46 25.2Z" fill={p.hair} />
        <path d="M48.4 28Q50 29 51.6 28" stroke={p.skinShade} strokeWidth=".9" strokeLinecap="round" fill="none" />
        <path d="M49 13.4L51 13.4L50 17.6Z" fill={p.red} opacity=".9" />
        {/* safa */}
        <path d="M37 14.6C36 3 64 3 63 14.6C60 9.4 40 9.4 37 14.6Z" fill={p.saffron} />
        <ellipse cx="50" cy="8.6" rx="13.4" ry="7.2" fill={p.saffron} />
        <path d="M38.4 9.4Q50 3.4 61.6 9.4" stroke="#F6B05A" strokeWidth="1.1" fill="none" />
        <path d="M37.6 12.4Q50 6.4 62.4 12.4" stroke="#C2641B" strokeWidth="1" fill="none" />
        <path d="M40 6.8Q50 1.6 60 6.8" stroke="#F6B05A" strokeWidth=".9" fill="none" />
        <path d="M37.4 14.6Q50 9 62.6 14.6" stroke={p.gold} strokeWidth="1.2" fill="none" />
        <circle cx="44.4" cy="9.6" r="2" fill={p.gold} />
        <circle cx="44.4" cy="9.6" r=".8" fill={p.red} />
        <path d="M44.4 8Q42 2 38.4 -1" stroke={p.goldLight} strokeWidth=".9" fill="none" strokeLinecap="round" />
        <path d="M44.6 8Q43 3 41.6 0" stroke={p.goldLight} strokeWidth=".7" fill="none" strokeLinecap="round" />
      </g>
      <Arm p={p} sx={66} sy={41} dx={2.6} sleeve={p.ivory} sleeveLen={0.92} cuff={p.gold} dir={-1} />
      <Arm p={p} sx={34} sy={41} dx={-3} sleeve={p.ivory} sleeveLen={0.92} cuff={p.gold} dir={1} className="fig-arm" />
    </>
  );
}

function GroomKerala({ p }: P) {
  return (
    <>
      {/* mundu with broad kasavu kara */}
      <path d="M36 98L64 98C66 130 68 160 69 192L51.4 192L50 130L48.6 192L31 192C32 160 34 130 36 98Z" fill={p.ivory} />
      <path d="M31 182L48.8 182L48.6 192L31 192Z" fill={p.gold} />
      <path d="M51.2 182L69 182L69 192L51.4 192Z" fill={p.gold} />
      <path d="M31.4 186.4L48.7 186.4M51.3 186.4L68.6 186.4" stroke={p.goldLight} strokeWidth=".8" strokeDasharray="1 1.5" />
      <path d="M36 98Q50 105 64 98L64.4 103Q50 110 35.6 103Z" fill={p.gold} />
      <path d="M50 108L50 180" stroke="#B8A67A" strokeOpacity=".4" strokeWidth=".8" />
      {/* silk kurta */}
      <path d="M33.5 39C40 35.5 60 35.5 66.5 39L67.6 76C67.8 88 68.4 96 69 106Q50 112 31 106C31.6 96 32.2 88 32.4 76Z" fill={p.ivory} />
      <path d="M33.5 39C40 35.5 60 35.5 66.5 39L67.6 76C67.8 88 68.4 96 69 106Q50 112 31 106C31.6 96 32.2 88 32.4 76Z" fill="none" stroke={p.ivoryShade} strokeWidth=".8" />
      <path d="M50 40L50 108" stroke={p.ivoryShade} strokeWidth="1" />
      {[52, 62, 72].map((y) => (<circle key={y} cx="50" cy={y} r="1" fill={p.gold} />))}
      <path d="M45 36.4Q50 41.2 55 36.4" stroke={p.ivoryShade} strokeWidth="1.2" fill="none" />
      {/* angavastram: kasavu shoulder cloth */}
      <path d="M34 38L44 38.6L56 98L45 102Z" fill={p.ivory} />
      <path d="M34 38L44 38.6L56 98" stroke={p.gold} strokeWidth="2" fill="none" />
      <path d="M45 102L56 98L60 134L50 138Z" fill={p.ivory} />
      <path d="M56 98L60 134" stroke={p.gold} strokeWidth="2" fill="none" />
      <path d="M46.3 28L53.7 28L54 38L46 38Z" fill={p.skinShade} />
      <g transform="rotate(-4 50 30)">
        <ellipse cx="50" cy="19.6" rx="7.8" ry="10" fill={p.skin} />
        <path d="M42 14.8C41.4 6 58.6 6 58 14.8C55.6 10.4 44.4 10.4 42 14.8Z" fill={p.hair} />
        <ellipse cx="45" cy="23.6" rx="2.3" ry="1.4" fill={p.blush} opacity=".35" />
        <ellipse cx="55" cy="23.6" rx="2.3" ry="1.4" fill={p.blush} opacity=".35" />
        <path d="M46 24.6Q50 22.8 54 24.6Q50 26.4 46 24.6Z" fill={p.hair} />
        <path d="M48.4 27.4Q50 28.4 51.6 27.4" stroke={p.skinShade} strokeWidth=".9" strokeLinecap="round" fill="none" />
        <path d="M50 12.4L50 15.6" stroke="#E8E0CE" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <Arm p={p} sx={66} sy={41} dx={2.6} sleeve={p.ivory} sleeveLen={0.5} cuff={p.gold} dir={-1} />
      <Arm p={p} sx={34} sy={41} dx={-3} sleeve={p.ivory} sleeveLen={0.5} cuff={p.gold} dir={1} className="fig-arm" />
    </>
  );
}

function GroomWestern({ p }: P) {
  return (
    <>
      <path d="M40.5 120L59.5 120L60.6 188L51.4 188L50 134L48.6 188L39.4 188Z" fill={p.navy} />
      <path d="M38.2 188H50Q51 194 43 197Q36.4 197.6 38.2 188Z" fill="#14161F" />
      <path d="M50 188H61.8Q63.6 197.6 57 197Q49 194 50 188Z" fill="#14161F" />
      {/* shirt, jacket, bow tie */}
      <path d="M33.5 39C40 35.5 60 35.5 66.5 39L68 102C68.6 110 69 116 69.4 124Q50 130 30.6 124C31 116 31.4 110 32 102Z" fill={p.navy} />
      <path d="M43.5 37L56.5 37L52.5 112L47.5 112Z" fill="#fff" />
      <path d="M43.5 37L50 70L36.4 112L33 104Z" fill="#26324F" />
      <path d="M56.5 37L50 70L63.6 112L67 104Z" fill="#26324F" />
      <path d="M50 70L50 122" stroke="#0F1524" strokeWidth=".8" />
      <circle cx="50" cy="84" r="1" fill={p.goldLight} />
      <circle cx="50" cy="96" r="1" fill={p.goldLight} />
      <path d="M46.2 28L53.8 28L54 38L46 38Z" fill={p.skinShade} />
      <path d="M46 41L50 43.4L54 41L54 45L50 43.4L46 45Z" fill={p.red} />
      <circle cx="50" cy="43.2" r="1.2" fill={p.redDeep} />
      <circle cx="59" cy="52" r="1.9" fill="#fff" />
      <circle cx="59" cy="52" r=".8" fill={p.rose} />
      <g transform="rotate(-4 50 30)">
        <ellipse cx="50" cy="19.6" rx="7.8" ry="10" fill={p.skin} />
        <path d="M41.8 15.4C40.6 5.4 59.4 5.4 58.2 15.4C56.4 10.6 43.6 10.6 41.8 15.4Z" fill={p.hair} />
        <ellipse cx="45" cy="23.6" rx="2.3" ry="1.4" fill={p.blush} opacity=".35" />
        <ellipse cx="55" cy="23.6" rx="2.3" ry="1.4" fill={p.blush} opacity=".35" />
        <path d="M46.4 24.6Q50 23 53.6 24.6Q50 26 46.4 24.6Z" fill={p.hair} opacity=".85" />
        <path d="M48.4 27.4Q50 28.4 51.6 27.4" stroke={p.skinShade} strokeWidth=".9" strokeLinecap="round" fill="none" />
      </g>
      <Arm p={p} sx={66} sy={41} dx={2.6} sleeve={p.navy} sleeveLen={0.9} cuff="#fff" dir={-1} />
      <Arm p={p} sx={34} sy={41} dx={-3} sleeve={p.navy} sleeveLen={0.9} cuff="#fff" dir={1} className="fig-arm" />
    </>
  );
}

const BRIDES: Record<FigureStyle, (a: P) => ReactNode> = { classic: BrideClassic, kerala: BrideKerala, western: BrideWestern };
const GROOMS: Record<FigureStyle, (a: P) => ReactNode> = { classic: GroomClassic, kerala: GroomKerala, western: GroomWestern };

export function Bride({ style, palette = THEMED_PALETTE, label }: { style: FigureStyle; palette?: Palette; label?: string }) {
  const Body = BRIDES[style];
  return <Svg label={label}><Body p={palette} /></Svg>;
}

export function Groom({ style, palette = THEMED_PALETTE, label }: { style: FigureStyle; palette?: Palette; label?: string }) {
  const Body = GROOMS[style];
  return <Svg label={label}><Body p={palette} /></Svg>;
}
