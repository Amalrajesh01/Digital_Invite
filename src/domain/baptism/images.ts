import { BAPTISM_SAMPLES } from "@/domain/catalogue/baptism-samples";
import { BAPTISM_SPECS } from "@/domain/design/template-specs-baptism";
import { stockInfo } from "@/domain/imagery/stock";
import { GENERATED } from "./generated";
import { STORY } from "./story";

/**
 * The image manifest of the baptism templates: for every template, every place a photograph can go, what belongs there, and what is
 * there now.
 *
 * The rule behind it: an image is placed only where it is *about* what the section says. A baptism template never borrows a wedding,
 * birthday or unrelated picture to fill a gap; where nothing relevant is available the slot is simply empty and the template's drawn
 * scene stands alone (see `invitation/sections/grace-art.tsx`). Families always supply their own photographs; these slots describe the
 * pictures the *sample* invitations would like, so that they can show what a finished invitation looks like.
 *
 * Status of a slot —
 *   • `stand-in`   a bundled, licensed photograph (assets/stock, credits in CREDITS.md) that is genuinely about the subject;
 *   • `generated`  an image produced from the prompt below and ingested with `npm run baptism:ingest` (provenance in generated.json);
 *   • `pending`    nothing yet: the prompt is ready, and the sample shows its drawn scene (or no picture) until one is supplied.
 * No image-generation service is configured in this repository, so nothing here is `generated` until someone runs the ingest.
 * `reviewed` means a person has looked at it in the real template at phone size; `approved` is the owner’s sign-off and is never set by code.
 *
 * `npm run baptism:check` enforces all of this; `npm run docs:baptism` writes docs/BAPTISM-IMAGES.md.
 */
export const SLOTS = ["hero", "parents", "grandparents", "godparents", "church", "detail"] as const;
export type Slot = (typeof SLOTS)[number];
export type Status = "stand-in" | "generated" | "pending";

/** How each slot is cropped, for the checker and the prompts (width : height). */
export const SLOT_FRAME: Record<Slot, { section: string; ratio: string; note: string }> = {
  hero: { section: "hero", ratio: "3:4", note: "The main picture: the child, or the church, in the frame the template’s hero leaves for it." },
  parents: { section: "people", ratio: "1:1", note: "The parents, shown in a round or square portrait beside their names." },
  grandparents: { section: "people", ratio: "1:1", note: "The grandparents, together, beside their names." },
  godparents: { section: "people", ratio: "1:1", note: "The godparents, together, beside their names." },
  church: { section: "venue", ratio: "16:9", note: "The church or chapel, outside or in, with the venue and its directions." },
  detail: { section: "gallery", ratio: "4:5", note: "One quiet detail of the day: the water, the candle, the white garment, a hand." },
};

/** What a prompt is told never to include, whatever the template. */
export const NEVER = "No text, letters, numbers, logos or watermarks anywhere in the image; no scripture or invitation wording; no wedding, bridal or party clothing; no balloons, cakes or party decorations; no crowds; no stock-photo staging.";

/** Words that must not appear in the *positive* part of a prompt: they would pull the picture toward another occasion. */
export const OFF_TOPIC = /\b(bride|bridal|groom|wedding|birthday|balloon|cake|party|honeymoon)\b/i;

interface Look {
  /** Where, in a sentence. */
  place: string;
  /** The quality of the light. */
  light: string;
  /** The colours the picture should sit in. */
  palette: string;
  baby: string;
  mother: string;
  father: string;
  grandparents: string;
  godparents: string;
  church: string;
  detail: string;
  /** How the hero is composed for this template’s frame. */
  frame: string;
  /** What the hero shows (the child, the church, the light…). */
  heroSubject: string;
}

const LOOK: Record<string, Look> = {
  "heavenly-grace": {
    place: "inside a bright, whitewashed Syro-Malabar church in Kochi, morning light through high windows", light: "soft diffused morning light from the left, a faint beam of sun, airy and luminous", palette: "cloud white, pale sky blue, a touch of gold",
    baby: "a three-month-old Indian baby girl asleep in a white lace christening gown and a tiny white bonnet, held in her mother’s arms",
    mother: "a Malayali mother in her early thirties in an ivory set-saree with a thin gold border, cradling the baby, tender expression, hair in a low bun",
    father: "a Malayali father in his early thirties in a cream shirt and white mundu, leaning in beside the mother",
    grandparents: "an elderly Malayali couple — he in a white shirt and mundu, she in a white chatta and mundu — seated together, smiling, her hand over his",
    godparents: "a Malayali man and woman in their thirties, she in a pale blue saree, he in a light shirt, standing close in a church aisle",
    church: "the white façade of a Kerala Syro-Malabar church with a tall cross, steps and coconut palms, morning sun",
    detail: "a white lace christening gown hung over a wooden pew, with a single beam of light",
    frame: "the baby’s face in the upper third with soft cloud-like negative space above and to the right for a dove to cross",
    heroSubject: "the sleeping baby in her mother’s arms",
  },
  "blessing-from-above": {
    place: "inside a Malankara Orthodox church in Kottayam at dusk, carved wooden screen and hanging lamps", light: "a single warm column of low sunlight falling from a high window onto the child, the rest in gentle shadow", palette: "dusty rose, ivory, antique gold, deep brown",
    baby: "a five-month-old Indian baby boy in a white christening robe, awake, looking up toward the light, held by his father",
    mother: "a Malayali mother in a cream saree with a gold border, her head covered with a thin white veil as in her church, looking at the baby",
    father: "a Malayali father in a white shirt and mundu holding the baby up toward the light",
    grandparents: "an elderly Orthodox Malayali couple, she in a white chatta and mundu with a veil, he in a white shirt and mundu, in the light of a church doorway",
    godparents: "an Orthodox priest in a black cassock and a young Malayali woman in a cream saree, standing beside a candle stand",
    church: "the interior of an Orthodox church: carved wooden altar screen, brass hanging lamps, a beam of light from a high window",
    detail: "a brass hanging lamp lit in a dim church, one ray of light across it",
    frame: "the child in a column of light, centred, with deep shadow either side and room above for the beam",
    heroSubject: "the baby lifted into a beam of light",
  },
  "sacred-waters": {
    place: "a Church of South India church in Chennai, a white stone font beside the altar rail", light: "cool, clear daylight reflecting off water, bright and clean", palette: "aqua, sea-glass, white, a hint of pale gold",
    baby: "a four-month-old Indian baby boy in a white christening gown, calm, as a pastor’s hand pours a thin stream of water over his head",
    mother: "a Tamil mother in a pale green silk saree, her hand under the baby’s head at the font",
    father: "a Tamil father in a white shirt and grey trousers, holding the baby over the font",
    grandparents: "an elderly Tamil couple, he in a white shirt and veshti, she in a soft lilac saree, seated near the front pew",
    godparents: "a Tamil woman in a teal saree and a man in a light-blue shirt, standing at the font with a candle",
    church: "a CSI church with a white arched doorway and a small water garden, midday light",
    detail: "water being poured from a silver shell into a white stone font, rings spreading on the surface",
    frame: "a circular crop centred on the water and the child’s head; the water’s rings fill the lower half",
    heroSubject: "water poured over the child’s head at the font",
  },
  "kerala-christian-heritage": {
    place: "the steps of a Mar Thoma parish church in Thiruvalla, red-tiled roofs and coconut palms behind", light: "clear early-morning sun, warm and even", palette: "cream, antique gold, forest green",
    baby: "a four-month-old Indian baby girl in a white christening gown with a gold-bordered cream shawl, held by her grandmother",
    mother: "a Malayali mother in a cream set-mundu with a broad gold kasavu border, a small gold chain, holding the baby",
    father: "a Malayali father in a white mundu with a gold border and a white full-sleeved shirt",
    grandparents: "two elderly Malayali Christian couples side by side on the church steps: the women in white chatta-and-mundu with gold borders, the men in white mundu and shirt, all smiling",
    godparents: "a Malayali man in a white mundu and shirt and a woman in a cream-and-gold saree, a lit nilavilakku lamp between them",
    church: "the façade of a Kerala parish church with a tall central gable, twin turrets and wide red steps, under a blue sky",
    detail: "a brass nilavilakku lamp lit beside a Nasrani cross on a white cloth",
    frame: "a church façade or the family on its steps, symmetric, filling an arched frame, sky at the top",
    heroSubject: "the parish church in morning sun",
  },
  "little-prince-of-grace": {
    place: "a Latin Catholic church in Pune, the Church of the Good Shepherd, wooden pews and a small side altar", light: "soft midday window light, calm", palette: "navy, powder blue, small touches of gold",
    baby: "an eleven-month-old Indian baby boy in a white christening suit with a navy ribbon sash, sitting on his father’s lap, wide-eyed",
    mother: "an Indian Catholic mother in a navy dress with a white lace collar, smiling at the baby",
    father: "an Indian Catholic father in a navy suit and white shirt, his hand around the baby",
    grandparents: "an elderly Indian Catholic couple — he in a grey suit with a tie, she in a pale blue dress with a cardigan — seated close, holding a rosary",
    godparents: "a woman in a blue dress and a man in a blazer, godparents, in a church pew with a candle",
    church: "the exterior of a stone Catholic church with a bell tower and a small garden, Pune",
    detail: "a tiny white christening shoe and a gold-edged rosary on a navy cloth",
    frame: "a round portrait of the baby, head and shoulders, with a plain dark-blue background to sit under a small gold crown",
    heroSubject: "the baby in his christening suit",
  },
  "little-princess-of-heaven": {
    place: "a Methodist church in Bengaluru decorated with white and pink flowers, afternoon light", light: "soft golden window light, flattering and warm", palette: "blush, ivory, rose gold",
    baby: "a five-month-old Indian baby girl in a white christening dress with a soft pink sash and a lace headband, laughing, held by her mother",
    mother: "a Malayali-Bengaluru mother in a blush-pink dress, a small pearl necklace, kissing the baby’s forehead",
    father: "a father in a pale grey suit and a blush tie, smiling at the baby",
    grandparents: "an elderly couple, he in a white shirt and grey trousers, she in a pink-and-ivory saree, seated with a garland of white flowers",
    godparents: "a woman in a rose-coloured saree and a man in a light blazer, godparents, beside a flower arrangement",
    church: "a white Methodist church entrance with pink bougainvillea over the porch",
    detail: "a lace headband and a tiny pair of white shoes beside a spray of small pink flowers",
    frame: "an arched portrait of the baby, face in the upper-middle, plenty of soft background to take a flower garland around the arch",
    heroSubject: "the baby girl in her christening dress",
  },
  "generations-of-faith": {
    place: "a Jacobite Syrian church in Pala beside an old family house, a tiled courtyard", light: "warm late-afternoon light, a little sepia", palette: "walnut, olive, old paper",
    baby: "a six-month-old Indian baby boy in a white christening gown, his tiny hand resting on his great-grandmother’s hand",
    mother: "a Malayali mother in a cream saree, holding the baby, with her mother-in-law beside her",
    father: "a Malayali father in a white shirt and mundu, standing behind his father",
    grandparents: "four generations of one Kerala Christian family on the steps of an old house: a ninety-year-old great-grandmother in white chatta-mundu, two couples in their sixties, the parents and the baby",
    godparents: "a Malayali man and woman in their forties in white, with the family priest in a cassock, in the courtyard",
    church: "an old Jacobite church with a stone cross in the courtyard, laterite walls and a tiled roof",
    detail: "an old family Bible with a brass clasp and a ribbon, text out of focus, on a carved wooden table",
    frame: "an oval, sepia-leaning crop: the child’s hand on an elder’s hand, face not required",
    heroSubject: "four generations together",
  },
  "church-of-light": {
    place: "the nave of a large Roman Catholic church in Bandra, Mumbai, at evening Mass", light: "amber candlelight and last daylight through coloured glass, deep shadows", palette: "midnight blue, candle gold, amber",
    baby: "a four-month-old Indian baby girl in a white christening gown, asleep, a lit baptismal candle held beside her by her godmother",
    mother: "an Indian Catholic mother in a deep-blue dress, her eyes on the baby, candle glow on her face",
    father: "an Indian Catholic father in a dark suit, hand on the mother’s shoulder, side-lit by candles",
    grandparents: "an elderly Mumbai Catholic couple in formal clothes, she with a rosary, seated in a pew with candles ahead",
    godparents: "a woman in a dark green dress holding a baptismal candle and a man in a dark suit standing next to her at the font",
    church: "the interior of a gothic church: pointed arches, a coloured-glass window glowing at the far end, candles in front",
    detail: "rows of small candles glowing in a dark church, blurred into gold",
    frame: "a tall pointed crop with the stained-glass window at the top and a dark foreground; the child may be small in the lower third",
    heroSubject: "the lit window at the end of the nave",
  },
  "white-dove-blessing": {
    place: "the whitewashed Church of the Holy Spirit in Panaji, Goa, bright sky, palm trees", light: "bright, clean coastal daylight, no hard shadows", palette: "white, silver, sage green",
    baby: "a five-month-old Indian baby boy in a white christening gown, held up gently by his godmother against a pale sky",
    mother: "a Goan Catholic mother in a white dress with a small floral print, holding the baby close",
    father: "a Goan Catholic father in a white linen shirt and light trousers",
    grandparents: "an elderly Goan Catholic couple, she in a pastel floral dress, he in a white shirt, under a frangipani tree",
    godparents: "a Goan woman in a pale green dress and a man in a white shirt, standing on the whitewashed church steps",
    church: "the iconic white baroque façade of a Goan church with twin towers and a zig-zag staircase against a blue sky",
    detail: "a white feather on a pale stone step with sunlight across it",
    frame: "mostly sky: the child small and low in the frame with generous empty sky above for a drawn dove",
    heroSubject: "the baby against open sky",
  },
  "the-open-bible": {
    place: "a Church of South India church in Hyderabad, plain wooden pews, a pulpit and a baptistry", light: "clean, even daylight from tall windows, calm and studious", palette: "parchment, walnut, burgundy",
    baby: "a seven-month-old Indian baby boy in a white christening gown, held by his father beside the pulpit, a worn Bible open on the rail in front of them",
    mother: "an Indian Christian mother in a maroon saree, hand on her son’s shoulder, proud and calm",
    father: "an Indian Christian father in a white shirt and dark trousers, standing beside his son",
    grandparents: "an elderly Telugu Christian couple, he in a white shirt and veshti, she in a green saree, with a worn Bible between them",
    godparents: "a pastor in a white shirt and a Sunday-school teacher in a blue saree, beside the baptistry",
    church: "a plain, tall CSI church interior: wooden pews, a pulpit with an open Bible whose text is out of focus, tall windows",
    detail: "a worn leather Bible open on a lectern, the text deliberately out of focus and illegible, a ribbon marker",
    frame: "a lectern with an open book whose words cannot be read, soft focus, room above for the title",
    heroSubject: "an open Bible on a lectern, text unreadable",
  },
  "floral-grace": {
    place: "a small chapel in Ernakulam decorated with white lilies in brass vases, soft daylight", light: "high-key, bright and airy, almost no shadow", palette: "lily white, sage, a trace of blush",
    baby: "a six-month-old Indian baby girl in a white christening dress with a white flower headband, looking at a white lily",
    mother: "a Malayali mother in a white-and-sage set-saree, a small white flower in her hair, smiling at the baby",
    father: "a Malayali father in a white shirt and cream mundu holding a lily",
    grandparents: "an elderly Malayali grandmother arranging white lilies in a brass vase with her husband beside her in a white shirt and mundu",
    godparents: "a woman in a pale green saree and a man in a white shirt holding lilies, in a chapel doorway",
    church: "a small Kerala chapel with white walls and a red-tiled roof, framed by lilies in a garden bed",
    detail: "a single white lily in close-up on a pale background, petals with soft veins",
    frame: "an oval portrait: a white lily or the baby’s face on a pale ground, with space around for drawn lilies",
    heroSubject: "a white lily, or the baby with a lily",
  },
  "golden-morning": {
    place: "a small hillside chapel above tea estates at Munnar, early morning, mist in the valley", light: "sunrise, low gold sun behind, long soft shadows, rays through mist", palette: "honey, peach, amber, tea-garden green",
    baby: "a seven-month-old Indian baby boy in a white christening gown and a knitted white shawl, in his mother’s arms facing the sunrise",
    mother: "a Malayali mother in a cream-and-gold saree with a woollen shawl against the morning chill, backlit",
    father: "a Malayali father in a white shirt and a sweater, standing with the baby, mist behind",
    grandparents: "an elderly Malayali couple wrapped in shawls on the chapel steps, steaming glasses of tea in their hands",
    godparents: "a woman in a mustard shawl and a man in a jacket at the chapel gate, sunlight in their hair",
    church: "a small white hillside chapel with a tin roof among tea bushes, morning mist and low sun",
    detail: "a brass pot of tea steaming on a stone wall in morning light",
    frame: "a wide landscape frame: sun low on the horizon, light spilling across the hills, the lower third a path or foreground",
    heroSubject: "the sun coming over the hills at the chapel",
  },
  "jesus-and-the-little-child": {
    place: "an Orthodox church in Thrissur, children from the Sunday school sitting on the floor at the front", light: "soft, even light from side windows", palette: "sand, olive, soft blue",
    baby: "a six-month-old Indian baby boy in a white christening gown held out toward a priest’s open hands, calm and curious",
    mother: "a Malayali mother in a pale yellow saree, handing her baby forward with both hands, a gentle smile",
    father: "a Malayali father in a white shirt and mundu, one hand on the baby’s back",
    grandparents: "an elderly Malayali couple in white clothes, she holding a small child’s hand, he beside her, in a Sunday-school room",
    godparents: "a woman in a blue saree and a man in a white shirt, with a group of Sunday-school children behind them",
    church: "an Orthodox church courtyard in Thrissur with a stone cross and a group of children walking in",
    detail: "two open hands, palms up, cradling a small flame in soft light — no face, no figure",
    frame: "a close crop of hands only: an adult’s hands offering a small child’s hands; never a depiction of any religious figure",
    heroSubject: "open hands and a child’s small hands",
  },
  "garden-of-blessings": {
    place: "the lawn of a parish house in Kozhikode beside a pergola of climbing roses and jasmine", light: "soft dappled morning sun through leaves", palette: "leaf green, butter yellow, soft pink",
    baby: "a five-month-old Indian baby girl in a white christening dress with a tiny straw hat, sitting on a quilt on the grass",
    mother: "a Malayali mother in a leaf-green saree on a garden bench, smiling at the baby on her lap",
    father: "a Malayali father in a pale yellow shirt kneeling on the grass beside the quilt",
    grandparents: "an elderly Malayali couple on a garden bench under the pergola, she holding a jasmine garland, he in a white shirt",
    godparents: "a woman in a pink saree and a man in a pale shirt standing under an arch of roses",
    church: "a Latin Catholic church with a flower garden and a white pergola, Kozhikode",
    detail: "a white pergola with climbing roses in soft morning light, a bench below",
    frame: "an arched frame: the garden path under a rose arch, the child small in the middle distance",
    heroSubject: "the rose garden of the parish house",
  },
  "royal-catholic-elegance": {
    place: "the Cathedral of the Holy Name in Mangaluru: a gothic façade with white spires against a deep blue sky", light: "clear, rich afternoon light on white stone, deep saturated sky", palette: "burgundy, gold leaf, ivory",
    baby: "a six-month-old Indian baby boy in an ornate white christening gown with lace, held by his godfather before the altar rail",
    mother: "a Mangalorean Catholic mother in a deep-burgundy silk dress with a lace mantilla, composed and elegant",
    father: "a Mangalorean Catholic father in a charcoal three-piece suit with a burgundy tie",
    grandparents: "a distinguished elderly Mangalorean Catholic couple in formal clothes, he in a dark suit with a pocket square, she in a navy silk dress and pearls",
    godparents: "a formally dressed man and woman, godparents, beside the baptismal font in a cathedral",
    church: "a gothic cathedral façade in white, spires and pointed windows, seen from low down against a dark-blue sky",
    detail: "a gold-edged baptismal shell and a white linen cloth on a marble altar rail",
    frame: "a tall arched plate: the cathedral façade, or a formal portrait of the child, centred and symmetrical",
    heroSubject: "the cathedral façade, symmetrical",
  },
  "modern-minimal-grace": {
    place: "a plain, bright modern church interior in Delhi: white walls, a simple wooden cross, one tall window", light: "clean white daylight, soft and neutral, very low contrast", palette: "stone white, charcoal, a single warm accent",
    baby: "an eight-month-old Indian baby boy in a plain white gown, seen from a little above, resting his head on his mother’s shoulder",
    mother: "an Indian mother in a plain off-white linen dress, minimal jewellery, eyes closed in a quiet embrace",
    father: "an Indian father in a charcoal shirt, holding mother and baby",
    grandparents: "an elderly Indian couple in simple neutral clothes seated side by side on a plain bench, soft light from a window",
    godparents: "two friends in neutral clothes holding hands near the font, shown from the shoulders down",
    church: "a minimalist white church with one tall narrow window and a simple wooden cross, empty",
    detail: "a baby’s foot resting in a parent’s open palm on a plain white ground",
    frame: "a wide, quiet band: a single detail or an empty bright room with one cross, room for large type below",
    heroSubject: "a baby’s foot in a parent’s hand",
  },
  "the-little-blessing": {
    place: "a tiny chapel in Thiruvananthapuram that holds about twenty people, a few chairs, one candle", light: "gentle late-afternoon light, a single candle glow", palette: "oatmeal, butter, pale blue",
    baby: "a seven-week-old Indian baby girl in a simple white gown, tiny, asleep, a hand curled by her cheek",
    mother: "an Indian mother in a pale-blue cotton saree, bare face and a soft smile, holding the baby close",
    father: "an Indian father in an oatmeal-coloured shirt, his big hand cupping the baby’s head",
    grandparents: "an elderly couple holding a tiny hand between them, shown close, the light on their hands",
    godparents: "a pair of close friends in simple clothes, lighting a single candle together",
    church: "a very small whitewashed chapel with a wooden door and a single window, afternoon light",
    detail: "a tiny foot peeking out from a knitted blanket",
    frame: "a small detail, very close: a hand, a foot or a candle; one quiet subject, never a posed group",
    heroSubject: "a tiny foot under a knitted blanket",
  },
  "family-in-faith": {
    place: "the hall and font of the Church of the Good Shepherd in Kolkata, afternoon, community around", light: "warm, natural, slightly crowded daylight", palette: "terracotta, olive, warm cream",
    baby: "a nine-month-old Indian baby boy in a white christening outfit, passed between several loving pairs of hands",
    mother: "a single Indian Christian mother in her early thirties, in a terracotta saree, holding her son and looking at him proudly",
    father: "her younger brother, an uncle, in a green shirt, lifting the baby gently — not a father figure, a loving uncle",
    grandparents: "an elderly Bengali Christian couple, who raised their daughter and now help raise her son, standing with their arms around her",
    godparents: "a woman doctor in a blue saree and a man in a casual shirt, godparents, and a pastor in a white shirt, all close around the baby",
    church: "a Kolkata church hall with a mixed group of ages gathering in the afternoon light",
    detail: "many hands of different ages, all resting on one small baby’s blanket",
    frame: "a round crop of hands of different generations holding one small hand — faces optional",
    heroSubject: "hands of many ages around a baby’s hand",
  },
  "celestial-promise": {
    place: "a CSI church in Coimbatore at dusk, the sky turning indigo behind the roof", light: "blue-hour dusk with a warm glow from windows, the last band of orange on the horizon", palette: "indigo, candle gold, rose",
    baby: "a four-month-old Indian baby girl in a white gown and a gold-edged shawl, held in her father’s arms facing the evening sky",
    mother: "a Tamil mother in a deep-teal saree with a gold border, holding her husband’s arm, an expression of quiet gratitude",
    father: "a Tamil father in a white shirt and dark trousers, holding the baby under an evening sky",
    grandparents: "an elderly Tamil couple, he in a white shirt and veshti, she in a maroon saree, standing in the glow of a church door at dusk",
    godparents: "a woman in a lilac saree and a man in a dark shirt, godparents, with a lit lantern between them",
    church: "a CSI church lit from within against an indigo dusk sky, a few stars out",
    detail: "an evening sky after rain with a faint band of colour near the horizon, no figures",
    frame: "a wide dusk landscape or a church silhouette under the first stars, lower third dark, upper half open sky",
    heroSubject: "the church at blue hour under the first stars",
  },
  "a-new-beginning": {
    place: "the doors of St. George’s Church in Pala at dawn, the great wooden doors open on a road and a rising sun", light: "dawn: a low gold sun flooding the doorway, long warm light, cool blue interior", palette: "deep navy, dawn peach, gold",
    baby: "a five-month-old Indian baby boy in a white christening gown carried over the church threshold into the morning light by his parents",
    mother: "a Malayali mother in a cream set-saree stepping through the church doors with the baby, backlit by dawn",
    father: "a Malayali father in a white shirt and mundu beside her, one hand at the small of her back, looking ahead into the light",
    grandparents: "two elderly Malayali couples standing at the church doors in the morning light, smiling toward the family",
    godparents: "a woman in a teal saree and a man in a cream shirt, godparents, with the church doors open behind them",
    church: "tall wooden church doors thrown open on a bright dawn, a path leading out into the light",
    detail: "the shadow of a doorway on stone steps, the first sunlight just touching the threshold",
    frame: "a pointed, door-shaped crop: a path leading out through open doors toward a sunrise; the figures small",
    heroSubject: "an open church door and a path into the sunrise",
  },
  "candle-of-faith": {
    place: "inside St. Andrew’s Church in Bengaluru at the evening service, the Paschal candle beside the font", light: "a single warm candle glow on faces, the rest of the nave in soft amber shadow", palette: "warm ivory, amber, muted gold, deep brown",
    baby: "a five-month-old Indian baby boy in a white christening gown, held by his father, looking at the small flame of a baptismal candle",
    mother: "a Malayali mother in a cream saree with a thin gold border, her face lit from below by candle glow",
    father: "a Malayali father in a white shirt holding the baby close, the candle’s light in his glasses",
    grandparents: "an elderly couple lighting each other’s small candles in a dim church, smiling gently",
    godparents: "a woman in a soft gold saree and a man in a cream shirt standing at the font with a lit candle between them",
    church: "a Bengaluru church interior at dusk, rows of small candles glowing before the altar",
    detail: "a baptismal candle with a white ribbon, its flame blurred into gold",
    frame: "an oval portrait of the baby in warm light, with room below for a candle",
    heroSubject: "the baby by candlelight",
  },
  "white-roses": {
    place: "a Latin Catholic church in Alappuzha with a rose garden behind the parish house, soft morning light", light: "natural window and garden light, soft and bright", palette: "cream, white, sage green, a trace of blush",
    baby: "a four-month-old Indian baby girl in a white christening dress and a small white flower headband, held among white roses",
    mother: "a Malayali mother in a white-and-sage saree holding the baby beside a rose bush",
    father: "a Malayali father in a white shirt and cream mundu, gently holding a white rose stem",
    grandparents: "an elderly Malayali grandmother in a white chatta-and-mundu pruning a white rose bush in her garden, her husband beside her",
    godparents: "a woman in a pale green saree and a man in a white shirt holding white roses",
    church: "a whitewashed church beside a rose garden in full bloom",
    detail: "a single white rose in close-up, dew on the petals, on a pale ground",
    frame: "a round portrait of the baby with space around it for a wreath of roses",
    heroSubject: "the baby among white roses",
  },
  "little-miracle": {
    place: "a Roman Catholic church in Visakhapatnam, sea air and soft daylight through coloured glass", light: "soft diffused daylight, pastel and cheerful", palette: "butter yellow, powder blue, blush, mint",
    baby: "an eleven-month-old Indian baby girl in a white christening dress with a pink bow, standing while her father’s hands hold hers",
    mother: "a mother in a pale blue dress laughing as her daughter takes a first step",
    father: "a father in a pale shirt kneeling to hold his daughter’s hands",
    grandparents: "an elderly couple holding a small teddy bear and a baby’s shoe, smiling at the camera",
    godparents: "a doctor in a soft blue saree and a man in a light jacket kneeling beside the child",
    church: "the whitewashed façade of Holy Family Church with a small bell tower, sky blue behind it",
    detail: "a small hanging mobile of felt stars over a cot, soft light",
    frame: "a round portrait of the child, face centred, a soft plain background",
    heroSubject: "the little girl taking a first step",
  },
  "golden-cross": {
    place: "the nave of Our Lady of Grace Church in Vasai, an old Portuguese-era church with white arches", light: "clear morning light falling in a shaft from a high window, quiet", palette: "ivory, restrained gold, warm white",
    baby: "a three-month-old Indian baby boy in a white christening gown, asleep, held at the church door",
    mother: "an East Indian Catholic mother in an ivory dress with a lace mantilla, her eyes on her sleeping son",
    father: "an East Indian Catholic father in a pale grey suit, his hand on his wife’s shoulder",
    grandparents: "an elderly East Indian Catholic couple in formal clothes holding a rosary between them, in a front pew",
    godparents: "a formally dressed man and woman at the church door, the man holding the baby’s white shawl",
    church: "the white façade of an old Portuguese-era church with a large stone cross above the door",
    detail: "a plain gold cross on a white linen cloth, side light",
    frame: "a round portrait of the sleeping baby with a thin gold ring",
    heroSubject: "the sleeping baby at the church door",
  },
  "cloud-nine": {
    place: "Holy Spirit Church in Shillong on a cold December morning, clouds low over the pine hills behind", light: "soft white morning light through mist, bright and cool", palette: "pale blue, cloud white, a little gold",
    baby: "a six-month-old baby boy of a Khasi family in a white christening gown and a knitted white cap, in his mother’s arms",
    mother: "a Khasi mother in a traditional jainsem wrap with a white shawl, kissing her baby’s cheek",
    father: "a Khasi father in a dark jacket and a white scarf, holding his son up toward the misty sky",
    grandparents: "an elderly Khasi couple in warm shawls on the church steps, mist behind them",
    godparents: "a man in a dark coat and a woman in a pale shawl at the church porch",
    church: "a hill church with a simple bell tower and pine trees, low cloud at its feet",
    detail: "morning mist lying between pine-covered hills, seen from a church yard",
    frame: "an oval portrait of the baby with plenty of pale sky around it",
    heroSubject: "the baby above the clouds",
  },
};

export interface SlotRow {
  templateId: string;
  slot: Slot;
  /** The id a generated file carries in assets/stock (≤ 24 characters). */
  assetId: string;
  section: string;
  subject: string;
  culture: string;
  style: string;
  aspect: string;
  composition: string;
  focal: { x: number; y: number };
  crop: string;
  source: "licensed" | "generated" | "none";
  status: Status;
  /** The bundled or ingested photograph now used by the sample. */
  stock?: string;
  reviewed: boolean;
  approved: boolean;
  prompt: string;
}

const short = (slug: string) => slug.split("-").map((w) => w.slice(0, 4)).join("").slice(0, 14);
export const assetIdFor = (templateId: string, slot: Slot) => `bp-${short(templateId)}-${slot === "grandparents" ? "gp" : slot === "godparents" ? "gd" : slot === "parents" ? "pa" : slot === "church" ? "ch" : slot === "detail" ? "dt" : "hero"}`.slice(0, 24);

const CULTURE = (s: string) => {
  const d = BAPTISM_SAMPLES[s];
  return `${d.denomination}, ${d.city}`;
};

function promptFor(templateId: string, slot: Slot): string {
  const l = LOOK[templateId];
  const aspect = SLOT_FRAME[slot].ratio;
  const subject: Record<Slot, string> = {
    hero: `${l.heroSubject}. ${l.baby}. Setting: ${l.place}.`,
    parents: `${l.mother}; ${l.father}. They are shown together, warm and unposed, with their baby in the mother’s arms. Setting: ${l.place}.`,
    grandparents: `${l.grandparents}. Setting: ${l.place}.`,
    godparents: `${l.godparents}. Setting: ${l.place}.`,
    church: `${l.church}.`,
    detail: `${l.detail}. Setting: ${l.place}.`,
  };
  const framing: Record<Slot, string> = {
    hero: `Composition: ${l.frame}.`,
    parents: "Composition: head-and-shoulders, centred, eyes on the baby, a soft out-of-focus background.",
    grandparents: "Composition: seated or standing close together, head-and-shoulders to waist, a soft out-of-focus background.",
    godparents: "Composition: standing close together, waist-up, a soft out-of-focus background.",
    church: "Composition: wide, level, symmetrical where the architecture is; no people in the foreground.",
    detail: "Composition: close, one subject, shallow depth of field, a clear area of calm background.",
  };
  return `A natural, documentary-quality photograph. ${subject[slot]} Light: ${l.light}. Colours: ${l.palette}. ${framing[slot]} Aspect ratio ${aspect}.`;
}

function rowFor(templateId: string, slot: Slot): SlotRow {
  const l = LOOK[templateId];
  const id = assetIdFor(templateId, slot);
  const gen = GENERATED[id];
  const st = STORY[templateId];
  const standIn: string | undefined = { hero: st.hero, parents: st.people?.parents, grandparents: st.people?.grandparents, church: st.church }[slot as "hero" | "parents" | "grandparents" | "church"];
  const status: Status = gen ? "generated" : standIn ? "stand-in" : "pending";
  const subject: Record<Slot, string> = {
    hero: l.heroSubject, parents: "The child’s parents with the baby", grandparents: "The child’s grandparents together", godparents: "The child’s godparents together", church: l.church, detail: l.detail,
  };
  const comp: Record<Slot, string> = { hero: l.frame, parents: "Head-and-shoulders, eyes on the baby", grandparents: "Seated close together, soft background", godparents: "Standing close together, waist-up", church: "Wide and level; no one in the foreground", detail: "One subject, shallow depth of field" };
  return {
    templateId, slot, assetId: id, section: SLOT_FRAME[slot].section, subject: subject[slot], culture: CULTURE(templateId), style: `${l.palette}; ${l.light}`,
    aspect: SLOT_FRAME[slot].ratio, composition: comp[slot], focal: gen?.focal ?? (standIn ? stockInfo(standIn)?.focal : undefined) ?? { x: 50, y: slot === "hero" ? 40 : 45 },
    crop: slot === "hero" ? "Fills the template’s hero frame; the focal point stays inside it at every width" : "Cropped to the section’s frame around the focal point",
    source: gen ? "generated" : standIn ? "licensed" : "none", status, stock: gen ? id : standIn,
    // the stand-ins were looked at in their real templates at phone size (see docs/BAPTISM.md); nothing is ever approved by code
    reviewed: gen ? gen.reviewed : !!standIn, approved: false,
    prompt: promptFor(templateId, slot),
  };
}

export const MANIFEST: SlotRow[] = BAPTISM_SPECS.flatMap((s) => SLOTS.map((slot) => rowFor(s.slug, slot)));
export const manifestOf = (templateId: string) => MANIFEST.filter((r) => r.templateId === templateId);
export const looks = LOOK;
