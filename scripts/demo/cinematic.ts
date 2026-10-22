import type { InvitationDoc } from "../../src/domain/doc/schema";
import { CINEMATIC_SPECS } from "../../src/domain/design/template-specs-cinematic";
import { THEME_SEEDS } from "../../src/domain/design/themes";
import { CASTING } from "../../src/domain/imagery/casting";
import { CINEMATIC_SAMPLE_FACTS } from "../../src/domain/catalogue/cinematic-samples";
import { newId } from "../../src/lib/id";
import type { Need, ShowcaseCfg } from "./showcase";

/**
 * The sample invitation behind each of the twenty-five cinematic wedding templates. The couples, places and words are fictional and
 * written in the voice of their template (a film, a magazine, a garden, a ledger); the photographs are cast in
 * `src/domain/imagery/casting.ts`. Everything a template cannot know — names, venue, date — is data here, never in a section.
 */
interface Copy {
  names: [string, string];
  last: [string, string];
  date: string;
  venue: [name: string, address: string, city: string, lat: number, lng: number];
  tagline: string;
  invited: string;
  quote: [text: string, author: string];
  intro: string;
  miles: [year: string, title: string, caption: string][];
  bios: [string, string];
  events: [name: string, description: string, start: string, end: string, dayBefore?: boolean][];
  hashtag: string;
  dress: string;
  thanks: string;
}

const COPY: Record<string, Copy> = {
  "love-story": {
    names: ["Eleanor", "Julian"], last: ["Hartwell", "Mercier"], date: "2027-05-22", venue: ["Château de la Rive", "Route de la Loire, 37400 Amboise, France", "Amboise", 47.41, 0.98],
    tagline: "Every great film begins with a quiet scene.", invited: "You are invited to the wedding of", quote: ["You pierce my soul. I am half agony, half hope.", "Jane Austen"],
    intro: "A rainy platform in Lyon.\nA borrowed umbrella.\nA question neither of us could answer.\nAnd then, a lifetime of answers.",
    miles: [["2019", "The first meeting", "A delayed train, one umbrella, two strangers who both missed their connections."], ["2020", "The first conversation", "Four hours in a station café. Neither of us noticed the departures board change twice."], ["2023", "The moment everything changed", "A balcony in Lisbon, a borrowed guitar and the first time one of us said it out loud."], ["2026", "The proposal", "On the same platform, in the same rain, with a different umbrella."]],
    bios: ["A cinematographer who sees every room as a frame. She keeps a notebook of light.", "A sound designer who can tell a city by its echo. He hums when he is happy and is always happy."],
    events: [["Welcome supper", "Long tables in the orangery. Come as you arrive; leave when you must.", "19:00", "22:30", true], ["The ceremony", "Under the great cedar, with the river behind us. Please be seated by 16:15.", "16:30", "17:30"], ["Dinner & dancing", "Candlelight, a string quartet that turns into a band, and the first dance at dusk.", "19:30", "01:00"]],
    hashtag: "EleanorAndJulian", dress: "Black tie optional — midnight blue, champagne and ivory", thanks: "Thank you for being in every scene of our story.\n\nWith all our love,",
  },
  "royal-heritage-wedding": {
    names: ["Isabelle", "Rafael"], last: ["Montclair", "Aguilar"], date: "2027-02-13", venue: ["Palácio da Quinta", "Rua da Quinta 1, 2710 Sintra, Portugal", "Sintra", 38.8, -9.38],
    tagline: "Two families, one house and a long table.", invited: "Together with their families", quote: ["Love looks not with the eyes, but with the mind.", "William Shakespeare"],
    intro: "Two families met at a long table.\nBy the end of dinner they were one.\nWe invite you to the next one.",
    miles: [["2020", "An introduction", "Introduced by our grandmothers, who had been planning it for years."], ["2022", "The first dinner", "Both families, one terrace, and a toast that ran to eleven minutes."], ["2025", "The betrothal", "In the gallery of the Palácio, in front of everyone who mattered."], ["2027", "The wedding", "13 February, in the gardens of the Quinta."]],
    bios: ["An art historian who restores frescoes and has never once been late.", "A diplomat's son turned winemaker who still toasts in four languages."],
    events: [["Welcome reception", "Wine on the terrace and the families' first photograph together.", "18:30", "21:30", true], ["The ceremony", "In the chapel of the Quinta, followed by a procession through the gardens.", "15:30", "16:45"], ["The wedding banquet", "Seven courses, five toasts and a waltz.", "19:00", "00:30"]],
    hashtag: "IsabelleAndRafael", dress: "Formal — burgundy, ivory, gold and deep green", thanks: "To our families and friends: thank you for making this a house full of love.\n\nIsabelle & Rafael",
  },
  "fashion-editorial": {
    names: ["Camille", "Dominic"], last: ["Laurent", "Voss"], date: "2027-04-10", venue: ["The Glasshouse", "14 Wharf Street, Brooklyn, New York", "New York", 40.7, -73.99],
    tagline: "The wedding issue. Volume one, number one.", invited: "The wedding issue", quote: ["To love oneself is the beginning of a lifelong romance.", "Oscar Wilde"],
    intro: "Two people.\nOne city.\nA very long engagement shoot.\nNow, the main event.",
    miles: [["2021", "The shoot", "She was the art director. He was the model who could not stop laughing."], ["2022", "The second shoot", "Nobody was working. Everybody was looking."], ["2025", "The question", "On a rooftop, mid-edit, with the whole crew pretending not to watch."], ["2027", "The issue", "10 April, in the Glasshouse."]],
    bios: ["An art director who thinks in grids and lies in margins. She has never met a typeface she could not fix.", "A stylist and former model. He knows what to wear and, more importantly, when to take it off the table."],
    events: [["Cocktails", "Champagne in the glasshouse while the light is still good.", "17:00", "18:30"], ["The ceremony", "Ten minutes, ten words each, one very good dress.", "18:30", "19:15"], ["Dinner & afterparty", "A long table, a short toast and a DJ who understands us.", "19:30", "01:00"]],
    hashtag: "CamilleAndDominic", dress: "Black, ivory and one thing you would not usually wear", thanks: "Thank you for reading all the way to the end.\n\nCamille & Dominic",
  },
  "enchanted-garden": {
    names: ["Florence", "Theo"], last: ["Ashdown", "Whitlock"], date: "2027-06-05", venue: ["Willowmere Gardens", "Hartley Lane, Cotswolds GL54, England", "Cotswolds", 51.93, -1.72],
    tagline: "A garden, a gate and a very long afternoon.", invited: "Come and walk with us", quote: ["A thing of beauty is a joy for ever.", "John Keats"],
    intro: "She planted a rose.\nHe built a gate.\nNeither of them knew yet\nthey were making the same garden.",
    miles: [["2020", "The seed", "A plant swap, a cutting of sweet pea and a note that said ‘let me know if it takes’."], ["2021", "The first bloom", "It took. So did the conversation."], ["2025", "The question", "Under the willow, with muddy knees and no ring box in sight."], ["2027", "The garden party", "5 June, in the walled garden at Willowmere."]],
    bios: ["A florist who talks to plants and is fairly sure they answer.", "A carpenter who made the garden gate and the bench behind it."],
    events: [["Garden supper", "Lanterns, lavender and long benches on the lawn.", "18:30", "21:30", true], ["The ceremony", "Beneath the willow, with petals instead of confetti.", "15:00", "16:00"], ["The celebration", "Tea, cake, a long lunch under the pergola and dancing on the grass.", "16:30", "23:00"]],
    hashtag: "FlorenceAndTheo", dress: "Garden party — soft green, blush and cream", thanks: "Thank you for walking through our garden with us.\n\nFlorence & Theo",
  },
  "destination-film": {
    names: ["Nora", "Henrik"], last: ["Lindqvist", "Brandt"], date: "2027-09-18", venue: ["Villa Lago", "Via del Lago 8, 22021 Bellagio, Italy", "Lake Como", 45.98, 9.26],
    tagline: "Three days on a lake. Bring a passport and an appetite.", invited: "Join us on Lake Como", quote: ["I am a part of all that I have met.", "Alfred, Lord Tennyson"],
    intro: "Stockholm. Lisbon. Marrakech. Tokyo.\nWe kept meeting in other people's countries.\nNow we would like you in ours — for a weekend.",
    miles: [["2018", "Stockholm", "A conference, a coffee line and a missed keynote."], ["2020", "Lisbon", "A year of video calls ended with a one-way ticket."], ["2024", "Marrakech", "A rooftop at sundown and a very small box."], ["2027", "Lake Como", "18 September — the whole weekend, from the Friday boat."]],
    bios: ["An architect who draws cities and never packs light.", "A pilot who has seen the lake from above and promises it is better from the water."],
    events: [["Welcome dinner & boat", "Meet on the Bellagio quay for the evening boat to the villa.", "18:30", "22:30", true], ["The ceremony", "In the terraced garden above the water.", "16:00", "17:00"], ["Reception & farewell brunch", "Dinner on the lawn, a late swim and brunch on Sunday for anyone left.", "19:00", "23:30"]],
    hashtag: "NoraAndHenrikInComo", dress: "Linen and silk — sand, slate and terracotta", thanks: "Thank you for crossing a border for us.\n\nNora & Henrik",
  },
  "old-money-romance": {
    names: ["Charlotte", "Edward"], last: ["Ashworth", "Pemberton"], date: "2027-10-02", venue: ["Aldersey House", "Aldersey Road, Woodstock, Oxfordshire, England", "Oxfordshire", 51.75, -1.26],
    tagline: "A quiet wedding, as it should be.", invited: "Together with their families", quote: ["Grow old along with me! The best is yet to be.", "Robert Browning"],
    intro: "We have known each other\nsince before it mattered,\nand we mean to know each other\nlong after it does not.",
    miles: [["2012", "Introduced", "At a cousin's christening, by a godmother who has been insufferable about it ever since."], ["2018", "Understood", "A long walk home from a very long dinner."], ["2026", "Engaged", "In the library at Aldersey, with the dogs asleep by the fire."]],
    bios: ["A conservator of old books who writes with a fountain pen and lends them to no one.", "A land agent who knows every hedge in the county and most of the people behind them."],
    events: [["The ceremony", "In the parish church, followed by a short walk to the house.", "14:00", "15:00"], ["Luncheon", "On the lawn at Aldersey, if the weather permits and in the library if it does not.", "15:30", "18:30"], ["Dinner & dancing", "A small band in the long gallery.", "19:30", "23:30"]],
    hashtag: "CharlotteAndEdward", dress: "Morning dress and day dresses — ivory, olive and soft black", thanks: "Thank you for coming. It means a great deal.\n\nCharlotte & Edward",
  },
  "vintage-film-romance": {
    names: ["Beatrice", "Walter"], last: ["Ainsley", "Calloway"], date: "2027-03-27", venue: ["St Anselm's Chapel & the Old Rectory", "Church Lane, Bath BA1, England", "Bath", 51.38, -2.36],
    tagline: "A love story, restored.", invited: "Reel one: the invitation", quote: ["How do I love thee? Let me count the ways.", "Elizabeth Barrett Browning"],
    intro: "Shot on a Sunday in 1952, the first time.\nShot again in 2019, by accident.\nThis time we would like everyone in the picture.",
    miles: [["2019", "Reel I — a chance encounter", "An antiques fair, a box of old photographs and one very specific hat."], ["2021", "Reel II — the long correspondence", "Forty-one letters, all of them written by hand, none of them sent by post."], ["2025", "Reel III — the question", "At the cinema where we had our first date. It was showing the same film."], ["2027", "Reel IV — the wedding", "27 March, in the chapel."]],
    bios: ["A film archivist who can date a photograph by its border and a person by their handwriting.", "A restorer of motor cars who drove her to the chapel in 1962 — or will."],
    events: [["The ceremony", "In St Anselm's, with the organ and a very old hymn.", "13:00", "14:00"], ["The wedding breakfast", "At the Old Rectory, with the good china.", "14:30", "17:30"], ["Dancing", "Records, a gramophone and a dance floor that has seen worse.", "18:30", "23:00"]],
    hashtag: "BeatriceAndWalter", dress: "Vintage welcome — sepia, cream and brown", thanks: "Thank you for being in the picture.\n\nBeatrice & Walter",
  },
  "celestial-love-story": {
    names: ["Stella", "Aaron"], last: ["Marlowe", "Okafor"], date: "2027-08-14", venue: ["Observatory Hill", "High Ridge Road, Flagstaff, Arizona", "Flagstaff", 35.2, -111.65],
    tagline: "Two orbits, one night.", invited: "Under the same sky", quote: ["Bright star, would I were stedfast as thou art.", "John Keats"],
    intro: "We met on the darkest night of the year,\nat a telescope neither of us owned.\nThe sky has been keeping our secret ever since.",
    miles: [["2020", "The night sky", "A meteor shower, a borrowed telescope and a list of wishes that overlapped."], ["2022", "The first eclipse", "We drove four hundred miles to see ninety seconds of dark. It was worth it."], ["2025", "Alignment", "Two planets, one horizon and a question asked quietly."], ["2027", "Together", "14 August, on the hill."]],
    bios: ["An astronomer who counts stars for a living and loses count whenever he is looking at her.", "A lighting designer who has never needed more than one candle."],
    events: [["Stargazing supper", "Blankets, telescopes and soup, as the light fades.", "19:00", "22:00", true], ["The ceremony", "At dusk, as the first stars come out. Please wear something warm.", "18:30", "19:15"], ["Dinner & dancing", "Under a canopy of lights, with a very patient astronomer on hand.", "19:45", "00:30"]],
    hashtag: "StellaAndAaron", dress: "Evening — midnight, violet and a little champagne", thanks: "Thank you for sharing our sky.\n\nStella & Aaron",
  },
  "french-romantic-escape": {
    names: ["Amélie", "Lucas"], last: ["Fontaine", "Bertrand"], date: "2027-06-26", venue: ["Maison des Roses", "12 Rue des Vignes, 13100 Aix-en-Provence, France", "Aix-en-Provence", 43.53, 5.45],
    tagline: "A long weekend in Provence.", invited: "We are getting married in Provence", quote: ["Come live with me and be my love.", "Christopher Marlowe"],
    intro: "He proposed in a bookshop.\nShe said yes in a café.\nWe would like to celebrate\nin a garden between the two.",
    miles: [["2019", "The bookshop", "A shared copy of the last Maupassant on the shelf."], ["2021", "The café", "Same book, two cups, no plans to leave."], ["2025", "The question", "On the steps of the old Mairie, with a bouquet from the market."], ["2027", "The garden", "26 June, in Aix-en-Provence."]],
    bios: ["A translator who writes the English subtitles to other people's love stories.", "A pâtissier who would like it noted that he made the cake himself."],
    events: [["Welcome aperitif", "Rosé in the courtyard of the Maison des Roses.", "18:00", "21:00", true], ["The ceremony", "In the garden, among the roses, with the church bells for music.", "16:00", "17:00"], ["Dinner & dancing", "A long Provençal table and a band that plays everything from Piaf to Prince.", "19:30", "01:00"]],
    hashtag: "AmelieAndLucas", dress: "Linen and silk — dusty blue, cream and rose", thanks: "Merci — for travelling, for toasting, for dancing.\n\nAmélie & Lucas",
  },
  "modern-minimalist": {
    names: ["Maya", "Noah"], last: ["Ellis", "Brandt"], date: "2027-05-01", venue: ["The White Room", "Studio 3, Oranienstraße, Berlin", "Berlin", 52.5, 13.4],
    tagline: "Small. Exact. Ours.", invited: "A wedding", quote: ["That it will never come again is what makes life so sweet.", "Emily Dickinson"],
    intro: "Two people.\nOne room.\nForty guests.\nNo programme beyond the one we mean.",
    miles: [["2019", "Met", "A group project. The only group member who did the reading."], ["2021", "Moved in", "Eleven boxes, two plants."], ["2025", "Decided", "On a Tuesday. No ring box; a sentence."], ["2027", "Married", "1 May, in a very white room."]],
    bios: ["A product designer who removes things until they work.", "A structural engineer who has never wasted a gram."],
    events: [["The ceremony", "Twelve minutes, in the White Room.", "15:00", "15:30"], ["Dinner", "A single long table for everyone, with the plates in no particular order.", "16:30", "21:00"], ["After", "A short walk to a bar we like.", "21:30", "00:00"]],
    hashtag: "MayaAndNoah", dress: "Black, white or charcoal", thanks: "Thank you for coming.\n\nMaya & Noah",
  },
  "dreamlike-fairytale": {
    names: ["Aurelia", "Sebastian"], last: ["Wren", "Hale"], date: "2027-04-24", venue: ["The Orangery at Lavender Court", "Lavender Court, Surrey, England", "Surrey", 51.24, -0.57],
    tagline: "Once upon a time, in an orangery.", invited: "Once upon a time", quote: ["My heart is like a singing bird.", "Christina Rossetti"],
    intro: "Once upon a time\nthere was a girl who collected stories\nand a boy who told them badly.\nThey are about to live happily ever after, on purpose.",
    miles: [["Chapter I", "Two lives", "She lived on one side of a river and he on the other, and the bridge was closed."], ["Chapter II", "The bridge", "It reopened on a Thursday. They met in the middle."], ["Chapter III", "The question", "At the top of a very tall staircase, with the whole castle listening."], ["Chapter IV", "The wedding", "24 April, in the orangery."]],
    bios: ["An illustrator who draws the dragons into the margins of every shopping list.", "A pastry chef whose cakes have been known to stop conversations."],
    events: [["Lantern welcome", "Fairy lights, lemonade and a very small orchestra.", "18:00", "20:30", true], ["The ceremony", "In the orangery, among the lemon trees.", "15:00", "16:00"], ["The feast", "A long table and a very tall cake.", "16:30", "23:30"]],
    hashtag: "AureliaAndSebastian", dress: "Soft pastels — pearl, blue, blush and lavender", thanks: "Thank you for believing in happily ever after.\n\nAurelia & Sebastian",
  },
  "black-tie-gala": {
    names: ["Vivienne", "Adrian"], last: ["Sinclair", "Delacroix"], date: "2027-12-11", venue: ["The Grand Ballroom, Hotel Aurelia", "1 Aurelia Plaza, Chicago, Illinois", "Chicago", 41.88, -87.62],
    tagline: "An evening to remember. Black tie, please.", invited: "The pleasure of your company is requested", quote: ["All the world's a stage.", "William Shakespeare"],
    intro: "She sings.\nHe plays the piano.\nIt took them four years to realise\nthey were in the same duet.",
    miles: [["2019", "The overture", "A jazz club at midnight. One stool. One piano. One request."], ["2021", "The duet", "Two voices, a very bad microphone and an encore."], ["2026", "The question", "From the stage, in front of four hundred strangers."], ["2027", "The performance", "11 December, in the Grand Ballroom."]],
    bios: ["A soprano with an alto's patience and a laugh that fills a hall.", "A pianist who plays everything by ear and refuses to read the programme."],
    events: [["Champagne reception", "In the foyer, beneath the chandeliers.", "17:30", "18:30"], ["The ceremony", "On the ballroom stage, with a string quartet.", "18:30", "19:15"], ["Gala dinner & dancing", "Five courses, a big band and the last waltz at midnight.", "19:30", "01:00"]],
    hashtag: "VivienneAndAdrian", dress: "Black tie — black, ivory and champagne", thanks: "Thank you for the standing ovation.\n\nVivienne & Adrian",
  },
  "modern-royal-romance": {
    names: ["Victoria", "Alexander"], last: ["Hastings", "Romanov-Lee"], date: "2027-01-30", venue: ["Castello di Verde", "Strada di Verde 4, 53100 Siena, Italy", "Siena", 43.32, 11.33],
    tagline: "A modern romance with a royal setting.", invited: "Together with their families", quote: ["My bounty is as boundless as the sea, my love as deep.", "William Shakespeare"],
    intro: "He is a restorer of castles.\nShe is a lawyer of contracts.\nThey have rarely agreed on a floor plan,\nand never on a toast.",
    miles: [["2020", "The first tour", "She was the guest, he was the guide, neither was convinced."], ["2022", "The first argument", "About a staircase. He was wrong; she let him say so."], ["2025", "The proposal", "In the ballroom that took him four years to restore."], ["2027", "The wedding", "30 January, in the Castello."]],
    bios: ["A lawyer who negotiates peace for a living and war over the thermostat for fun.", "An architect who restores castles and has never once let a wall surprise him."],
    events: [["Welcome dinner", "In the long gallery, by candlelight.", "19:00", "22:00", true], ["The ceremony", "In the great hall, with a harp and a string quartet.", "15:30", "16:30"], ["The wedding banquet", "Seven courses, five toasts and a waltz.", "19:00", "00:30"]],
    hashtag: "VictoriaAndAlexander", dress: "Formal — emerald, ivory, burgundy and gold", thanks: "Thank you for filling the castle with warmth.\n\nVictoria & Alexander",
  },
  "cinematic-proposal": {
    names: ["Hannah", "Elias"], last: ["Rowe", "Castellan"], date: "2027-07-10", venue: ["The Lighthouse Terrace", "Cliff Road, St Ives, Cornwall", "Cornwall", 50.21, -5.48],
    tagline: "The proposal. And then the wedding.", invited: "He asked. She said yes. You are invited.", quote: ["You must allow me to tell you how ardently I admire and love you.", "Jane Austen"],
    intro: "He had been planning it for months.\nShe had no idea.\nThe lighthouse keeper did.\nAnd now, so do you.",
    miles: [["How we met", "A wet Wednesday", "A bookshop, a missing umbrella and a shared copy of the same novel."], ["Closer", "The long way home", "A year of walking the coast path, a little further each time."], ["The proposal", "The lighthouse", "He asked at the top, where the light turns. She said yes before he finished the sentence."], ["Engaged to married", "The countdown", "Eight months of planning and one ring that has never left her hand."]],
    bios: ["A marine biologist who knows every tide on the coast and what they mean for the day.", "A lighthouse restorer who planned a proposal the way others plan a restoration."],
    events: [["The ceremony", "At the foot of the lighthouse, with the sea behind us.", "15:30", "16:15"], ["Supper on the terrace", "Fresh fish, long tables and a very good local cider.", "17:00", "21:30"], ["Dancing by the harbour", "A folk band, a lantern parade and a late swim.", "21:30", "00:30"]],
    hashtag: "HannahAndElias", dress: "Coastal warm — sand, brown and a touch of ember", thanks: "Thank you for being part of the next chapter.\n\nHannah & Elias",
  },
  "golden-hour-romance": {
    names: ["Clara", "Matteo"], last: ["Bellamy", "Ricci"], date: "2027-08-28", venue: ["Meadowlark Farm", "County Road 12, Napa Valley, California", "Napa", 38.5, -122.3],
    tagline: "We will say it at sunset.", invited: "Join us at golden hour", quote: ["Shall I compare thee to a summer's day?", "William Shakespeare"],
    intro: "The best light of the day lasts about forty minutes.\nWe plan to spend every one of them\nwith you.",
    miles: [["2019", "First light", "A farmers' market, two peaches, one very persuasive vendor."], ["2021", "Long shadows", "A summer of picnics that ended each evening on the same hill."], ["2025", "The question", "At golden hour, of course. He had checked the time."], ["2027", "Sunset", "28 August, at Meadowlark."]],
    bios: ["A photographer who has never taken a bad picture and never taken a day off.", "A vintner whose pinot is better than his punctuality."],
    events: [["Farm supper", "Long tables among the vines, as the light softens.", "18:00", "21:00", true], ["The ceremony", "On the hill, at the hour the light turns to honey.", "18:30", "19:15"], ["Dinner & dancing", "Under the string lights, with a barn band and a bonfire.", "19:30", "00:30"]],
    hashtag: "ClaraAndMatteo", dress: "Sunset colours — honey, terracotta and cream", thanks: "Thank you for the best light of our lives.\n\nClara & Matteo",
  },
  "noir-romance": {
    names: ["Margot", "Felix"], last: ["Duval", "Stein"], date: "2027-11-06", venue: ["The Roxy Hall", "88 Harbour Street, Montréal, Québec", "Montréal", 45.5, -73.57],
    tagline: "A love story in black and white.", invited: "She walks in beauty, like the night", quote: ["She walks in beauty, like the night.", "Lord Byron"],
    intro: "A rainy night.\nA streetlamp.\nA stranger holding the same door.\nThe rest is history, in black and white.",
    miles: [["1", "The door", "He held it. She walked through. Neither said a word."], ["2", "The rain", "A shared taxi, a wrong address and a very long ride."], ["3", "The question", "Under a streetlamp, in the rain, at two in the morning."], ["4", "The wedding", "6 November, at the Roxy."]],
    bios: ["A film editor who cuts for a living and keeps every outtake.", "A jazz bassist who plays the long notes and loves the quiet ones."],
    events: [["The ceremony", "At the Roxy, beneath the old marquee.", "17:00", "17:45"], ["Dinner", "A long table, a short toast and a candlelit room.", "18:30", "21:30"], ["The late show", "Jazz, dancing and a midnight screening of our first dance.", "21:30", "01:00"]],
    hashtag: "MargotAndFelix", dress: "Black and white — with a single touch of red", thanks: "Thank you for being in the picture.\n\nMargot & Felix",
  },
  "coastal-romance": {
    names: ["Marina", "Leo"], last: ["Pillai", "Fernandes"], date: "2027-07-24", venue: ["Sandpiper Cove", "Cliff Road, Varkala, Kerala 695141, India", "Varkala", 8.73, 76.7],
    tagline: "Barefoot, if you like.", invited: "Come to the sea with us", quote: ["Roll on, thou deep and dark blue Ocean — roll!", "Lord Byron"],
    intro: "She grew up by the sea.\nHe grew up far from it.\nThey met on a beach in the monsoon\nand decided the tide would do.",
    miles: [["2019", "The first wave", "A monsoon morning, a closed beach and two people who ignored the sign."], ["2021", "Low tide", "Long walks along the cliff, and a promise to keep walking."], ["2025", "The question", "At the edge of the water at sunrise. He got his shoes wet."], ["2027", "High tide", "24 July, at Sandpiper Cove."]],
    bios: ["A marine biologist who knows every shell on the shore and has opinions about all of them.", "A chef who cooks the catch of the day and has never once been bored by it."],
    events: [["Beach supper", "Lanterns on the sand and the day's catch on the grill.", "18:30", "21:30", true], ["The ceremony", "On the cliff above the water, at the turn of the tide.", "16:30", "17:15"], ["Reception", "A long seaside lunch and a band that plays until the tide comes in.", "17:30", "23:30"]],
    hashtag: "MarinaAndLeo", dress: "Light linen — sea blue, sand and ivory", thanks: "Thank you for coming to the sea with us.\n\nMarina & Leo",
  },
  "architectural-wedding": {
    names: ["Iris", "Anton"], last: ["Vance", "Keller"], date: "2027-09-04", venue: ["Pavilion on the Ridge", "Route de la Crête 3, 1950 Sion, Valais, Switzerland", "Valais", 46.23, 7.36],
    tagline: "A wedding built to scale.", invited: "You are invited to the opening", quote: ["Love is not love which alters when it alteration finds.", "William Shakespeare"],
    intro: "She draws buildings.\nHe builds them.\nThey disagree about everything\nexcept the one thing that matters.",
    miles: [["Plate 01", "The site", "A conference. A coffee. A competition they both lost."], ["Plate 02", "The brief", "A shared studio, a shared lease and one very small kitchen."], ["Plate 03", "The commission", "He proposed in the half-built pavilion, among the scaffolding."], ["Plate 04", "The completion", "4 September, in the Pavilion on the Ridge."]],
    bios: ["An architect who believes every room should have one good window and no bad ones.", "A structural engineer who has never let a wall fall down and never will."],
    events: [["Site visit & welcome", "A tour of the pavilion at golden hour, with wine and very tall ceilings.", "17:30", "20:00", true], ["The ceremony", "In the pavilion, beneath the great timber vault.", "15:30", "16:15"], ["Dinner & dancing", "A long table in the open hall and a DJ with a taste for brutalist techno.", "18:00", "00:30"]],
    hashtag: "IrisAndAnton", dress: "Considered neutrals — stone, charcoal and bone", thanks: "Thank you for coming to the opening.\n\nIris & Anton",
  },
  "floral-couture": {
    names: ["Rosalind", "Jasper"], last: ["Merrow", "Thorne"], date: "2027-05-15", venue: ["The Conservatory at Hartwell Park", "Hartwell Park, Kent, England", "Kent", 51.28, 0.52],
    tagline: "Every arrangement tells a story.", invited: "In full bloom", quote: ["O my Luve's like a red, red rose.", "Robert Burns"],
    intro: "He grows the flowers.\nShe arranges them.\nIt took them three seasons to notice\nthey were making one bouquet.",
    miles: [["2019", "The seed", "A flower market at five in the morning, a bucket of ranunculus and a shared taxi."], ["2021", "The first bloom", "Their first joint commission — a wedding in the rain."], ["2025", "The proposal", "In the greenhouse, under four hundred peonies."], ["2027", "In bloom", "15 May, in the Conservatory."]],
    bios: ["A floral designer with a studio full of buckets and a heart full of opinions.", "A grower who knows every bloom by its first leaf."],
    events: [["Flower supper", "In the greenhouse, among the blooms.", "18:00", "21:00", true], ["The ceremony", "In the conservatory, beneath an arch of peonies and roses.", "15:00", "16:00"], ["The celebration", "Garden lunch, cake and dancing among the roses.", "16:30", "23:00"]],
    hashtag: "RosalindAndJasper", dress: "Floral garden — blush, cream and sage", thanks: "Thank you for helping us bloom.\n\nRosalind & Jasper",
  },
  "animated-storybook": {
    names: ["Wren", "Oliver"], last: ["Fairweather", "Quill"], date: "2027-10-23", venue: ["Little Tern Library & Barn", "Meadow Lane, Woodstock, Vermont", "Vermont", 44.26, -72.58],
    tagline: "Our story, page by page.", invited: "Once upon a time", quote: ["Begin at the beginning, and go on till you come to the end: then stop.", "Lewis Carroll"],
    intro: "There once was a librarian\nwho collected endings\nand a writer\nwho could never finish one.",
    miles: [["Chapter I", "The beginning", "A small library, a very large cat and a missing first edition."], ["Chapter II", "The middle", "Three years of letters, three hundred books and one shared shelf."], ["Chapter III", "The twist", "He proposed in the margins of her favourite novel."], ["Chapter IV", "The happy ending", "23 October, in the barn behind the library."]],
    bios: ["A librarian who has read everything and recommends the rest.", "A children's author who can never find a good ending until now."],
    events: [["The story begins", "Cider and storytelling in the library.", "15:00", "16:00"], ["The ceremony", "In the barn, beneath the rafters and a thousand paper lanterns.", "16:30", "17:15"], ["The feast", "A long table, a longer story and dancing until the last page.", "18:00", "23:00"]],
    hashtag: "WrenAndOliver", dress: "Storybook — leaf green, burnt orange and cream", thanks: "Thank you for being in our story.\n\nWren & Oliver",
  },
  "documentary-wedding": {
    names: ["Josie", "Sam"], last: ["Tate", "Alvarez"], date: "2027-09-25", venue: ["Hollow Creek Farm", "Hollow Creek Road, Asheville, North Carolina", "Asheville", 35.6, -82.55],
    tagline: "A wedding, as it happens.", invited: "A film about us", quote: ["Heaven is under our feet as well as over our heads.", "Henry David Thoreau"],
    intro: "No script. No staging.\nJust the two of us,\nsome very good friends\nand a film crew of one.",
    miles: [["2017", "Meeting", "A mountain trail, a wrong turn and a very long conversation."], ["2020", "Moving in", "A one-room cabin, one very small stove and one very big dog."], ["2025", "Asking", "By the creek, at dawn, with the dog watching."], ["2027", "Marrying", "25 September, at the farm."]],
    bios: ["A trail guide who has never been lost and has opinions about it.", "A sound recordist who has captured every birdsong in the county."],
    events: [["Friday supper", "Fire pit, folding chairs and a pot of chilli.", "18:00", "21:30", true], ["The ceremony", "On the hill above the creek.", "15:00", "15:45"], ["Dinner & dancing", "A long table in the barn and a band made up of friends.", "17:00", "23:00"]],
    hashtag: "JosieAndSam", dress: "Whatever you'd wear to a long walk — natural tones, please", thanks: "Thank you for being in the film.\n\nJosie & Sam",
  },
  "romantic-watercolour": {
    names: ["Lily", "Arthur"], last: ["Hollis", "Devereux"], date: "2027-04-17", venue: ["The Painter's House", "Rue Claude Monet, 27620 Giverny, France", "Giverny", 49.08, 1.53],
    tagline: "A wedding painted in soft colours.", invited: "You are invited to a quiet celebration", quote: ["I wandered lonely as a cloud.", "William Wordsworth"],
    intro: "She paints in watercolours.\nHe writes in pencil.\nBoth of them rub things out\nuntil they are right.",
    miles: [["2019", "The sketch", "A gallery in the rain, two umbrellas and one painting they both liked."], ["2021", "The wash", "A summer of letters, painted on the back of the envelopes."], ["2025", "The question", "In her studio, with a brush still in her hand."], ["2027", "The finished work", "17 April, in the garden at Giverny."]],
    bios: ["A painter who makes colour out of water and light.", "A poet who edits everything but her."],
    events: [["Welcome tea", "In the painter's house, with the windows open.", "16:00", "18:00", true], ["The ceremony", "In the garden, beside the pond and the water lilies.", "15:00", "15:45"], ["Supper & dancing", "Long tables on the lawn and a quartet that plays Debussy and then Dolly Parton.", "17:00", "22:30"]],
    hashtag: "LilyAndArthur", dress: "Soft watercolours — blush, sage, blue and cream", thanks: "Thank you for adding colour to our day.\n\nLily & Arthur",
  },
  "luxury-destination": {
    names: ["Valentina", "Gabriel"], last: ["Rossi", "Almeida"], date: "2027-11-20", venue: ["Hotel Marinha", "Cais do Sodré 4, 1200 Lisbon, Portugal", "Lisbon", 38.7, -9.14],
    tagline: "A weekend in Lisbon. Wedding included.", invited: "Join us in Lisbon", quote: ["I travel not to go anywhere, but to go.", "Robert Louis Stevenson"],
    intro: "She is from Rome.\nHe is from Rio.\nThey both love Lisbon\nand neither of them would let the other choose.",
    miles: [["2018", "Rome", "A rooftop, a sunset and a flight he nearly missed."], ["2020", "Rio", "A year of long distance and longer layovers."], ["2024", "Lisbon", "A yellow tram, a wrong turn and a question."], ["2027", "Forever", "20 November — the whole weekend, from the Friday dinner."]],
    bios: ["A travel editor who has seen every beautiful place and chose this one.", "A hotelier who has hosted a thousand weddings and never his own."],
    events: [["Welcome dinner", "A tasting menu at the hotel rooftop, over the river.", "19:30", "22:30", true], ["The ceremony", "In the hotel's tiled courtyard, with the river behind.", "16:00", "17:00"], ["Reception & after", "Dinner, fado and a late-night walk to the quay.", "19:00", "01:00"]],
    hashtag: "ValentinaAndGabrielInLisbon", dress: "Resort elegant — bone, stone and bronze", thanks: "Thank you for travelling so far for us.\n\nValentina & Gabriel",
  },
  "epic-premiere": {
    names: ["Scarlett", "Max"], last: ["Quinn", "Delaney"], date: "2027-12-04", venue: ["The Majestic Theatre", "Palace Row, Los Angeles, California", "Los Angeles", 34.05, -118.25],
    tagline: "The wedding premiere. One night only.", invited: "A film premiere in two acts", quote: ["If music be the food of love, play on.", "William Shakespeare"],
    intro: "Two leads.\nOne unforgettable script.\nA cast of everyone they love.\nThe premiere begins at seven.",
    miles: [["Act I", "The casting", "An audition, a callback and a screen test they have never let anyone watch."], ["Act II", "The rehearsals", "Four years of long scenes, short tempers and very good reviews."], ["Act III", "The proposal", "Centre stage, in front of the whole company."], ["The premiere", "4 December", "At the Majestic Theatre."]],
    bios: ["An actress who has played everyone except herself, and is about to start.", "A director who has never missed a cue and is not about to start."],
    events: [["Red carpet", "Arrivals on the red carpet with photographers and champagne.", "17:30", "18:30"], ["The ceremony", "On the main stage, with the full orchestra.", "18:30", "19:15"], ["The premiere party", "Dinner, a live band and an after-party that nobody wants to leave.", "19:30", "01:00"]],
    hashtag: "ScarlettAndMaxPremiere", dress: "Premiere — black, deep red and champagne", thanks: "Thank you for the standing ovation.\n\nScarlett & Max",
  },
  "infinite-love": {
    names: ["Nova", "Kai"], last: ["Bright", "Moreau"], date: "2027-08-07", venue: ["Orbit Hall", "Aurora Quay 7, 101 Reykjavík, Iceland", "Reykjavík", 64.15, -21.94],
    tagline: "Two orbits. One universe. See you there.", invited: "Enter our universe", quote: ["To see a world in a grain of sand, and eternity in an hour.", "William Blake"],
    intro: "She builds worlds in code.\nHe maps them in light.\nThey are about to launch\nthe only world that matters.",
    miles: [["Signal", "First contact", "A shared sky in a chat room at two in the morning."], ["Orbit", "Closer", "Four years of time zones, long calls and shorter flights."], ["Alignment", "The question", "On a glacier, under the aurora, with the whole sky watching."], ["Launch", "The wedding", "7 August, at Orbit Hall."]],
    bios: ["A game designer who builds universes for a living and one very small one at home.", "A lighting artist who paints with the aurora and has never needed a ladder."],
    events: [["Pre-launch dinner", "Geothermal pools and a long table by the harbour.", "18:30", "21:30", true], ["The ceremony", "Under the midnight sun, in the great hall of glass.", "17:00", "17:45"], ["Launch party", "Dinner, a light show and an orbit of dancing until dawn.", "19:00", "02:00"]],
    hashtag: "NovaAndKai", dress: "Future classic — deep night, aqua and violet", thanks: "Thank you for being part of our universe.\n\nNova & Kai",
  },
};

const days = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const initials = (a: string, b: string) => `${a[0]}${b[0]}`.toUpperCase();
const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const slugOf = (names: [string, string]) => `${names[0]}-and-${names[1]}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const GALLERY_CAPTIONS = ["The first look", "A quiet moment", "Hand in hand", "The light was perfect", "Just us", "Forever starts here", "The day before", "The long way home", "Dressed for the day", "Always"];

/** One ShowcaseCfg per cinematic template, in specification order. */
export const CINEMATIC_DEMOS: ShowcaseCfg[] = CINEMATIC_SPECS.map((spec): ShowcaseCfg => {
  const c = COPY[spec.slug];
  const cast = CASTING[spec.slug];
  if (!c || !cast) throw new Error(`No sample copy or casting for template ${spec.slug}`);
  const [a, b] = c.names;
  if (slugOf(c.names) !== spec.demo) throw new Error(`${spec.slug}: its sample is "${spec.demo}" but the couple is ${slugOf(c.names)}`);
  const fact = CINEMATIC_SAMPLE_FACTS[spec.slug];
  if (!fact || fact[0] !== `${c.names[0]} & ${c.names[1]}` || fact[1] !== c.date || fact[2] !== c.venue[0] || fact[3] !== c.venue[2]) throw new Error(`${spec.slug}: the shop-window facts (src/domain/catalogue/cinematic-samples.ts) disagree with the sample`);
  const theme = THEME_SEEDS.find((t) => t.slug === spec.theme)!.tokens.colors;
  const place = `${c.venue[0]}, ${c.venue[2]}`;
  const venueKey = "venue1";
  const event = (e: Copy["events"][number], i: number) => ({
    name: e[0], date: e[4] ? days(c.date, -1) : c.date, start: e[2], end: e[3], venue: venueKey, description: e[1], dress: i === 1 ? c.dress : "As the day suggests", colors: [theme.background, theme.primary, theme.accent],
    ...(i === 1 ? { main: true as const } : {}),
  });
  const needs: Need[] = [
    ["hero", cast.hero, "COUPLE"],
    ...(cast.wide ? [["wide", cast.wide, "COUPLE"] as Need] : []),
    ["bride", cast.bride, "BRIDE"], ["groom", cast.groom, "GROOM"], ["story", cast.story, "COUPLE"], ["venue", cast.venue, "VENUE"], ["ceremony", cast.ceremony, "EVENT"],
    ...cast.milestones.map((m, i): Need => [`m${i + 1}`, m, "COUPLE"]),
  ];
  const gallery = cast.gallery.map((id, i): [string, string] => [id, GALLERY_CAPTIONS[i % GALLERY_CAPTIONS.length]]);
  const venueCfg = {
    key: venueKey, name: c.venue[0], address: c.venue[1], city: c.venue[2], lat: c.venue[3], lng: c.venue[4], mapUrl: mapsUrl(`${c.venue[0]} ${c.venue[2]}`), photo: "venue",
    airport: `The nearest international airport to ${c.venue[2]} is about 45 minutes away by road.`, railway: `${c.venue[2]} has a regular rail connection; taxis wait at the station.`,
    road: `Follow the signs for ${c.venue[0]}. A shuttle runs from the town every thirty minutes.`, parking: "Free parking at the entrance; valet on request.",
  };
  return {
    slug: spec.demo, title: `${a} & ${b}`, date: c.date, template: spec.slug, theme: spec.theme, track: "", libraryTrack: spec.music?.[0], eventType: "wedding",
    journey: { style: "western", headZoom: { bride: 1, groom: 1 } },
    images: { couple: "hero", coupleWide: cast.wide ? "wide" : undefined, story: "story", ceremony: "ceremony" },
    bride: { name: a, fullName: `${a} ${c.last[0]}`, parents: `Daughter of ${c.last[0]} family`, bio: c.bios[0], photo: "bride" },
    groom: { name: b, fullName: `${b} ${c.last[1]}`, parents: `Son of ${c.last[1]} family`, bio: c.bios[1], photo: "groom" },
    tagline: c.tagline, invitation: c.invited, quote: { text: c.quote[0], author: c.quote[1] }, hashtag: c.hashtag, monogram: initials(a, b),
    venues: [venueCfg],
    events: c.events.map(event),
    family: { brideName: `The ${c.last[0]} family`, groomName: `The ${c.last[1]} family`, members: [["bride", `Margaret ${c.last[0]}`, "Mother of the bride"], ["bride", `Thomas ${c.last[0]}`, "Father of the bride"], ["groom", `Anne ${c.last[1]}`, "Mother of the groom"], ["groom", `Louis ${c.last[1]}`, "Father of the groom"]] },
    intro: c.intro,
    milestones: c.miles.map(([year, title, caption], i) => [year, title, caption, `m${i + 1}`]),
    ceremoniesIntro: "",
    ceremonies: [["The vows", c.events[1][2], "Our families and closest friends gather as we say the words we have written for each other.", "rings"], ["The signing", "", "Two witnesses, one pen and a very small table.", "flower"], ["The first toast", "", "Glasses raised before the first dance.", "flame"]],
    rsvp: { deadline: days(c.date, -45), pickups: [`${c.venue[2]} airport`, `${c.venue[2]} station`], whatsapp: "" },
    whatsapp: "917356741055", whatsappMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
    contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
    palette: { colors: [[theme.background, "Paper"], [theme.primary, "Deep"], [theme.accent, "Accent"], [theme.inverse, "Night"]], note: c.dress },
    dressAvoid: "Please avoid white or ivory for the ceremony — it belongs to the bride.",
    opening: { variant: spec.opening, sealText: initials(a, b), invited: c.invited },
    thankYou: { message: c.thanks, signature: `${a} & ${b}`, photo: "hero" },
    seo: { title: `${a} & ${b} — Wedding Invitation`, description: `${spec.tagline} A sample design by Invites by Stack Bridge Labs.`, og: "hero" },
    needs, gallery,
    wishes: [["Rhea Kapoor", "Friend", `From the first scene to the last — ${place} will never be the same. Congratulations!`], ["Daniel Okoye", "Colleague", "I have seen you two negotiate a menu. You are going to be fine."], ["Sofia Marin", "Cousin", "Counting the days. We are bringing the dancing shoes."]],
    extra(doc: InvitationDoc) {
      // the announcement, written once and shown wherever the template asks for an “about” page
      doc.occasion.about = {
        eyebrow: { en: spec.tone ?? "" }, title: { en: "The invitation" }, body: { en: `${c.invited}\n\n${a} & ${b}\n\nrequest the pleasure of your company at their wedding on ${c.date.slice(8)} ${["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][Number(c.date.slice(5, 7))]} ${c.date.slice(0, 4)}, at ${place}.` },
        quote: { text: { en: "" }, author: {} }, highlights: [],
      };
      doc.occasion.message = { title: { en: "A few words from us" }, body: { en: `We have been planning this for a long time, and we cannot wait to see your faces. Come as you are, stay as long as you like, and dance as if nobody were watching — somebody will be, but they will be dancing too.\n\n${c.thanks.split("\n")[0]}` }, from: { en: `${a} & ${b}` }, role: { en: "" }, photo: undefined };
      doc.journey.enabled = false;
      doc.live = { ...doc.live, streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", streamLabel: { en: "Watch the ceremony live" }, description: { en: "Can't make it in person? The ceremony will be streamed live." }, startsAt: `${c.date}T${c.events[1][2]}`, endsAt: `${c.date}T${c.events[1][3]}`, showCountdown: true, instructions: { en: "Join five minutes early. The stream opens on this page when the ceremony begins." }, endedMessage: { en: "Thank you for celebrating with us from wherever you were." } } as never;
      doc.menu = { courses: [{ id: newId(), title: { en: "To begin" }, items: [{ id: newId(), name: { en: "A seasonal starter" }, note: { en: "Chosen by the kitchen that morning." }, veg: true }] }, { id: newId(), title: { en: "To follow" }, items: [{ id: newId(), name: { en: "A roast, a fish or something green" }, note: { en: "Your reply tells us which." }, veg: false }] }], note: { en: "Please tell us about any allergies when you reply." } };
    },
  };
});

export const CINEMATIC_SLUGS = CINEMATIC_DEMOS.map((d) => d.slug);
