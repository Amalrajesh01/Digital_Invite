import type { OccasionCfg } from "./occasion";
import { sectionCopy } from "./showcase";
import { BAPTISM_SPECS } from "../../src/domain/design/template-specs-baptism";
import { BAPTISM_SAMPLES } from "../../src/domain/catalogue/baptism-samples";
import { verseById, verseSource, verseText } from "../../src/domain/baptism/scripture";
import { GENERATED } from "../../src/domain/baptism/generated";
import { assetIdFor, type Slot } from "../../src/domain/baptism/images";
import { STORY, finaleBlessing, galleryHeading, galleryOf } from "../../src/domain/baptism/story";

/**
 * The sample invitation behind each of the baptism templates. The children, families, churches and addresses are fictional and
 * written in the voice of their template (a letter, a missal, a storybook, a garden journal); the verse each one quotes is exact
 * (`src/domain/baptism/scripture.ts`). What the gallery says about a sample — the child, the date, the church, the city — lives in
 * `src/domain/catalogue/baptism-samples.ts`, which this file is built from, so the two can never disagree.
 *
 * Photographs: every sample shows the baby that opens its template, a gallery told as chapters and (where the pool has one) a picture of
 * the parents or the grandparents — licensed stand-ins chosen in `src/domain/baptism/story.ts`. They stand in for a family’s own, which
 * replace them in the studio; godparents, who have no stand-in, are introduced by name with a monogram.
 */
type Glyph = "lamp" | "kalash" | "flame" | "rings" | "drum" | "flower" | "bowl" | "knot" | "none";
interface Data {
  full: string; role: string; age: string; born?: string;
  subtitle: string; invited: string; hosts: string;
  start: string; end: string; service: string; serviceNote: string;
  address: string; lat: number; lng: number; parking?: string; road?: string;
  after?: { name: string; start: string; end: string; description: string; hall?: { name: string; address: string; lat: number; lng: number } };
  about: { eyebrow: string; title: string; body: string; facts: [string, string, string?][] };
  people: [group: string, name: string, relation: string, note?: string][];
  message?: { title: string; body: string; from: string; role: string };
  ceremonies?: [name: string, when: string, description: string, glyph: Glyph][];
  milestones?: [year: string, title: string, caption: string][];
  copy?: Partial<Record<"people" | "events" | "ceremonies" | "message" | "prayer" | "venue" | "rsvp", [eyebrow?: string, title?: string]>>;
  prayerTitle?: string;
  dress?: string;
  palette?: [hex: string, name: string][];
  meal?: string[];
  thanks: string;
  wishes: [name: string, relationship: string, message: string][];
  music: string;
}

const DATA: Record<string, Data> = {
  "heavenly-grace": {
    full: "Anya Mariam Thomas", role: "Our daughter", age: "3 months", born: "2 October 2026",
    subtitle: "a little blessing", invited: "You are invited to the baptism of", hosts: "Reena & Joseph Thomas",
    start: "10:00", end: "11:15", service: "Holy Qurbana and baptism", serviceNote: "The baptism takes place during the parish Holy Qurbana. Please be seated by ten.",
    address: "14 Church Road, Mattancherry, Kochi 682002", lat: 9.9658, lng: 76.2421, parking: "The parish ground behind the church has room for sixty cars; volunteers will guide you.", road: "Ten minutes from Fort Kochi along Church Road; the church is on the left after the bridge.",
    after: { name: "Lunch together", start: "11:30", end: "13:30", description: "A simple lunch in the parish hall, next door. Everyone is welcome to stay." },
    about: { eyebrow: "A gift from heaven", title: "Welcome, Anya", body: "Three months ago, our quiet house learned a new sound. On Sunday we will carry Anya to the font, where the Church will call her by name and welcome her as its own.\n\nCome and pray with us. Your blessing is the only gift we ask for.", facts: [["10 am", "Holy Qurbana and baptism"], ["11:30", "Lunch in the parish hall"], ["3 months", "Anya’s age on the day"]] },
    people: [["Her parents", "Reena Thomas", "Mother"], ["Her parents", "Joseph Thomas", "Father"], ["Her grandparents", "Thomas Kurian", "Appachan", "Joseph’s father"], ["Her grandparents", "Mariamma Thomas", "Ammachi", "Joseph’s mother"], ["Her grandparents", "Philip Joseph", "Appachan", "Reena’s father"], ["Her grandparents", "Susan Philip", "Ammachi", "Reena’s mother"], ["Her godparents", "Anitha Mathew", "Godmother"], ["Her godparents", "Biju Varghese", "Godfather"]],
    copy: { people: ["Who is holding her", "Her family and godparents"], events: ["Sunday 24 January", "The morning"], prayer: ["Her verse"] },
    music: "heart-of-nowhere", dress: "White, cream or soft blue. Something you can kneel in.",
    thanks: "Thank you for praying with us, and for the blessing you carried in with you. Anya will be told, many times, who came.\n\nWith love,",
    wishes: [["Lissy Chacko", "Great-aunt", "May she grow in wisdom and in grace. We held you in prayer all week."], ["Fr. Jose Mathew", "Parish priest", "Welcome to the family of God, little Anya."]],
  },
  "blessing-from-above": {
    full: "Nathan Varghese Mathew", role: "Our son", age: "5 months", born: "11 September 2026",
    subtitle: "a blessing from above", invited: "With joy, we invite you to the baptism of", hosts: "Ancy & Mathew Varghese",
    start: "16:30", end: "17:45", service: "Evening prayer and baptism", serviceNote: "Evening prayer begins at 4:30; the baptism follows. Women are asked to cover their heads, as is our custom.",
    address: "St. Gregorios Orthodox Church, Nagampadam, Kottayam 686001", lat: 9.5916, lng: 76.5222, parking: "Parking is available on the church lawn and along the side road.", road: "Three minutes from the Kottayam KSRTC stand.",
    after: { name: "Tea and snacks", start: "18:00", end: "19:30", description: "Tea, cake and a family photograph in the hall." },
    about: { eyebrow: "Under the light", title: "Nathan", body: "Our son was born on a rainy September night, and since then every day has felt like a gift handed down.\n\nWe invite you to the church to hear his name spoken in the Father’s name, the Son’s and the Holy Spirit’s. Come early if you can; the evening light in the nave is something to see.", facts: [["4:30 pm", "Evening prayer"], ["5:00", "The baptism"], ["6:00", "Tea in the hall"]] },
    message: { title: "From his grandparents", body: "Our dear Nathan,\n\nYou were not born yet when we first prayed your name. This evening, in front of the whole church, we will pray it again — and this time you will be in our arms.\n\nMay the light that falls on you tonight follow you all your life.", from: "Varghese & Annamma Mathew", role: "Nathan’s grandparents" },
    people: [["Parents", "Ancy Mathew", "Mother"], ["Parents", "Mathew Varghese", "Father"], ["Godparents", "Fr. Koshy Philip", "Godfather"], ["Godparents", "Sarah Thomas", "Godmother"]],
    copy: { people: ["His family", "Who stands with him"], events: ["Sunday 7 February", "The evening"] },
    music: "canon-two-harps",
    thanks: "Thank you for sharing the evening. We will remember who prayed.\n\nAncy, Mathew & Nathan",
    wishes: [["Rev. Jacob Kurian", "Family friend", "May he always walk in the light you gave him today."], ["Teena Abraham", "Cousin", "Welcome, Nathan. We cannot wait to hold you."]],
  },
  "sacred-waters": {
    full: "Ezra Samuel Joseph", role: "Our son", age: "4 months", born: "14 October 2026",
    subtitle: "named in the water", invited: "Please join us for the baptism of", hosts: "Priya & Jonathan Samuel",
    start: "09:30", end: "11:00", service: "Morning worship and baptism", serviceNote: "The baptism is part of the Sunday service; the whole congregation joins in the vows.",
    address: "CSI Immanuel Church, Poonamallee High Road, Chennai 600084", lat: 13.0827, lng: 80.2707, parking: "Church compound and the school ground opposite.", road: "Auto from Egmore station in fifteen minutes.",
    after: { name: "Fellowship lunch", start: "11:15", end: "13:00", description: "Lunch with the congregation in the church hall." },
    about: { eyebrow: "Water and word", title: "Ezra", body: "On Sunday the pastor will pour water over our son’s head three times and say his name. It takes less than a minute and means everything.\n\nWe have written the steps below so that those who have not seen a baptism in our church can follow each part.", facts: [["9:30", "Worship begins"], ["10:15", "The baptism"], ["11:15", "Lunch"]] },
    ceremonies: [["The sign of the cross", "10:10", "The pastor traces the cross on Ezra’s forehead and the congregation answers.", "none"], ["The vows", "10:15", "Priya and Jonathan, with the godparents, promise to bring Ezra up in the faith.", "flame"], ["The water", "10:20", "Water is poured three times, in the name of the Father, the Son and the Holy Spirit.", "bowl"], ["The welcome", "10:25", "The congregation welcomes Ezra by name, and a candle is lit for him.", "lamp"]],
    people: [["Parents", "Priya Samuel", "Mother"], ["Parents", "Jonathan Samuel", "Father"], ["Godparents", "Esther Daniel", "Godmother"], ["Godparents", "Rev. Paul Isaac", "Godfather"]],
    copy: { ceremonies: ["The service", "What happens, step by step"], people: ["With him", "His family and godparents"] },
    music: "northern-glade",
    thanks: "Thank you for standing with us at the water. Ezra will hear the story, many times, of who was there.\n\nPriya, Jonathan & Ezra",
    wishes: [["Pastor Daniel", "Pastor", "Welcome, Ezra, to the family of God."], ["Merlin George", "Neighbour", "Praying for a happy Sunday for all of you."]],
  },
  "kerala-christian-heritage": {
    full: "Maria Elizabeth Jacob", role: "Our daughter", age: "4 months", born: "3 November 2026",
    subtitle: "named in the old way", invited: "With the blessing of our elders, we invite you to the baptism of", hosts: "Susan & Abraham Jacob",
    start: "08:30", end: "10:00", service: "Holy Communion service and baptism", serviceNote: "The baptism follows the Holy Communion service. Guests of other churches are most welcome.",
    address: "St. Thomas Mar Thoma Church, Church Road, Thiruvalla 689101", lat: 9.3844, lng: 76.5741, parking: "Parking on the school ground behind the church.", road: "Five minutes from Thiruvalla railway station.",
    after: { name: "Sadya at home", start: "11:00", end: "14:00", description: "A feast on banana leaf at the family home, a short drive from the church.", hall: { name: "Kuzhivelil House", address: "Kuzhivelil, Kavumbhagom, Thiruvalla 689102", lat: 9.3819, lng: 76.5805 } },
    about: { eyebrow: "A name from the family", title: "Maria Elizabeth", body: "She is named for her father’s mother and her mother’s grandmother, as the first daughters of this family have been for four generations.\n\nCome and bless her, and meet the elders who will tell her all the old stories.", facts: [["8:30 am", "Service begins"], ["11:00", "Sadya at Kuzhivelil"], ["4 months", "Her age on the day"]] },
    message: { title: "From Appachan and Ammachi", body: "Our dear ones,\n\nWe have waited a long time for this granddaughter, and now we will hold her at the font. She carries the names of two women who loved this church.\n\nCome, share in the blessing, and stay for the sadya — Ammachi has been cooking since Thursday.", from: "K. M. & Aleyamma Jacob", role: "Maria’s grandparents" },
    ceremonies: [["Lighting the lamp", "8:15 am", "The eldest in the family lights the nilavilakku at the church door, as we do for every first blessing.", "lamp"], ["The service and baptism", "8:30 am", "Holy Communion, then the baptism in the name of the Father, the Son and the Holy Spirit.", "none"], ["The blessing of the family", "9:40 am", "The priest blesses Maria, her parents, godparents and grandparents.", "flower"], ["The sadya", "11:00 am", "A vegetarian and non-vegetarian feast at home, served on banana leaf.", "bowl"]],
    people: [["Her parents", "Susan Jacob", "Mother"], ["Her parents", "Abraham Jacob", "Father"], ["Appachan and Ammachi", "K. M. Jacob", "Appachan", "Abraham’s father"], ["Appachan and Ammachi", "Aleyamma Jacob", "Ammachi", "Abraham’s mother"], ["Appachan and Ammachi", "P. T. Mathai", "Appachan", "Susan’s father"], ["Appachan and Ammachi", "Saramma Mathai", "Ammachi", "Susan’s mother"], ["Her godparents", "Elizabeth Varghese", "Godmother", "Susan’s sister"], ["Her godparents", "Thomas Koshy", "Godfather"]],
    copy: { people: ["Her people", "Who will hold her"], ceremonies: ["The morning", "How the day unfolds"], message: ["A few words"], events: ["Sunday 7 March", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], dress: "Cream and gold, as for a Sunday service. Women may wear a set-mundu or a saree; men a mundu or a white shirt.", palette: [["#F4EBD0", "Kasavu cream"], ["#B8913E", "Antique gold"], ["#1F4A37", "Forest green"]],
    music: "ascending-the-vale",
    thanks: "Your blessing will stay with Maria all her life. Thank you for coming, and for eating so much of Ammachi’s fish curry.\n\nWith love,",
    wishes: [["Latha Mathew", "Great-aunt", "Welcome, Maria Mol. May you be as good as your names."], ["Fr. Philip Kuruvilla", "Family priest", "We pray for you at every Sunday service."]],
  },
  "little-prince-of-grace": {
    full: "Aaron Joseph D’Souza", role: "Our son", age: "11 months", born: "20 April 2026",
    subtitle: "our little prince", invited: "Once upon a time… you are invited to the baptism of", hosts: "Neha & Rohan D’Souza",
    start: "11:00", end: "12:15", service: "Holy Mass and baptism", serviceNote: "The baptism takes place after the homily at the 11 o’clock Sunday Mass.",
    address: "Church of the Good Shepherd, Camp Road, Pune 411001", lat: 18.5204, lng: 73.8567, parking: "Parking in the church compound; overflow on Camp Road after 10:30.", road: "Fifteen minutes from Pune station by auto.",
    after: { name: "Lunch at home", start: "13:00", end: "15:30", description: "Biryani and cake at the family flat — a short drive from the church.", hall: { name: "The D’Souza home", address: "Flat 7, Rose Court, Koregaon Park, Pune 411001", lat: 18.5362, lng: 73.8937 } },
    about: { eyebrow: "A new chapter", title: "Aaron", body: "He arrived six pounds nine ounces, with a full head of hair and no interest in sleeping. We are told the story of a family is written one page at a time.\n\nWe would like you to be on the page where he is baptised.", facts: [["11 am", "Sunday Mass"], ["1 pm", "Lunch at home"], ["11 months", "Aaron’s age on the day"]] },
    milestones: [["July 2025", "The news", "A held breath, a test, and a long phone call to both grandmothers."], ["April 2026", "He arrived", "A little after midnight, to the sound of the night nurse humming a hymn."], ["March 2027", "His baptism", "Sunday morning, with everyone who prayed for him."]],
    people: [["His parents", "Neha D’Souza", "Mother"], ["His parents", "Rohan D’Souza", "Father"], ["His grandparents", "Francis & Lorna D’Souza", "Grandpa and Grandma"], ["His grandparents", "Anil & Meena Sequeira", "Nanu and Nani"], ["His godparents", "Cynthia Fernandes", "Godmother"], ["His godparents", "Joel Pinto", "Godfather"]],
    copy: { people: ["The people in his story", "Who is holding him"], events: ["Sunday 21 March", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "simple-duet",
    thanks: "Thank you for being in this chapter. We will tell Aaron, one day, how many people came.\n\nNeha, Rohan & Aaron",
    wishes: [["Aunty Lorna", "Grandma", "To our little prince: the whole kingdom is yours."], ["Cynthia Fernandes", "Godmother", "I have already bought the first of many storybooks."]],
  },
  "little-princess-of-heaven": {
    full: "Hannah Grace Mathew", role: "Our daughter", age: "5 months", born: "9 November 2026",
    subtitle: "our little princess", invited: "You are warmly invited to the baptism of", hosts: "Ruth & Daniel Mathew",
    start: "10:30", end: "11:45", service: "Sunday worship and baptism", serviceNote: "The baptism is the second part of the 10:30 service.",
    address: "Grace Methodist Church, Cunningham Road, Bengaluru 560052", lat: 12.9716, lng: 77.5946, parking: "The church compound and the road in front of it.", road: "Ten minutes from Cubbon Park metro station.",
    after: { name: "Garden lunch", start: "12:15", end: "14:30", description: "Lunch and cake in the church garden. Little ones welcome." },
    about: { eyebrow: "Our little princess", title: "Hannah", body: "We prayed for her before we knew her name, and her name means ‘grace’.\n\nSunday morning, with flowers in the church and everyone we love in the pews, we will give thanks for her.", facts: [["10:30", "Worship and baptism"], ["12:15", "Lunch in the garden"], ["5 months", "Hannah’s age on the day"]] },
    message: { title: "From Mama and Papa", body: "We prayed for you before we knew your name. Come and pray for her with us.", from: "Ruth & Daniel", role: "Hannah’s parents" },
    people: [["Her parents", "Ruth Mathew", "Mother"], ["Her parents", "Daniel Mathew", "Father"], ["Her grandparents", "Joseph & Leela Mathew", "Appachan and Ammachi"], ["Her grandparents", "Reuben & Sharon Cherian", "Appachan and Ammachi"], ["Her godparents", "Deepa George", "Godmother"], ["Her godparents", "Samuel Thomas", "Godfather"]],
    copy: { people: ["Her little court", "The people who love her"], events: ["Sunday 4 April", "The day"] },
    music: "there-is-romance", dress: "Soft pinks, ivories and pale blues are lovely; flowers in the hair for the girls are very welcome.",
    thanks: "Thank you for loving our little one so well. Her pram is already full of your gifts.\n\nRuth, Daniel & Hannah",
    wishes: [["Aunty Susan", "Great-aunt", "Little Hannah — our whole family is lighter because of you."], ["Pastor Reuben", "Pastor", "May grace follow you every day of your life."]],
  },
  "generations-of-faith": {
    full: "Isaac George Mathew", role: "Our son", age: "6 months", born: "4 October 2026",
    subtitle: "the fourth generation", invited: "Our family would be honoured by your presence at the baptism of", hosts: "Merin & George Mathew",
    start: "09:00", end: "10:30", service: "Holy Qurbana and baptism", serviceNote: "The baptism follows the Holy Qurbana. Guests of other churches are most welcome.",
    address: "St. Mary’s Jacobite Church, Kizhathadiyoor, Pala 686575", lat: 9.7100, lng: 76.6830, parking: "Parking is available in the church compound and the nearby school.", road: "Twelve minutes from Pala town.",
    after: { name: "Lunch at the family house", start: "11:30", end: "14:30", description: "Lunch for the whole family at the old house, where four generations have celebrated.", hall: { name: "Kalapurackal House", address: "Kizhathadiyoor, Pala 686575", lat: 9.7085, lng: 76.6911 } },
    about: { eyebrow: "The fourth generation", title: "Isaac", body: "Isaac is the fourth of our family to be baptised in this church, in front of the same altar.\n\nHis great-grandmother, Achamma, is ninety-one. She will be the first to hold him afterwards.", facts: [["4", "Generations at the font"], ["9 am", "Holy Qurbana and baptism"], ["91", "His great-grandmother’s years"]] },
    message: { title: "A letter from Appachan and Ammachi", body: "To Isaac, who is too young to read this,\n\nWe were baptised in this church, and so was your father. When you read this, you will find our names on the same page of the same book.\n\nWe do not know what the world will look like when you are our age. We know only that you will be held in the same hands that held us, and we are grateful.", from: "Mathew & Annamma Kalapurackal", role: "Isaac’s paternal grandparents" },
    people: [["His great-grandmother", "Achamma Kalapurackal", "Achamma", "Ninety-one years old"], ["His grandparents", "Mathew Kalapurackal", "Appachan", "George’s father"], ["His grandparents", "Annamma Kalapurackal", "Ammachi", "George’s mother"], ["His grandparents", "Chacko Pulickal", "Appachan", "Merin’s father"], ["His grandparents", "Aleykutty Pulickal", "Ammachi", "Merin’s mother"], ["His parents", "Merin Mathew", "Mother"], ["His parents", "George Mathew", "Father"], ["His godparents", "Jessy Joseph", "Godmother"], ["His godparents", "Jacob Philip", "Godfather"]],
    copy: { people: ["His roots", "Four generations"], message: ["First, a letter"], events: ["Sunday 18 April", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "canon-in-d-major",
    thanks: "Thank you for coming to this old church and this old house. It was full of the people he comes from.\n\nMerin, George & Isaac",
    wishes: [["Achamma", "Great-grandmother", "I have held your father, your grandfather and now you. God is good."], ["Fr. Mathew", "Family priest", "The fourth generation. Welcome, Isaac."]],
  },
  "church-of-light": {
    full: "Elena Rose Fernandes", role: "Our daughter", age: "4 months", born: "3 January 2027",
    subtitle: "a candle for Elena", invited: "You are invited to the baptism of", hosts: "Sharon & Neil Fernandes",
    start: "18:00", end: "19:15", service: "Evening Mass and baptism", serviceNote: "The baptism takes place at the 6 pm Sunday Mass. Please arrive by 5:45.",
    address: "Church of Our Lady of Lights, Hill Road, Bandra West, Mumbai 400050", lat: 19.0551, lng: 72.8296, parking: "No parking at the church; please use the nearby public lot on Hill Road.", road: "Ten minutes on foot from Bandra station.",
    after: { name: "Dinner at the parish hall", start: "19:30", end: "21:30", description: "A buffet dinner in the hall behind the church." },
    ceremonies: [["The procession", "6:00 pm", "Elena is welcomed at the door and carried in with her parents and godparents.", "none"], ["The readings and prayers", "6:10 pm", "We listen to the readings and say the prayers of the faithful for her.", "flame"], ["The water and the oil", "6:25 pm", "Water is poured over her head, and she is anointed with the oil of Chrism.", "flower"], ["The white garment and the candle", "6:40 pm", "Elena is clothed in white and her candle is lit from the Easter candle.", "lamp"]],
    about: { eyebrow: "An evening in the church", title: "Elena", body: "The church has been the heart of our family for three generations; its windows have lit every Sunday of our lives.\n\nOn Sunday evening, as the light turns amber in the glass, we will give Elena her first light.", facts: [["6 pm", "Evening Mass"], ["6:25", "The baptism"], ["7:30", "Dinner in the hall"]] },
    people: [["Her parents", "Sharon Fernandes", "Mother"], ["Her parents", "Neil Fernandes", "Father"], ["Her godparents", "Lynette D’Mello", "Godmother"], ["Her godparents", "Clinton Rodrigues", "Godfather"], ["Her grandparents", "Peter & Rosy Fernandes", "Grandpa and Grandma"], ["Her grandparents", "Anthony & Lucy Pinto", "Grandpa and Grandma"]],
    message: { title: "A word from her parents", body: "Light the candle, and the church will take care of the rest.", from: "Sharon & Neil", role: "Elena’s parents" },
    copy: { ceremonies: ["The order of service", "What will happen"], people: ["Standing with her", "Her family"], events: ["Sunday 2 May", "The evening"], message: ["A word"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "ascending-the-vale",
    thanks: "Thank you for sharing the light with us. We will keep the candle.\n\nSharon, Neil & Elena",
    wishes: [["Fr. Anthony D’Silva", "Parish priest", "Welcome to the family, Elena. The church is glad of you."], ["Melissa Dias", "Cousin", "I will be the one in the front row with a handkerchief."]],
  },
  "white-dove-blessing": {
    full: "Gabriel Joseph Pereira", role: "Our son", age: "5 months", born: "10 December 2026",
    subtitle: "the Spirit comes like a dove", invited: "With peace in our hearts, we invite you to the baptism of", hosts: "Maria & Anthony Pereira",
    start: "10:30", end: "11:45", service: "Sunday Mass and baptism", serviceNote: "The baptism is celebrated within the 10:30 Mass.",
    address: "Church of the Holy Spirit, Church Square, Panaji, Goa 403001", lat: 15.4909, lng: 73.8278, parking: "Public parking at Church Square.", road: "Five minutes from the Panaji bus stand.",
    after: { name: "Lunch at the house", start: "12:30", end: "15:00", description: "Lunch with sorpotel, sannas and bebinca, at the family house.", hall: { name: "Casa Pereira", address: "Altinho, Panaji, Goa 403001", lat: 15.4989, lng: 73.8312 } },
    about: { eyebrow: "A message of peace", title: "Gabriel", body: "His name means ‘strength of God’, and he arrived in the quietest week of the year.\n\nWe are asking everyone who loves us to come and wish him peace.", facts: [["10:30", "Sunday Mass and baptism"], ["12:30", "Lunch at Casa Pereira"], ["5 months", "Gabriel’s age on the day"]] },
    message: { title: "From his godmother", body: "Gabriel — when you read this, you will probably be too big for me to carry. I will carry you anyway, in prayer, for as long as I can.", from: "Sunita Gomes", role: "Gabriel’s godmother" },
    people: [["His parents", "Maria Pereira", "Mother"], ["His parents", "Anthony Pereira", "Father"], ["His godparents", "Sunita Gomes", "Godmother"], ["His godparents", "Rui Fernandes", "Godfather"], ["His grandparents", "Joaquim & Filomena Pereira", "Avô and Avó"]],
    copy: { people: ["Around him", "His family and godparents"], events: ["Sunday 16 May", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "skye-cuillin",
    thanks: "Thank you for the peace you brought with you. We will tell Gabriel who came.\n\nMaria, Anthony & Gabriel",
    wishes: [["Fr. Ignatius", "Parish priest", "Welcome to the Church, Gabriel."], ["Flavia Lobo", "Family friend", "Peace be with him, now and always."]],
  },
  "the-open-bible": {
    full: "Daniel Abraham Cherian", role: "Our son", age: "7 months", born: "28 October 2026",
    subtitle: "a verse for Daniel", invited: "You are invited to the baptism of", hosts: "Sheela & Suresh Cherian",
    start: "10:00", end: "12:00", service: "Sunday service and baptism", serviceNote: "The baptism follows the sermon. His godparents will read the passage we chose for Daniel before he is baptised.",
    address: "Grace Community Church, Tarnaka, Secunderabad 500017", lat: 17.4399, lng: 78.4983, parking: "The church compound and the school ground next door.", road: "Ten minutes from Tarnaka metro station.",
    after: { name: "Fellowship lunch", start: "12:15", end: "14:00", description: "Lunch in the hall, with the whole church." },
    about: { eyebrow: "A verse for Daniel", title: "Daniel", body: "We chose his name from the book of Daniel, and his verse before he was born: a lamp for his feet and a light for his path.\n\nOn Sunday, in front of the church, we will promise to teach him to read it for himself. Please come and listen.", facts: [["7", "Months old"], ["10 am", "The service"], ["12:15", "Lunch together"]] },
    ceremonies: [["The reading", "10:30 am", "The passage we chose for Daniel is read aloud.", "flame"], ["The promises", "10:40 am", "Sheela and Suresh, with his godparents, promise to bring him up in the faith.", "none"], ["The baptism", "10:50 am", "He is baptised in the name of the Father, the Son and the Holy Spirit.", "bowl"], ["The welcome", "11:10 am", "The church welcomes him, and prays for him.", "lamp"]],
    people: [["His parents", "Sheela Cherian", "Mother"], ["His parents", "Suresh Cherian", "Father"], ["His grandparents", "Thatha and Paati", "Suresh’s parents"], ["His church", "Pastor Joel", "His pastor"], ["His church", "Sunday-school teacher", "Mrs. Annie Thomas"]],
    message: { title: "From his mother", body: "We read him this verse every night. He has not understood a word of it yet, which is exactly why we are inviting you.", from: "Sheela", role: "Daniel’s mother" },
    copy: { people: ["Who stands with him", "His family and church"], prayer: ["His chosen passage"], ceremonies: ["The service", "What will happen"], events: ["Sunday 30 May", "The morning"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "gymnopedie-1",
    thanks: "Thank you for coming to hear Daniel’s verse read. We will read it to him again tonight.\n\nSheela & Suresh",
    wishes: [["Pastor Joel", "Pastor", "Daniel, may you grow to love this book as your parents do."], ["Paati", "Grandmother", "I have prayed for this day since the day you were born."]],
  },
  "floral-grace": {
    full: "Liya Maria Chacko", role: "Our daughter", age: "6 months", born: "9 December 2026",
    subtitle: "a lily for Liya", invited: "You are invited to the baptism of", hosts: "Tina & Jomon Chacko",
    start: "10:00", end: "11:15", service: "Holy Qurbana and baptism", serviceNote: "The baptism takes place at the 10 o’clock Sunday Holy Qurbana.",
    address: "St. Mary’s Chapel, Banerji Road, Ernakulam, Kochi 682018", lat: 9.9816, lng: 76.2999, parking: "A small parking area beside the chapel; extra parking at the nearby school.", road: "Eight minutes from Ernakulam South station.",
    after: { name: "Lunch in the garden", start: "11:30", end: "13:30", description: "Lunch served in the chapel garden." },
    about: { eyebrow: "A lily for Liya", title: "Liya", body: "Her name is a kind of lily, and her grandmother grows them. On Sunday morning the chapel will smell of white flowers.\n\nWe would be so glad to see you there.", facts: [["10 am", "Holy Qurbana and baptism"], ["11:30", "Lunch in the garden"], ["6 months", "Liya’s age on the day"]] },
    people: [["Her parents", "Tina Chacko", "Mother"], ["Her parents", "Jomon Chacko", "Father"], ["Her grandparents", "Chacko & Mercy Mathew", "Appachan and Ammachi"], ["Her grandparents", "Varghese & Lissy Joseph", "Appachan and Ammachi"], ["Her godparents", "Tessy Antony", "Godmother"], ["Her godparents", "Binoy Jose", "Godfather"]],
    copy: { people: ["Her little garden", "The people who love her"], events: ["Sunday 13 June", "The morning"] },
    music: "cottages", dress: "White, ivory, or soft green: the flowers will do the rest.",
    thanks: "Thank you for filling the chapel with white and green. Liya has already started on her thank-you cards.\n\nTina, Jomon & Liya",
    wishes: [["Ammachi", "Grandmother", "The lilies will be in bloom, as they were the week you were born."], ["Fr. Joseph Antony", "Parish priest", "Welcome, Liya."]],
  },
  "golden-morning": {
    full: "Ethan Christopher George", role: "Our son", age: "7 months", born: "28 November 2026",
    subtitle: "good morning, Ethan", invited: "Join us at sunrise for the baptism of", hosts: "Merlin & Christopher George",
    start: "07:00", end: "08:30", service: "Sunrise service and baptism", serviceNote: "The service begins at 7:00, as the sun comes over the ridge. Bring a shawl: it is cool in the hills.",
    address: "Hillview Chapel, Top Station Road, Munnar 685612", lat: 10.0889, lng: 77.0595, parking: "Parking at the tea estate gate, a five-minute walk.", road: "Twenty-five minutes from Munnar town; the chapel is signposted.",
    after: { name: "Breakfast", start: "08:45", end: "10:30", description: "Appam and stew, tea and fruit, on the chapel lawn." },
    about: { eyebrow: "A new day", title: "Ethan", body: "We chose the hills, and we chose the morning. The chapel faces east, and at seven the sun comes in through the open door.\n\nIt is a very early start, and we will make it worth the cold.", facts: [["7:00", "Sunrise service"], ["7:30", "The baptism"], ["8:45", "Breakfast on the lawn"]] },
    message: { title: "A note about the morning", body: "It is a long drive up the hill, so we have arranged a simple breakfast. If you would like to stay overnight in Munnar, we have reserved a few rooms. Just tell us on the form.", from: "Merlin & Christopher", role: "Ethan’s parents" },
    people: [["His parents", "Merlin George", "Mother"], ["His parents", "Christopher George", "Father"], ["His godparents", "Leena Philip", "Godmother"], ["His godparents", "Santhosh Mathew", "Godfather"], ["His grandparents", "George & Annie Thomas", "Grandpa and Grandma"]],
    copy: { events: ["Sunday 27 June", "The morning"], people: ["With him", "Family and godparents"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "morning",
    thanks: "Thank you for getting up in the dark. It was worth it.\n\nMerlin, Christopher & Ethan",
    wishes: [["Rev. Thomas John", "Pastor", "May every morning of your life be as bright as this one."], ["Sara Mathew", "Cousin", "I am bringing the biggest flask of tea you have ever seen."]],
  },
  "jesus-and-the-little-child": {
    full: "Immanuel David Paul", role: "Our son", age: "6 months", born: "5 January 2027",
    subtitle: "let the little children come", invited: "You are invited to the baptism of", hosts: "Divya & Abin Paul",
    start: "09:30", end: "11:00", service: "Holy Qurbana and baptism", serviceNote: "The baptism takes place during the 9:30 Sunday Holy Qurbana. Children are always welcome.",
    address: "Holy Cross Church, Round South, Thrissur 680001", lat: 10.5276, lng: 76.2144, parking: "Parking in the church compound.", road: "Ten minutes from Thrissur railway station.",
    after: { name: "Lunch together", start: "11:15", end: "13:30", description: "Lunch in the church hall, with the Sunday-school children." },
    about: { eyebrow: "Let the children come", title: "Immanuel", body: "His name means ‘God with us’. Every Sunday our church sings to the children before the priest speaks, and every one of them is called to the front.\n\nOn Sunday, it is Immanuel’s turn.", facts: [["9:30", "Holy Qurbana and baptism"], ["11:15", "Lunch together"], ["6 months", "Immanuel’s age on the day"]] },
    ceremonies: [["Called by name", "9:50 am", "The priest asks Immanuel’s name, and his parents and godparents answer for him.", "none"], ["The water", "10:00 am", "He is baptised with water in the name of the Father, the Son and the Holy Spirit.", "bowl"], ["The blessing", "10:10 am", "The priest lays his hands on Immanuel’s head and blesses him.", "flower"]],
    people: [["His parents", "Divya Paul", "Mother"], ["His parents", "Abin Paul", "Father"], ["His godparents", "Anju Johnson", "Godmother"], ["His godparents", "Ruben George", "Godfather"], ["His grandparents", "Paul & Elsy Chacko", "Appachan and Ammachi"]],
    copy: { people: ["Who brings him", "His family"], ceremonies: ["The service", "What will happen"], events: ["Sunday 11 July", "The morning"] },
    music: "eternal-hope",
    thanks: "Thank you for bringing him. The children’s choir has asked if you will come again.\n\nDivya, Abin & Immanuel",
    wishes: [["Sr. Teresa", "Sunday-school teacher", "Let the little children come to me."], ["Jenny Joseph", "Friend", "A big day for such a small person."]],
  },
  "garden-of-blessings": {
    full: "Naomi Ann Kuruvilla", role: "Our daughter", age: "5 months", born: "21 February 2027",
    subtitle: "a garden of blessings", invited: "Come into the garden for the baptism of", hosts: "Anila & Kuruvilla Mathew",
    start: "10:00", end: "11:15", service: "Holy Mass and baptism", serviceNote: "The baptism takes place within the 10 o’clock Sunday Mass.",
    address: "St. Joseph’s Church, Palayam, Kozhikode 673002", lat: 11.2588, lng: 75.7804, parking: "The church ground and the parish house lawn.", road: "Fifteen minutes from Kozhikode railway station.",
    after: { name: "Lunch on the lawn", start: "11:30", end: "14:00", description: "A long lunch under the trees on the parish-house lawn.", hall: { name: "The Parish House lawn", address: "Palayam, Kozhikode 673002", lat: 11.2599, lng: 75.7821 } },
    about: { eyebrow: "A garden journal", title: "Naomi", body: "We have a small garden at the back of the house, and a smaller one growing inside it.\n\nIn her name we planted a jasmine the week she was born. It is blooming now, in time for Sunday.", facts: [["10 am", "Holy Mass and baptism"], ["11:30", "Lunch on the lawn"], ["5 months", "Naomi’s age on the day"]] },
    people: [["Her parents", "Anila Mathew", "Mother"], ["Her parents", "Kuruvilla Mathew", "Father"], ["Her godparents", "Mini Joseph", "Godmother"], ["Her godparents", "Shaji Antony", "Godfather"], ["Her grandparents", "K. C. & Mary Mathew", "Appachan and Ammachi"]],
    copy: { people: ["Planted with care", "Who is tending her"], events: ["Sunday 25 July", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], dress: "Spring colours: leaf green, butter yellow, soft pink. We will be on the grass.", palette: [["#A8C686", "New grass"], ["#F1E7B6", "Butter yellow"], ["#F2C9CF", "Soft pink"]],
    music: "farm",
    thanks: "Thank you for helping us plant her. We will keep sending you photographs of the jasmine.\n\nAnila, Kuruvilla & Naomi",
    wishes: [["Ammachi", "Grandmother", "A garden is a long prayer. May yours be long."], ["Fr. Antony", "Parish priest", "Welcome, little Naomi."]],
  },
  "royal-catholic-elegance": {
    full: "Sebastian Xavier D’Souza", role: "Our son", age: "6 months", born: "16 February 2027",
    subtitle: "to the glory of God", invited: "The families D’Souza and Menezes request the honour of your presence at the baptism of", hosts: "Flavia & Clifford D’Souza",
    start: "11:00", end: "12:30", service: "Solemn Mass and baptism", serviceNote: "A solemn Mass celebrated by the Rector. The baptism is administered after the Gospel.",
    address: "Cathedral of the Holy Name, Kodialbail, Mangaluru 575003", lat: 12.8698, lng: 74.8423, parking: "Reserved parking is arranged for guests of the family; please show the card at the gate.", road: "Fifteen minutes from the airport by taxi.",
    after: { name: "Luncheon", start: "13:00", end: "16:00", description: "A formal luncheon, with seating cards, in the ballroom of the Taj Residency.", hall: { name: "The Residency Ballroom", address: "Hampankatta, Mangaluru 575001", lat: 12.8713, lng: 74.8412 } },
    about: { eyebrow: "A solemn occasion", title: "Sebastian Xavier", body: "The families D’Souza and Menezes announce, with deep gratitude to Almighty God, the baptism of their son and grandson.\n\nThe Mass will be celebrated by the Rector of the Cathedral, and a luncheon will follow.", facts: [["11 am", "Solemn Mass"], ["1 pm", "Luncheon at the Residency"], ["Formal", "Dress code"]] },
    ceremonies: [["The sacrament of baptism", "11:40 am", "In the name of the Father, and of the Son, and of the Holy Spirit. The water is blessed, and Sebastian is baptised.", "none"], ["The anointing", "11:50 am", "He is anointed with the oil of Chrism, a sign that he belongs to Christ.", "flower"], ["The white garment", "11:55 am", "He is clothed in white, and his godfather lights his candle.", "lamp"]],
    people: [["His parents", "Flavia D’Souza", "Mother"], ["His parents", "Clifford D’Souza", "Father"], ["His grandparents", "Dr. Cyril & Mrs. Veronica D’Souza", "Paternal"], ["His grandparents", "Mr. Alwyn & Mrs. Celine Menezes", "Maternal"], ["His godparents", "Mr. Vincent D’Souza", "Godfather"], ["His godparents", "Mrs. Priscilla Rodrigues", "Godmother"]],
    copy: { people: ["The families", "Those present"], ceremonies: ["The sacrament", "The order of service"], events: ["Sunday 8 August", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], dress: "Formal. Suits and dark saris or gowns; we ask that shoulders are covered inside the Cathedral.", palette: [["#1B2A49", "Navy"], ["#7B1E2E", "Burgundy"], ["#F3EBDD", "Ivory"]],
    music: "canon-in-d-major",
    thanks: "We are most grateful for your presence, and ask for your continued prayers.\n\nFlavia & Clifford D’Souza",
    wishes: [["Rt. Rev. Bishop Peter", "His Lordship", "May the Lord bless and keep him."], ["Mrs. Rosario Lobo", "Family friend", "A most blessed occasion."]],
  },
  "modern-minimal-grace": {
    full: "Noah Philip Thomas", role: "Our son", age: "8 months", born: "2 December 2026",
    subtitle: "baptism", invited: "The baptism of", hosts: "Ashna & Rohit Thomas",
    start: "10:00", end: "11:00", service: "Baptism", serviceNote: "The baptism takes place during the 10 o’clock Sunday service.",
    address: "St. Luke’s Church, Lodhi Road, New Delhi 110003", lat: 28.5893, lng: 77.2273, parking: "Parking available in the compound.", road: "Seven minutes from Jor Bagh metro station.",
    after: { name: "Brunch", start: "11:15", end: "13:00", description: "Brunch in the church garden." },
    about: { eyebrow: "01", title: "Noah", body: "Eight months old. Baptised at ten on Sunday morning.\n\nBrunch follows in the garden.", facts: [["10:00", "Sunday service"], ["11:15", "Brunch"], ["8 months", "Noah’s age on the day"]] },
    people: [["Parents", "Ashna Thomas", "Mother"], ["Parents", "Rohit Thomas", "Father"], ["Godparents", "Tara George", "Godmother"], ["Godparents", "Vikram Philip", "Godfather"]],
    copy: { people: ["02", "Family"], events: ["03", "The day"] },
    music: "prelude-in-c",
    thanks: "Thank you for coming.\n\nAshna, Rohit & Noah",
    wishes: [["Deepak Mathew", "Friend", "Welcome, Noah."], ["Anita George", "Aunt", "A very good morning’s work."]],
  },
  "the-little-blessing": {
    full: "Ivy Joseph", role: "Our daughter", age: "7 weeks", born: "18 July 2027",
    subtitle: "a small blessing", invited: "You are invited to a small blessing for", hosts: "Mini & Joseph Chacko",
    start: "16:00", end: "16:45", service: "A small baptism", serviceNote: "A short service for family and a few close friends. There is room for about twenty.",
    address: "Chapel of the Holy Child, Pattom, Thiruvananthapuram 695004", lat: 8.5241, lng: 76.9366, parking: "Room for a few cars beside the chapel; please share a ride if you can.", road: "Five minutes from Pattom junction.",
    after: { name: "Tea at the house", start: "17:15", end: "18:30", description: "Tea, a little cake and a quiet hour at home." },
    about: { eyebrow: "A small blessing", title: "Ivy", body: "Ivy is seven weeks old, and we would like to keep this small.\n\nAbout twenty of us, in a chapel that holds exactly that many, on a Sunday afternoon.", facts: [["4 pm", "In the chapel"], ["20", "Of us"], ["5:15", "Tea at the house"]] },
    people: [["Her parents", "Mini Chacko", "Mother"], ["Her parents", "Joseph Chacko", "Father"], ["Her godparents", "Ruth & Alex Mathew", "Godparents"]],
    copy: { events: ["Sunday 5 September", "The afternoon"], people: ["With her", "Her family"] },
    music: "reawakening",
    thanks: "Thank you for keeping it small, and for keeping it quiet.\n\nMini, Joseph & Ivy",
    wishes: [["Aunty Sheela", "Aunt", "A quiet blessing is the best kind."], ["Fr. Mathew", "Priest", "The chapel will be glad of her."]],
  },
  "family-in-faith": {
    full: "Josiah Peter", role: "My son", age: "9 months", born: "10 December 2026",
    subtitle: "a family in faith", invited: "My family and I invite you to the baptism of", hosts: "Rebecca Peter",
    start: "10:30", end: "12:00", service: "Sunday worship and baptism", serviceNote: "The baptism is part of the 10:30 service. Josiah will be baptised by Pastor Michael.",
    address: "Church of the Good Shepherd, Park Street, Kolkata 700016", lat: 22.5726, lng: 88.3639, parking: "Park Street car park, five minutes’ walk.", road: "Ten minutes from Park Street metro station.",
    after: { name: "Lunch together", start: "12:15", end: "14:30", description: "Lunch in the church hall. Bring your children!" },
    about: { eyebrow: "A family, as it is", title: "Josiah", body: "Josiah’s family is not the family on the greeting card. It is his mother, his grandparents, his uncle and his two godparents — and the congregation who helped.\n\nEvery one of them will be at the font.", facts: [["10:30", "Sunday worship"], ["12:15", "Lunch together"], ["9 months", "Josiah’s age on the day"]] },
    people: [["His mother", "Rebecca Peter", "Mother"], ["His grandparents", "Peter & Lydia Thomas", "Grandpa and Grandma", "Who raised me"], ["His uncle", "Samuel Thomas", "Mama", "Rebecca’s brother"], ["His godparents", "Dr. Anita Roy", "Godmother"], ["His godparents", "Joel Mathew", "Godfather"], ["His church", "Pastor Michael", "His pastor"]],
    message: { title: "From Rebecca", body: "I could not have done this without my parents, my brother, and a church that kept turning up. Josiah has more people than anyone I know. Please come and be one of them.", from: "Rebecca", role: "Josiah’s mother" },
    copy: { people: ["Everyone who holds him", "His family, in our words"], events: ["Sunday 19 September", "The day"], message: ["A few words"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "almost-bliss",
    thanks: "Thank you for being family to us. Josiah will learn your names.\n\nRebecca & Josiah",
    wishes: [["Pastor Michael", "Pastor", "He is held by many hands."], ["Neha Das", "Friend", "I will bring the biggest bag of toys."]],
  },
  "celestial-promise": {
    full: "Eden Abigail Kumar", role: "Our daughter", age: "4 months", born: "6 June 2027",
    subtitle: "a promise kept", invited: "Under an evening sky, we invite you to the baptism of", hosts: "Grace & Joel Kumar",
    start: "17:30", end: "18:45", service: "Evening service and baptism", serviceNote: "The service begins at 5:30; the baptism is at sunset.",
    address: "CSI All Saints Church, Race Course Road, Coimbatore 641018", lat: 11.0168, lng: 76.9558, parking: "The church compound and Race Course Road.", road: "Fifteen minutes from Coimbatore Junction.",
    after: { name: "Dinner in the hall", start: "19:00", end: "21:00", description: "Dinner under the lights in the church hall." },
    about: { eyebrow: "A promise", title: "Eden", body: "We were told, a long time ago, that we might not have children.\n\nOn Sunday evening, we will thank God for keeping his promise.", facts: [["5:30 pm", "The service"], ["6:15", "The baptism, at sunset"], ["7 pm", "Dinner"]] },
    people: [["Her parents", "Grace Kumar", "Mother"], ["Her parents", "Joel Kumar", "Father"], ["Her godparents", "Esther Paul", "Godmother"], ["Her godparents", "Samuel Joseph", "Godfather"], ["Her grandparents", "Kumar & Jessie Daniel", "Thatha and Paati"]],
    message: { title: "From her parents", body: "She is the promise. We just held her.", from: "Grace & Joel", role: "Eden’s parents" },
    copy: { events: ["Sunday 3 October", "The evening"], people: ["Around her", "Her family"], message: ["A few words"] },
    music: "frozen-star",
    thanks: "Thank you for coming to see the promise. We will tell Eden, when she is old enough to understand.\n\nGrace, Joel & Eden",
    wishes: [["Rev. Daniel", "Pastor", "God keeps his promises."], ["Martha Rajan", "Friend", "I cried all through the service."]],
  },
  "a-new-beginning": {
    full: "Elias Abraham Joseph", role: "Our son", age: "5 months", born: "8 May 2027",
    subtitle: "a new beginning", invited: "We cordially invite you to the baptism of", hosts: "Neethu & Joseph Abraham",
    start: "10:00", end: "11:30", service: "Holy Qurbana and baptism", serviceNote: "The baptism is celebrated during the 10 o’clock Holy Qurbana. The service will be live-streamed for family far away.",
    address: "St. George’s Church, Church Road, Pala 686575", lat: 9.7115, lng: 76.6845, parking: "Parking in the parish ground, with volunteers to guide you.", road: "Fifteen minutes from Pala town; the church faces the main road.",
    after: { name: "Reception", start: "12:00", end: "15:00", description: "A reception luncheon at the Meenachil Hall, a five-minute drive from the church.", hall: { name: "Meenachil Hall", address: "Kottaramattom Road, Pala 686575", lat: 9.7152, lng: 76.6921 } },
    about: { eyebrow: "A new beginning", title: "Elias", body: "Elias was born on a Saturday morning, and the first thing he did was look at the light. We have been looking at it with him ever since.\n\nWe would like to share this morning with everyone who has loved us — near and far.", facts: [["10 am", "Holy Qurbana and baptism"], ["12 noon", "Reception"], ["Live", "Streamed for family far away"]] },
    message: { title: "From his parents", body: "To every one of you who watched this day come — whether you are in the church or on a screen in Dubai, Manchester or Melbourne: thank you. This morning belongs to you as much as to us.", from: "Neethu & Joseph", role: "Elias’s parents" },
    ceremonies: [["The doors of the church", "9:45 am", "Elias is carried in through the main door, where the priest meets him.", "none"], ["The baptism", "10:30 am", "He is baptised with water in the name of the Father, the Son and the Holy Spirit.", "bowl"], ["The anointing", "10:40 am", "The priest anoints him with the holy oil.", "flower"], ["The candle", "10:50 am", "His candle is lit from the church candle and given to his godfather to hold.", "lamp"]],
    people: [["His parents", "Neethu Abraham", "Mother"], ["His parents", "Joseph Abraham", "Father"], ["His grandparents", "Abraham & Lissy Joseph", "Appachan and Ammachi"], ["His grandparents", "Mathai & Elsamma Kurian", "Appachan and Ammachi"], ["His godparents", "Anna Mathew", "Godmother"], ["His godparents", "Thomas Kuruvilla", "Godfather"]],
    copy: { people: ["Everyone who holds him", "His family"], ceremonies: ["The service", "What will happen"], events: ["Sunday 17 October", "The day"], message: ["A few words"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "immersed", dress: "Smart and light. Whites and creams are lovely; we will be in the church.",
    thanks: "Thank you — in the church, in the hall, and on the screen. Elias will hear, many times, who was there.\n\nNeethu, Joseph & Elias",
    wishes: [["Lissy Chacko", "Great-aunt, Dubai", "We watched at 6 in the morning, all together, with tea."], ["Fr. Thomas Joseph", "Parish priest", "A new beginning. God bless Elias."]],
  },
  "candle-of-faith": {
    full: "Caleb Mathew Thomas", role: "Our son", age: "5 months", born: "31 May 2027",
    subtitle: "a light for Caleb", invited: "We invite you to light a candle with us at the baptism of", hosts: "Anu & Mathew Thomas",
    start: "17:00", end: "18:15", service: "Evening service and baptism", serviceNote: "The baptism takes place in the evening service, when the baptismal candle is lit from the Paschal candle. Please be seated by 4:45.",
    address: "St. Andrew’s Church, Richmond Road, Bengaluru 560025", lat: 12.9646, lng: 77.5993, parking: "Parking in the church compound and along Richmond Road.", road: "Ten minutes from Trinity metro station.",
    after: { name: "Tea and cake in the hall", start: "18:30", end: "20:00", description: "Tea, cake and a quiet half hour, with the candles still burning." },
    about: { eyebrow: "A candle for Caleb", title: "Caleb", body: "We lit a candle the night we brought Caleb home, and we have not let it go out since.\n\nOn Sunday evening the church will give him a candle of his own, lit from the one flame that has lit every baptism here. Come and watch it being passed on.", facts: [["5 pm", "Evening service"], ["5:40", "The baptismal candle is lit"], ["6:30", "Tea in the hall"]] },
    ceremonies: [["The Paschal candle", "5:30 pm", "The great candle is lit at the font, and the church stands.", "flame"], ["The baptism", "5:40 pm", "Caleb is baptised in the name of the Father, the Son and the Holy Spirit.", "bowl"], ["His candle", "5:50 pm", "His own candle is lit from the Paschal candle and handed to his godfather to hold.", "lamp"]],
    message: { title: "From his parents", body: "We have been told that the light a child is given at the font is the one he carries out of the church. We would like you there to see it lit.", from: "Anu & Mathew", role: "Caleb’s parents" },
    people: [["His parents", "Anu Thomas", "Mother"], ["His parents", "Mathew Thomas", "Father"], ["His grandparents", "T. K. & Aleyamma Thomas", "Appachan and Ammachi"], ["His grandparents", "P. J. & Rachel Joseph", "Appachan and Ammachi"], ["His godparents", "Sheba Koshy", "Godmother"], ["His godparents", "Joel Varghese", "Godfather"]],
    copy: { people: ["Who holds the light", "His family"], ceremonies: ["The evening", "How the light is passed"], events: ["Sunday 31 October", "The evening"], message: ["A few words"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "prelude-in-c",
    thanks: "Thank you for carrying the light with us. We still have the candle.\n\nAnu, Mathew & Caleb",
    wishes: [["Fr. Samuel George", "Parish priest", "May the light you were given tonight never go out, Caleb."], ["Priya Chandy", "Godmother’s sister", "I will be the one with the matches."]],
  },
  "white-roses": {
    full: "Rebecca Rose Joseph", role: "Our daughter", age: "4 months", born: "14 July 2027",
    subtitle: "a rose for Rebecca", invited: "You are invited to the baptism of", hosts: "Meera & Jacob Joseph",
    start: "10:00", end: "11:15", service: "Holy Mass and baptism", serviceNote: "The baptism is celebrated within the 10 o’clock Sunday Mass.",
    address: "St. Michael’s Church, Church Road, Alappuzha 688001", lat: 9.4981, lng: 76.3388, parking: "Parking on the church ground.", road: "Eight minutes from Alappuzha railway station.",
    after: { name: "Lunch in the garden", start: "11:30", end: "13:30", description: "A long lunch among the roses behind the parish house." },
    about: { eyebrow: "A rose for Rebecca", title: "Rebecca", body: "Her grandmother planted a white rose the day Rebecca was born. It has opened in time for Sunday.\n\nWe would be so glad if you came to the church, and then to the garden, to see them both.", facts: [["10 am", "Holy Mass and baptism"], ["11:30", "Lunch in the garden"], ["4 months", "Rebecca’s age on the day"]] },
    message: { title: "From Ammachi", body: "The rose bush was a cutting from my mother’s garden. It has lived in four gardens, and now it is in bloom for Rebecca.", from: "Thresiamma Pulickal", role: "Rebecca’s grandmother" },
    people: [["Her parents", "Meera Joseph", "Mother"], ["Her parents", "Jacob Joseph", "Father"], ["Her grandparents", "Joseph & Thresiamma Pulickal", "Appachan and Ammachi"], ["Her grandparents", "Mathew & Annie Kalathil", "Appachan and Ammachi"], ["Her godparents", "Reshma Antony", "Godmother"], ["Her godparents", "Vinu Varghese", "Godfather"]],
    copy: { people: ["Gathered round her", "Her family"], events: ["Sunday 14 November", "The day"], message: ["From the garden"] },
    meal: ["Vegetarian", "Non-vegetarian"], dress: "White, ivory or soft green; flowers in the hair are very welcome.", music: "there-is-romance",
    thanks: "Thank you for coming to the garden. The roses are still in bloom, and we have kept you a few.\n\nMeera, Jacob & Rebecca",
    wishes: [["Fr. Antony Lobo", "Parish priest", "Welcome, little Rebecca Rose."], ["Sr. Lilly", "Great-aunt", "I have prayed for her every day since she was a seed."]],
  },
  "little-miracle": {
    full: "Miriam Joy Abraham", role: "Our daughter", age: "11 months", born: "28 December 2026",
    subtitle: "our little miracle", invited: "A miracle, and you are invited to the baptism of", hosts: "Susan & Roy Abraham",
    start: "11:00", end: "12:15", service: "Holy Mass and baptism", serviceNote: "The baptism takes place after the Gospel at the 11 o’clock Sunday Mass.",
    address: "Holy Family Church, Beach Road, Visakhapatnam 530001", lat: 17.7231, lng: 83.3012, parking: "Parking in the church compound and on Beach Road.", road: "Ten minutes from Visakhapatnam station.",
    after: { name: "Lunch in the hall", start: "12:30", end: "15:00", description: "Lunch in the parish hall, with cake for everyone and a small teddy bear for every child." },
    about: { eyebrow: "After a long wait", title: "Miriam", body: "We waited nine years for her, and we prayed on every one of them.\n\nShe is eleven months old, she has just learned to stand, and on Sunday she will be baptised. We call her our little miracle; the priest says that is what every child is.", facts: [["11 am", "Holy Mass and baptism"], ["12:30", "Lunch in the hall"], ["11 months", "Miriam’s age on the day"]] },
    milestones: [["2017", "We began to hope", "The first year of waiting, and the first of many prayers."], ["2025", "The news", "A small, shaking phone call to both grandmothers."], ["December 2026", "Miriam arrived", "In the early morning, to a ward full of nurses singing."], ["November 2027", "Her baptism", "Sunday, with everyone who prayed for her."]],
    people: [["Her parents", "Susan Abraham", "Mother"], ["Her parents", "Roy Abraham", "Father"], ["Her grandparents", "K. V. & Mariamma Abraham", "Appachan and Ammachi"], ["Her grandparents", "Chacko & Leelamma Thomas", "Appachan and Ammachi"], ["Her godparents", "Dr. Nisha Varghese", "Godmother"], ["Her godparents", "Binu Mathew", "Godfather"]],
    copy: { people: ["Everyone who prayed", "Her family"], events: ["Sunday 28 November", "The day"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "simple-duet",
    thanks: "Thank you for praying with us for so long. Miriam has already learned to wave goodbye.\n\nSusan, Roy & Miriam",
    wishes: [["Fr. Joseph Reddy", "Parish priest", "A child is always the Lord’s doing. Welcome, Miriam."], ["Sheela Kurian", "Friend", "We cried when you called. We will cry again on Sunday."]],
  },
  "golden-cross": {
    full: "Matthew Peter D’Cunha", role: "Our son", age: "3 months", born: "12 September 2027",
    subtitle: "signed with the cross", invited: "In the name of the Father, and of the Son, and of the Holy Spirit, we invite you to the baptism of", hosts: "Lynn & Peter D’Cunha",
    start: "09:00", end: "10:15", service: "Holy Mass and baptism", serviceNote: "The child is received at the church door, where the priest traces the cross on his forehead; the baptism follows the homily.",
    address: "Our Lady of Grace Church, Giriz, Vasai 401201", lat: 19.3919, lng: 72.8397, parking: "Parking on the church ground and at the school beside it.", road: "Twenty minutes from Vasai Road station.",
    after: { name: "Breakfast in the hall", start: "10:30", end: "12:30", description: "Breakfast with the family in the parish hall." },
    about: { eyebrow: "The sign of the cross", title: "Matthew", body: "The first thing the Church does for a child is to trace the cross on his forehead; the last thing it will do is the same.\n\nOn Sunday morning, at the door of the church, we will ask for it for Matthew.", facts: [["9 am", "Holy Mass"], ["9:40", "The baptism"], ["10:30", "Breakfast in the hall"]] },
    ceremonies: [["At the door", "9:00 am", "The priest meets Matthew at the church door and traces the sign of the cross on his forehead.", "none"], ["The baptism", "9:40 am", "Water is poured three times, in the name of the Father, the Son and the Holy Spirit.", "bowl"], ["The anointing", "9:50 am", "He is anointed with the oil of Chrism and clothed in white.", "flower"]],
    message: { title: "From his godfather", body: "I will make the sign of the cross over him every night he is in my care. It is the only prayer I know by heart.", from: "Vincent Fernandes", role: "Matthew’s godfather" },
    people: [["His parents", "Lynn D’Cunha", "Mother"], ["His parents", "Peter D’Cunha", "Father"], ["His grandparents", "Joaquim & Maria D’Cunha", "Avô and Avó"], ["His grandparents", "Francis & Rita Rodrigues", "Avô and Avó"], ["His godparents", "Vincent Fernandes", "Godfather"], ["His godparents", "Sheryl Pereira", "Godmother"]],
    copy: { people: ["Gathered round him", "His family and godparents"], ceremonies: ["The sacrament", "How it unfolds"], events: ["Sunday 12 December", "The morning"], message: ["A few words"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "canon-in-d-major",
    thanks: "Thank you for standing with us at the door of the church. We will tell Matthew who was there.\n\nLynn, Peter & Matthew",
    wishes: [["Fr. Anthony Gonsalves", "Parish priest", "In the name of the Father, and of the Son, and of the Holy Spirit. Welcome, Matthew."], ["Marian Dias", "Aunt", "Sunday morning, first row, with a handkerchief."]],
  },
  "cloud-nine": {
    full: "Luke Emmanuel Kharkongor", role: "Our son", age: "6 months", born: "26 June 2027",
    subtitle: "on cloud nine", invited: "With our heads in the clouds and our hearts full, we invite you to the baptism of", hosts: "Daphne & Samuel Kharkongor",
    start: "10:30", end: "11:45", service: "Christmas-week service and baptism", serviceNote: "The baptism is part of the 10:30 Sunday service in Christmas week. Please bring a warm shawl: it is cold in Shillong in December.",
    address: "Holy Spirit Church, Laitumkhrah, Shillong 793003", lat: 25.5788, lng: 91.8933, parking: "Parking at the church and along the main road.", road: "Ten minutes from Police Bazaar.",
    after: { name: "Lunch in the hall", start: "12:00", end: "14:30", description: "A hot lunch in the hall — jadoh, dohneiiong and plenty of tea — for everyone." },
    about: { eyebrow: "Heads in the clouds", title: "Luke", body: "Luke was born in the monsoon, with the clouds down in the valley and our whole house shining.\n\nWe are baptising him in Christmas week, in a church the clouds sit over. Come early; the view is part of the prayer.", facts: [["10:30", "Sunday service and baptism"], ["12", "Lunch in the hall"], ["6 months", "Luke’s age on the day"]] },
    people: [["His parents", "Daphne Kharkongor", "Mother"], ["His parents", "Samuel Kharkongor", "Father"], ["His grandparents", "Iban & Phibi Kharkongor", "Kong and Pa"], ["His grandparents", "Dr. Rani Syiem", "Kong"], ["His godparents", "Bah Donbok Lyngdoh", "Godfather"], ["His godparents", "Kong Wanda Nongrum", "Godmother"]],
    copy: { people: ["Beneath the same sky", "His family"], events: ["Sunday 26 December", "The morning"] },
    meal: ["Vegetarian", "Non-vegetarian"], music: "airship-serenity",
    thanks: "Thank you for climbing the hill to be with us. The clouds were kind.\n\nDaphne, Samuel & Luke",
    wishes: [["Rev. Banshan Marbaniang", "Pastor", "Welcome, little Luke. May you always walk above the clouds."], ["Kong Ibaha", "Great-aunt", "I will bring the shawls."]],
  },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2 October 2026" → "2026-10-02" (the document keeps dates as ISO strings). */
function isoOf(s?: string): string {
  const m = s?.match(/^([0-9]{1,2}) ([A-Za-z]+) ([0-9]{4})$/);
  const mo = m ? MONTHS.indexOf(m[2]) : -1;
  return m && mo >= 0 ? `${m[3]}-${String(mo + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}

function plusDays(iso: string, d: number): string {
  const t = new Date(`${iso}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}

function build(slug: string): OccasionCfg {
  const spec = BAPTISM_SPECS.find((s) => s.slug === slug);
  const sample = BAPTISM_SAMPLES[slug];
  const d = DATA[slug];
  if (!spec || !sample || !d) throw new Error(`Baptism sample "${slug}" is incomplete`);
  const verse = verseById(VERSE[slug]);
  if (!verse) throw new Error(`Baptism sample "${slug}" quotes a verse that is not in the verified list`);
  const date = sample.date;
  const churchKey = "church";
  const venues: OccasionCfg["venues"] = [{ key: churchKey, name: sample.church, address: d.address, city: sample.city, lat: d.lat, lng: d.lng, mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sample.church} ${sample.city}`)}`, parking: d.parking, road: d.road }];
  if (d.after?.hall) venues.push({ key: "hall", name: d.after.hall.name, address: d.after.hall.address, city: sample.city, lat: d.after.hall.lat, lng: d.after.hall.lng, mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.after.hall.name} ${sample.city}`)}` });
  const events: OccasionCfg["events"] = [{ name: d.service, date, start: d.start, end: d.end, venue: churchKey, description: d.serviceNote, dress: d.dress ?? "", colors: [], main: true }];
  if (d.after) events.push({ name: d.after.name, date, start: d.after.start, end: d.after.end, venue: d.after.hall ? "hall" : churchKey, description: d.after.description, dress: "", colors: [] });

  // the baby that opens the template, the picture beside “our little story”, and the family: all stand-ins (baptism/story.ts, photos.ts)
  const st = STORY[slug];
  const needs: OccasionCfg["needs"] = [["hero", st.hero, "COUPLE"], ["story", st.story, "COUPLE"]];
  // pictures made from the prompts (docs/BAPTISM-IMAGES.md) join the sample as they are ingested and win over the stand-in
  const made = (slot: Slot) => (GENERATED[assetIdFor(slug, slot)] ? assetIdFor(slug, slot) : undefined);
  const familyPhoto = (slot: Slot) => made(slot) ?? (slot === "parents" ? st.people?.parents : slot === "grandparents" ? st.people?.grandparents : undefined);
  const slotOf = (group: string): Slot | undefined => (/grand|appachan/i.test(group) ? "grandparents" : /godparent/i.test(group) ? "godparents" : /parent/i.test(group) ? "parents" : undefined);
  const shown = new Set<Slot>();
  const people = d.people.map(([group, name, relation, note]) => {
    const slot = slotOf(group);
    const id = slot && !shown.has(slot) ? familyPhoto(slot) : undefined;
    if (slot && id) { shown.add(slot); needs.push([`people:${slot}`, id, "FAMILY"]); }
    return { group, name, relation, note: note ?? "", photo: slot && id ? `people:${slot}` : undefined };
  });
  const church = made("church") ?? st.church;
  if (church) { needs.push(["church", church, "VENUE"]); venues[0].photo = "church"; }
  const gallery = galleryOf(slug);
  const detail = made("detail");
  if (detail && !gallery.some(([g]) => g === detail)) gallery.push([detail, "A quiet detail of the day"]);

  return {
    slug: spec.demo, title: `${sample.child}’s baptism`, date, template: slug, theme: spec.theme, track: "Ambient", libraryTrack: d.music, eventType: "baptism",
    headline: { title: sample.child, subtitle: d.subtitle, invitation: d.invited, hosts: d.hosts, monogram: sample.child.trim().charAt(0).toUpperCase(), dateLabel: "" },
    honoree: { name: sample.child, fullName: d.full, role: d.role, age: d.age, born: isoOf(d.born) },
    about: { eyebrow: d.about.eyebrow, title: d.about.title, body: d.about.body, highlights: d.about.facts.map(([v, l, n]) => [v, l, n ?? ""] as [string, string, string]) },
    people,
    message: d.message,
    prayer: { title: d.prayerTitle ?? "", text: verseText(verse), source: verseSource(verse) },
    images: { couple: "hero", story: "story" },
    venues, events,
    milestones: d.milestones?.map(([year, title, caption]) => [year, title, caption] as [string, string, string]),
    ceremonies: d.ceremonies?.map(([name, when, description, glyph]) => [name, when, description, glyph] as [string, string, string, Glyph]),
    rsvp: { deadline: plusDays(date, -14), askMeal: !!d.meal, askAccommodation: slug === "golden-morning" || slug === "a-new-beginning", askTransport: false, allowCompanions: true, mealOptions: d.meal, thankYou: `Thank you, {name}. ${sample.child} will be told who came.` },
    chatMessage: "Hi, I’m looking at the “{title}” sample invitation and would like to know more.",
    contacts: [["Sample contact", "Stack Bridge Labs — about this design", "+91 73567 41055"]],
    palette: d.palette ? { colors: d.palette, note: d.dress ?? "" } : undefined,
    opening: { sealText: sample.child.trim().charAt(0).toUpperCase(), invited: d.invited },
    thankYou: { message: d.thanks, signature: d.hosts },
    seo: { title: `${sample.child}’s baptism — Invitation`, description: `A baptism invitation for ${sample.child}, in the “${spec.name}” design. A sample by Invites by Stack Bridge Labs.`, og: "hero" },
    needs,
    gallery,
    wishes: d.wishes,
    extra(doc) {
      const c = d.copy ?? {};
      const set = (t: Parameters<typeof sectionCopy>[1], v?: [string?, string?]) => v && sectionCopy(doc, t, { eyebrow: v[0], title: v[1] });
      set("people", c.people); set("events", c.events); set("gallery", galleryHeading(slug)); sectionCopy(doc, "finale", { intro: finaleBlessing(slug) }); set("ceremonies", c.ceremonies); set("message", c.message); set("prayer", c.prayer); set("venue", c.venue); set("rsvp", c.rsvp);
    },
  };
}

/** The verse each template’s sample quotes — all taken from the verified list, so none of them is paraphrased. */
const VERSE: Record<string, string> = {
  "heavenly-grace": "eph-2-8", "blessing-from-above": "num-6-24", "sacred-waters": "rom-6-4", "kerala-christian-heritage": "ps-127-3", "little-prince-of-grace": "1sam-1-27",
  "little-princess-of-heaven": "ps-139-14", "generations-of-faith": "ps-145-4", "church-of-light": "john-8-12", "white-dove-blessing": "matt-3-16", "the-open-bible": "ps-119-105",
  "floral-grace": "matt-6-28", "golden-morning": "lam-3-22", "jesus-and-the-little-child": "matt-19-14", "garden-of-blessings": "ps-1-3", "royal-catholic-elegance": "matt-28-19",
  "modern-minimal-grace": "isa-43-1", "the-little-blessing": "mark-10-16", "family-in-faith": "josh-24-15", "celestial-promise": "gen-9-13", "a-new-beginning": "2cor-5-17",
  "candle-of-faith": "matt-5-16", "white-roses": "isa-35-1", "little-miracle": "ps-118-23", "golden-cross": "john-3-16", "cloud-nine": "ps-36-5",
};

export const BAPTISM_DEMOS: OccasionCfg[] = BAPTISM_SPECS.map((s) => build(s.slug));
