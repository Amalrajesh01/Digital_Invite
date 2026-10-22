import type { TemplateFlavor } from "./templates";

/**
 * The five visual directions every occasion is offered in. A direction is not a colour scheme: it decides how an
 * invitation is composed (see `src/invitation/styles/directions.css`) — how a chapter starts, what separates sections,
 * the shape of a card, how things arrive. The template then chooses its own opening, hero, section flow and palette.
 *
 * `editorial` is the original magazine look, kept for invitations that already use it.
 */
export interface Direction {
  key: TemplateFlavor;
  /** The name a customer sees. */
  label: string;
  /** One line a customer can understand at once. */
  promise: string;
  /** For the template specification and the studio. */
  typography: string;
  animation: string;
  mobile: string;
  accessibility: string;
}

export const DIRECTIONS: Record<TemplateFlavor, Direction> = {
  royal: {
    key: "royal", label: "Royal Tradition", promise: "Rich colour, ornament and ceremony — rooted in Indian celebration.",
    typography: "A display serif for names, small widely-spaced capitals for labels; script only for the ampersand.",
    animation: "Slow, symmetrical reveals; ornament lines draw in; lamp-light, doors and petals. Nothing bounces.",
    mobile: "Centred single column; the arch or gateway photograph is sized to the screen so faces are never cropped.",
    accessibility: "High-contrast ivory/ink pairs; ornament is decorative-only and hidden from screen readers; every opening can be skipped.",
  },
  minimal: {
    key: "minimal", label: "Modern Minimal", promise: "Clean, quiet and exact — nothing that does not earn its place.",
    typography: "One serif or grotesque at large sizes, hairline rules, numbered sections in small tracked figures.",
    animation: "Crisp, short fades and line-draws; no decorative motion.",
    mobile: "Left-aligned type on a strict grid; the photograph is a full-width band; numerals scale to the viewport.",
    accessibility: "Largest text of all five directions; colour never carries meaning alone; generous tap targets.",
  },
  cinematic: {
    key: "cinematic", label: "Cinematic Story", promise: "Full-screen photographs and a story told in chapters.",
    typography: "Wide-tracked capitals over photographs, outlined chapter numerals, a serif for the lines of the story.",
    animation: "Slow Ken-Burns on the opening photograph, weighty easing, letterbox bars; kept short so it never feels like a loading screen.",
    mobile: "Photograph-first; text sits in the lower third away from faces; chapter numerals shrink but stay legible.",
    accessibility: "A scrim guarantees text contrast on any photograph; motion stops completely for reduced-motion users.",
  },
  floral: {
    key: "floral", label: "Floral & Romantic", promise: "Soft colour, hand-drawn leaves and a gentle hand.",
    typography: "A calligraphic script for headings and names, a quiet serif for reading text.",
    animation: "Very soft easing; petals drift once; a flower unfolds on opening.",
    mobile: "Oval or arched photograph centred over soft colour; sprigs sit in the corners and never cover text.",
    accessibility: "Script is used for headings only, never for dates, times or addresses; decorative leaves are aria-hidden.",
  },
  playful: {
    key: "playful", label: "Playful & Interactive", promise: "Stickers, snapshots and a little surprise at every turn.",
    typography: "A chunky rounded display face, bold labels, hard-edged sticker shadows.",
    animation: "Springy overshoot easing, balloons to pop, a ticket to tear; always one tap, never a precise gesture.",
    mobile: "Stacked paper sheets with rounded tops; big thumb-sized buttons; snapshots overlap but stay readable.",
    accessibility: "Every playful opening is a single large tap target with a plain-button alternative; no timed or precise interactions.",
  },
  noir: {
    key: "noir", label: "Film & Noir", promise: "Letterboxed scenes, deep shadow and a slow spotlight.",
    typography: "Wide-tracked capitals for titles, a high-contrast serif for names, small caps for credits.",
    animation: "Slow fades, spotlight sweeps and masked reveals; nothing bounces.",
    mobile: "Photograph-first; credits sit in the lower third, clear of faces.",
    accessibility: "A scrim guarantees contrast; the opening can always be skipped; motion stops for reduced-motion users.",
  },
  couture: {
    key: "couture", label: "Fashion Editorial", promise: "A magazine made for the two of you: oversized type, asymmetry, white space.",
    typography: "A high-contrast display serif at cover scale, a quiet grotesque for captions, running heads in small capitals.",
    animation: "Masked image reveals and staggered headlines; scroll effects stay subtle.",
    mobile: "Cover type scales with the viewport; spreads become a single column with the photograph first.",
    accessibility: "Large type and strong contrast; decorative running heads are hidden from screen readers.",
  },
  celestial: {
    key: "celestial", label: "Celestial", promise: "A quiet night sky with the two of you at the centre.",
    typography: "A light serif for names, wide-tracked capitals for labels, thin constellation lines.",
    animation: "A slow star field, soft light sweeps and gentle depth; never flashing.",
    mobile: "Centred single column; the star field is a static layer on small screens.",
    accessibility: "Text always sits on a solid-enough ground; the star field is decorative and hidden from screen readers.",
  },
  vintage: {
    key: "vintage", label: "Vintage Film", promise: "A restored romance: sepia, film frames and soft grain.",
    typography: "A warm old-style serif, typewriter details for dates and captions, film-frame numbering.",
    animation: "Slow fades, frame-by-frame title cards and light grain that never touches the photograph.",
    mobile: "Photographs sit inside a single frame; grain is a very light overlay.",
    accessibility: "Grain is faint and removed for reduced motion; captions never rely on the texture for legibility.",
  },
  storybook: {
    key: "storybook", label: "Storybook", promise: "A book that turns its pages: chapters, illustrations and a last page.",
    typography: "A friendly serif for the story, a hand script for chapter titles, drop caps.",
    animation: "Page turns and chapter transitions; illustrations draw in once.",
    mobile: "One page at a time, photographs inside framed plates.",
    accessibility: "Every page is plain content in reading order; the page-turn is decoration only.",
  },
  aquarelle: {
    key: "aquarelle", label: "Watercolour", promise: "Soft washes of colour behind clear, quiet type.",
    typography: "A calligraphic script for names, a light serif for reading, generous leading.",
    animation: "Washes bloom behind photographs once and then stay still.",
    mobile: "Washes shrink to the edges so text never sits on a strong colour.",
    accessibility: "Text is always set on a plain ground; washes are decorative and low-contrast by design.",
  },
  atelier: {
    key: "atelier", label: "Architectural", promise: "Stone, shadow and precise geometry.",
    typography: "A restrained serif or grotesque at large sizes, numbered plates, hairline construction lines.",
    animation: "Geometric masks and precise slides; everything lands exactly.",
    mobile: "Plates stack; construction lines thin out but keep their alignment.",
    accessibility: "High-contrast stone and charcoal; no decorative information.",
  },
  marine: {
    key: "marine", label: "Coastal", promise: "Air, light and a long horizon.",
    typography: "A light serif for names, open-tracked capitals for places, soft sans for details.",
    animation: "Slow wave-like drift and horizon reveals.",
    mobile: "Horizontal bands scale with the screen; the horizon sits above the fold.",
    accessibility: "Light grounds with dark text; motion is slow and stops for reduced-motion users.",
  },
  editorial: {
    key: "editorial", label: "Editorial", promise: "A magazine layout — large photographs, generous white space.",
    typography: "An oversized serif headline with clean supporting text.",
    animation: "Gentle fades and mask reveals.",
    mobile: "Single column with photographs at full width.",
    accessibility: "Standard contrast and tap targets.",
  },
};

/** The five a customer can choose between, in the order they are shown everywhere. */
export const DIRECTION_ORDER = ["royal", "minimal", "cinematic", "floral", "playful"] as const;
/** Every direction a public template can use, in the order the template filter lists them. */
export const ALL_DIRECTIONS = [...DIRECTION_ORDER, "noir", "couture", "celestial", "vintage", "storybook", "aquarelle", "atelier", "marine"] as const;
