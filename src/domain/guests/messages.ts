/**
 * The heartfelt message every guest finds in their envelope.
 *
 * Pure and dependency-free, so the server (which writes the message into the guest's page), the client dashboard (a live
 * preview, "write another") and the tests all use the same words. The couple always has the last word: a message they wrote
 * for a guest, or for a relationship, comes first (see guestGreeting in ./service.ts). These are the words used when they
 * have not — written in the couple's voice, warm rather than formal, with no gender assumed for the guest or the couple.
 *
 * Adding a relationship: add a rule to RULES and a row to BANK (EN and ML). Malayalam wording should be read by a native
 * speaker before a new line ships.
 */
export type RelationKind =
  | "elder" | "uncleaunt" | "sibling" | "cousin" | "closefriend" | "friend" | "colleague" | "neighbour" | "mentor" | "family" | "default";

/** Checked in order: the first rule that matches the relationship text wins. */
const RULES: [RelationKind, RegExp][] = [
  ["elder", /grand|ammachi|appachan|appooppan|ammumma|valyammachi|\bnan[ai]\b|\bdad[ai]\b|\b(father|mother|mom|mum|dad|parents?|amma|achan|appa)\b/i],
  ["mentor", /teacher|mentor|professor|guru|principal|coach|\bsir\b|\bmadam\b/i],
  ["uncleaunt", /uncle|aunt|ammavan|ammayi|valiyachan|valyachan|kunjamma|chittappan|chithappan|chithi|maman|mami|chacha|chachi|mausi|\bbua\b|\bmasi\b/i],
  ["sibling", /brother|sister|sibling|chettan|chechi|aniyan|aniyathi|\bbro\b|\bsis\b|bhai|didi/i],
  ["cousin", /cousin/i],
  ["closefriend", /best\s*friend|bestie|\bbff\b|close\s*friend|childhood|school|college|batchmate|classmate/i],
  ["friend", /friend/i],
  ["colleague", /colleague|co-?worker|office|\bwork\b|boss|manager|\bteam\b|professional/i],
  ["neighbour", /neighbou?r/i],
  ["family", /relative|family|in-?law|kin\b/i],
];

export function relationKind(relationship: string, groupKey?: string | null): RelationKind {
  const text = relationship.trim();
  if (text) for (const [kind, re] of RULES) if (re.test(text)) return kind;
  // No relationship written: the guest's group still says something ("friends", "office", "relatives").
  const g = (groupKey ?? "").replace(/-/g, " ");
  if (/family|relatives/.test(g)) return "family";
  if (/friend/.test(g)) return "friend";
  if (/office|colleague/.test(g)) return "colleague";
  return "default";
}

type Bank = Record<RelationKind, { en: string[]; ml: string[] }>;

const BANK: Bank = {
  elder: {
    en: [
      "Every step we take towards this new beginning rests on the blessings you have given us. On the day we begin our life together there is nothing we want more than to see you there, smiling, with your hand raised in blessing.",
      "You taught us what love looks like long before we found each other. Please come and bless us as we start our own story — it will not feel complete until you have.",
      "Your prayers have walked with us all our lives. On our wedding day we are asking for one more gift: your presence, and your blessing over the two of us.",
    ],
    ml: [
      "ഞങ്ങൾ ഇടുന്ന ഓരോ ചുവടും നിങ്ങളുടെ അനുഗ്രഹത്തിന്റെ തണലിലാണ്. ഞങ്ങൾ ഒരുമിച്ചുള്ള ജീവിതം തുടങ്ങുന്ന ഈ ദിവസം നിങ്ങൾ അരികിൽ ഉണ്ടാകണം എന്നതിനേക്കാൾ വലിയൊരാഗ്രഹം ഞങ്ങൾക്കില്ല.",
      "സ്നേഹം എങ്ങനെയാണെന്ന് ഞങ്ങൾ പരസ്പരം കണ്ടെത്തുന്നതിനും മുൻപേ നിങ്ങൾ ഞങ്ങളെ പഠിപ്പിച്ചു. ഞങ്ങളുടെ പുതിയ കഥ തുടങ്ങുമ്പോൾ വന്ന് അനുഗ്രഹിക്കണം — നിങ്ങളില്ലാതെ അത് പൂർണ്ണമാകില്ല.",
      "ജീവിതകാലം മുഴുവൻ നിങ്ങളുടെ പ്രാർത്ഥന ഞങ്ങളോടൊപ്പം ഉണ്ടായിരുന്നു. ഞങ്ങളുടെ വിവാഹദിനത്തിൽ ഒരു സമ്മാനം കൂടി ഞങ്ങൾ ചോദിക്കുന്നു — നിങ്ങളുടെ സാന്നിധ്യവും ഞങ്ങൾ ഇരുവർക്കും മേൽ നിങ്ങളുടെ അനുഗ്രഹവും.",
    ],
  },
  uncleaunt: {
    en: [
      "You have watched us grow up, laughed at our mistakes and cheered every small win. Now we are building a home together, and we want you right there in the front row.",
      "Some of our happiest memories have you in them. Come and be part of the next one — the day we become one.",
      "There is a special kind of love that only a family elder can give: steady, patient, proud. We would be so honoured to have yours with us on our wedding day.",
    ],
    ml: [
      "ഞങ്ങൾ വളരുന്നത് കണ്ടും, ഞങ്ങളുടെ കുസൃതികൾ ചിരിച്ചു ക്ഷമിച്ചും, ഓരോ ചെറിയ വിജയത്തിലും കൂടെ സന്തോഷിച്ചും നിങ്ങൾ ഉണ്ടായിരുന്നു. ഇനി ഞങ്ങൾ ഒരു വീട് പണിയുകയാണ് — ആദ്യ നിരയിൽ തന്നെ നിങ്ങൾ വേണം.",
      "ഞങ്ങളുടെ ഏറ്റവും സന്തോഷമുള്ള ഓർമ്മകളിൽ പലതിലും നിങ്ങളുണ്ട്. അടുത്ത ഓർമ്മയും നിങ്ങളോടൊപ്പം ആകട്ടെ — ഞങ്ങൾ ഒന്നാകുന്ന ദിവസം.",
      "ഒരു മുതിർന്നയാളുടെ സ്നേഹത്തിന് ഒരു പ്രത്യേക സുഖമുണ്ട് — ശാന്തം, ക്ഷമയുള്ളത്, അഭിമാനം നിറഞ്ഞത്. ഞങ്ങളുടെ വിവാഹദിനത്തിൽ ആ സ്നേഹം ഞങ്ങൾക്കൊപ്പം ഉണ്ടായാൽ അതൊരു ഭാഗ്യമാണ്.",
    ],
  },
  sibling: {
    en: [
      "You have been in the story from the very first chapter — the secrets, the squabbles, the laughter that never needed a reason. We cannot imagine this day without you right beside us.",
      "Of all the people who have shaped our lives, few know us the way you do. Come and celebrate with us; the day will mean so much more with you in it.",
      "Brother, sister, partner in crime — whatever name we call you, you are woven into this day. Please be there to see it happen.",
    ],
    ml: [
      "ആദ്യ അധ്യായം മുതൽ ഈ കഥയിൽ നിങ്ങളുണ്ട് — രഹസ്യങ്ങളും പിണക്കങ്ങളും കാരണമില്ലാത്ത ചിരികളും. ഈ ദിവസം നിങ്ങളില്ലാതെ ഞങ്ങൾക്ക് സങ്കൽപ്പിക്കാൻ പോലും കഴിയില്ല.",
      "ഞങ്ങളുടെ ജീവിതം രൂപപ്പെടുത്തിയവരിൽ നിങ്ങളെപ്പോലെ ഞങ്ങളെ അറിയുന്നവർ വളരെ കുറവാണ്. വന്ന് ഞങ്ങളോടൊപ്പം ആഘോഷിക്കൂ — നിങ്ങൾ ഉണ്ടെങ്കിൽ ഈ ദിവസത്തിന് അർത്ഥം കൂടും.",
      "സഹോദരനോ സഹോദരിയോ കൂട്ടുകാരനോ — ഞങ്ങൾ നിങ്ങളെ എന്തു വിളിച്ചാലും, ഈ ദിവസത്തിന്റെ ഭാഗമാണ് നിങ്ങൾ. ദയവായി വന്ന് ഇതിന് സാക്ഷിയാകൂ.",
    ],
  },
  cousin: {
    en: [
      "We grew up on the same stories, the same summers and the same stolen sweets. It would feel strange to begin a new chapter without the person who was there for the old ones. Come and celebrate with us!",
      "Cousins are the friends we were given first. Come and fill our wedding with the laughter we have shared since we were small.",
      "From childhood games to this day, you have been there through it all. Please come and make our wedding feel like home.",
    ],
    ml: [
      "ഒരേ കഥകളും ഒരേ അവധിക്കാലങ്ങളും ഒളിച്ചെടുത്ത മധുരങ്ങളും പങ്കുവെച്ചാണ് ഞങ്ങൾ വളർന്നത്. പഴയ അധ്യായങ്ങളിൽ കൂടെയുണ്ടായിരുന്ന ആളില്ലാതെ പുതിയ അധ്യായം തുടങ്ങുന്നത് വിചിത്രമായിരിക്കും. വന്ന് ഞങ്ങളോടൊപ്പം ആഘോഷിക്കൂ!",
      "ദൈവം ആദ്യം തന്ന കൂട്ടുകാരാണ് കസിൻസ്. കുട്ടിക്കാലം മുതൽ ഞങ്ങൾ പങ്കിട്ട ചിരികൊണ്ട് ഞങ്ങളുടെ വിവാഹം നിറയ്ക്കാൻ വരൂ.",
      "കുട്ടിക്കാലത്തെ കളികൾ മുതൽ ഇന്നുവരെ നിങ്ങൾ കൂടെയുണ്ടായിരുന്നു. ഞങ്ങളുടെ വിവാഹദിനം സ്വന്തം വീട് പോലെ തോന്നിക്കാൻ ദയവായി വരണം.",
    ],
  },
  closefriend: {
    en: [
      "You have seen us at our best and at our worst, and stayed anyway. That is rare, and we are grateful for it. Come and watch us say yes to forever — we could not do it without our people.",
      "Friends like you are the family we chose. We want you at our wedding to laugh with us, dance with us, and be there when we need you most.",
      "Years from now, when we look at the photographs, we want to see you in them — the one who knew us before all of this. Please come.",
    ],
    ml: [
      "ഞങ്ങളുടെ ഏറ്റവും നല്ലതും ഏറ്റവും മോശവുമായ സമയങ്ങൾ കണ്ടിട്ടും നിങ്ങൾ കൂടെ നിന്നു. അത് അപൂർവമാണ്, അതിന് ഞങ്ങൾ നന്ദിയുള്ളവരാണ്. ഞങ്ങൾ എന്നെന്നേക്കുമായി 'അതെ' എന്നു പറയുന്നത് കാണാൻ വരൂ — ഞങ്ങളുടെ ആളുകളില്ലാതെ അതിനു കഴിയില്ല.",
      "നിങ്ങളെപ്പോലുള്ള കൂട്ടുകാർ ഞങ്ങൾ തിരഞ്ഞെടുത്ത കുടുംബമാണ്. ഞങ്ങളോടൊപ്പം ചിരിക്കാനും ആടാനും, ഞങ്ങൾക്ക് ഏറ്റവും വേണ്ടപ്പോൾ കൂടെ നിൽക്കാനും നിങ്ങൾ ഞങ്ങളുടെ വിവാഹത്തിന് ഉണ്ടാകണം.",
      "വർഷങ്ങൾക്കു ശേഷം ഫോട്ടോകൾ നോക്കുമ്പോൾ അതിൽ നിങ്ങളെ കാണണം — ഇതെല്ലാം തുടങ്ങുന്നതിനു മുൻപേ ഞങ്ങളെ അറിയുന്ന ആൾ. ദയവായി വരണം.",
    ],
  },
  friend: {
    en: [
      "Some friendships feel like a home you carry with you, and yours is one of ours. Our wedding would be a little quieter without you, so please come and fill it with your smile.",
      "Of all the people we could share our biggest day with, we hoped you would be there. Come celebrate with us — it means the world.",
      "Thank you for every kind word, every call, every moment you made time for us. Please be there as we begin the next chapter; we would love to share it with you.",
    ],
    ml: [
      "ചില സൗഹൃദങ്ങൾ കൂടെ കൊണ്ടുനടക്കുന്ന ഒരു വീടുപോലെയാണ്. നിങ്ങളുടേത് അതുപോലെയൊന്നാണ്. നിങ്ങളില്ലെങ്കിൽ ഞങ്ങളുടെ വിവാഹം അൽപ്പം നിശ്ശബ്ദമായിപ്പോകും — നിങ്ങളുടെ പുഞ്ചിരിയുമായി വന്ന് അത് നിറയ്ക്കൂ.",
      "ഞങ്ങളുടെ ഏറ്റവും വലിയ ദിവസം പങ്കിടാൻ പലരും ഉണ്ടെങ്കിലും, നിങ്ങൾ വരണം എന്ന് ഞങ്ങൾ ആഗ്രഹിച്ചു. ഞങ്ങളോടൊപ്പം ആഘോഷിക്കൂ — അത് ഞങ്ങൾക്ക് ലോകമാണ്.",
      "ഓരോ നല്ല വാക്കിനും, ഓരോ ഫോൺ വിളിക്കും, ഞങ്ങൾക്കായി സമയം കണ്ടെത്തിയ ഓരോ നിമിഷത്തിനും നന്ദി. ഞങ്ങളുടെ അടുത്ത അധ്യായം തുടങ്ങുമ്പോൾ നിങ്ങളും വേണം — അത് നിങ്ങളോടൊപ്പം പങ്കിടാൻ ഞങ്ങൾ ആഗ്രഹിക്കുന്നു.",
    ],
  },
  colleague: {
    en: [
      "Work brought us together, but it is the kindness behind the work that we remember. We would be truly happy to celebrate this day with you.",
      "Thank you for being part of our everyday — the quiet support, the shared laughter over tea. It would mean a lot to have you with us on our wedding day.",
      "You have made our days brighter in more ways than a job description could ever say. Please join us as we start this new chapter.",
    ],
    ml: [
      "ജോലിയാണ് ഞങ്ങളെ കൂട്ടിയിണക്കിയത്, പക്ഷേ ഓർമ്മയിൽ നിൽക്കുന്നത് അതിന് പിന്നിലെ നിങ്ങളുടെ നന്മയാണ്. ഈ ദിവസം നിങ്ങളോടൊപ്പം ആഘോഷിക്കാൻ കഴിഞ്ഞാൽ ഞങ്ങൾക്ക് ഏറെ സന്തോഷം.",
      "ഞങ്ങളുടെ ദിനങ്ങളുടെ ഭാഗമായതിന്, നിശ്ശബ്ദമായ പിന്തുണയ്ക്കും ചായയ്ക്കൊപ്പമുള്ള ചിരികൾക്കും നന്ദി. വിവാഹദിനത്തിൽ നിങ്ങൾ കൂടെയുണ്ടാകുന്നത് ഞങ്ങൾക്ക് വലിയ കാര്യമാണ്.",
      "ഒരു ജോലി വിവരണത്തിനും പറയാൻ കഴിയാത്തത്ര വിധത്തിൽ നിങ്ങൾ ഞങ്ങളുടെ ദിനങ്ങൾ പ്രകാശമാനമാക്കി. ഈ പുതിയ അധ്യായത്തിൽ ഞങ്ങളോടൊപ്പം ചേരൂ.",
    ],
  },
  neighbour: {
    en: [
      "A good neighbour is the first family we find. You have been that to us — in every festival, every small emergency and every shared cup of tea. Please come and celebrate with us.",
      "Over the years, your door has felt like ours. As we begin a new life we want you to be part of it — come and share the joy with us.",
      "Thank you for the warmth you have given us, season after season. Our wedding will be brighter with you in it.",
    ],
    ml: [
      "നല്ല അയൽക്കാരാണ് നമ്മൾ ആദ്യം കണ്ടെത്തുന്ന കുടുംബം. ഓരോ ഉത്സവത്തിലും, ഓരോ ചെറിയ പ്രതിസന്ധിയിലും, ഒരുമിച്ച് കുടിച്ച ഓരോ ചായയിലും നിങ്ങൾ ഞങ്ങൾക്ക് അങ്ങനെയായിരുന്നു. വന്ന് ഞങ്ങളോടൊപ്പം ആഘോഷിക്കൂ.",
      "വർഷങ്ങളായി നിങ്ങളുടെ വാതിൽ ഞങ്ങളുടേതുപോലെയാണ് തോന്നിയത്. പുതിയ ജീവിതം തുടങ്ങുമ്പോൾ നിങ്ങളും അതിന്റെ ഭാഗമാകണം — വന്ന് സന്തോഷം പങ്കിടൂ.",
      "ഓരോ കാലത്തും നിങ്ങൾ ഞങ്ങൾക്കു തന്ന ഊഷ്മളതയ്ക്ക് നന്ദി. നിങ്ങളുണ്ടെങ്കിൽ ഞങ്ങളുടെ വിവാഹം കൂടുതൽ പ്രകാശമാനമാകും.",
    ],
  },
  mentor: {
    en: [
      "Much of who we are began with something you taught us — a word of encouragement, a lesson that stayed. We would be deeply honoured to have you bless this new chapter of our lives.",
      "You believed in us before we believed in ourselves. Please come and see what that belief has helped us become, and give us your blessing.",
      "Some people change the direction of a life with a few kind words. You did that for us. We would be so grateful to have you with us on our wedding day.",
    ],
    ml: [
      "ഞങ്ങൾ ആരാണോ അതിന്റെ വലിയൊരു ഭാഗം തുടങ്ങിയത് നിങ്ങൾ പഠിപ്പിച്ച ഒന്നിൽ നിന്നാണ് — ഒരു പ്രോത്സാഹന വാക്ക്, മനസ്സിൽ നിന്ന ഒരു പാഠം. ഞങ്ങളുടെ ജീവിതത്തിന്റെ ഈ പുതിയ അധ്യായത്തെ നിങ്ങൾ അനുഗ്രഹിക്കുന്നത് ഞങ്ങൾക്ക് വലിയ ബഹുമതിയായിരിക്കും.",
      "ഞങ്ങൾ ഞങ്ങളെ വിശ്വസിക്കുന്നതിനു മുൻപേ നിങ്ങൾ ഞങ്ങളിൽ വിശ്വസിച്ചു. ആ വിശ്വാസം ഞങ്ങളെ എന്തായി മാറ്റി എന്ന് കാണാൻ, ഞങ്ങളെ അനുഗ്രഹിക്കാൻ ദയവായി വരണം.",
      "ചില ദയയുള്ള വാക്കുകൾ കൊണ്ട് ഒരു ജീവിതത്തിന്റെ ദിശ മാറ്റുന്നവരുണ്ട്. നിങ്ങൾ ഞങ്ങൾക്കായി അത് ചെയ്തു. ഞങ്ങളുടെ വിവാഹദിനത്തിൽ നിങ്ങൾ ഉണ്ടായാൽ ഞങ്ങൾ എന്നും നന്ദിയുള്ളവരായിരിക്കും.",
    ],
  },
  family: {
    en: [
      "You are part of the circle that holds us — the one we come back to at every celebration. We want you with us as two families become one.",
      "Family is where our love story really began: in the blessings, the advice and the endless food. Please come and be part of the day our two families come together.",
      "Whatever the occasion, a house is warmer when you are in it. Please come and make our wedding day warm with your presence.",
    ],
    ml: [
      "ഞങ്ങളെ ചേർത്തുപിടിക്കുന്ന വലയത്തിലെ ഒരാളാണ് നിങ്ങൾ — ഓരോ ആഘോഷത്തിലും ഞങ്ങൾ തിരിച്ചെത്തുന്നിടം. രണ്ടു കുടുംബങ്ങൾ ഒന്നാകുന്ന ഈ ദിവസം നിങ്ങൾ ഞങ്ങളോടൊപ്പം വേണം.",
      "ഞങ്ങളുടെ പ്രണയകഥ ശരിക്കും തുടങ്ങിയത് കുടുംബത്തിലാണ് — അനുഗ്രഹങ്ങളിലും ഉപദേശങ്ങളിലും തീരാത്ത സദ്യകളിലും. രണ്ടു കുടുംബങ്ങൾ ഒന്നിക്കുന്ന ദിവസത്തിൽ പങ്കുചേരാൻ ദയവായി വരണം.",
      "ഏതു വിശേഷത്തിനും നിങ്ങൾ ഉള്ള വീടിന് ഒരു പ്രത്യേക ഊഷ്മളതയാണ്. ഞങ്ങളുടെ വിവാഹദിനവും നിങ്ങളുടെ സാന്നിധ്യം കൊണ്ട് ഊഷ്മളമാക്കാൻ വരൂ.",
    ],
  },
  default: {
    en: [
      "Some people make a day feel complete just by being there, and you are one of them. Our wedding would not be the same without you beside us, so we are saving a place for you — in the room and in our hearts.",
      "Out of everyone we could have asked, we thought of you first. Come and be part of the happiest day of our lives; your smile will be one of the memories we keep forever.",
      "Every love story is written with the help of the people who stood by it. You have been part of ours, and we cannot imagine celebrating without you.",
    ],
    ml: [
      "ചിലർ കൂടെയുണ്ടെങ്കിൽ മാത്രം ഒരു ദിവസം പൂർണ്ണമാകും. നിങ്ങൾ അങ്ങനെയൊരാളാണ്. ഞങ്ങളുടെ വിവാഹദിനത്തിൽ നിങ്ങളെ കാത്ത് ഒരിടം ഞങ്ങൾ ഒഴിച്ചിട്ടിരിക്കുന്നു — സദസ്സിലും ഹൃദയത്തിലും.",
      "ആരെയൊക്കെ ക്ഷണിക്കണം എന്ന് ആലോചിച്ചപ്പോൾ ആദ്യം ഓർത്തത് നിങ്ങളെയാണ്. ഞങ്ങളുടെ ജീവിതത്തിലെ ഏറ്റവും സന്തോഷമുള്ള ദിവസത്തിൽ നിങ്ങളും വേണം.",
      "ഞങ്ങളുടെ പ്രണയകഥയിൽ കൂടെ നിന്ന ചിലരുണ്ട്. അതിൽ ഒരാളാണ് നിങ്ങൾ. ആ സന്തോഷം നിങ്ങളില്ലാതെ ആഘോഷിക്കാൻ ഞങ്ങൾക്ക് കഴിയില്ല.",
    ],
  },
};

const lang = (locale: string): "en" | "ml" => (locale.toLowerCase().startsWith("ml") ? "ml" : "en");

/** A small stable hash, so the same guest always reads the same message but two neighbours on the list do not. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const variantCount = (kind: RelationKind, locale: string) => BANK[kind][lang(locale)].length;

const fill = (s: string, v: { first?: string; a: string; b: string }) =>
  s.replace(/\{first\}/g, v.first ?? "").replace(/\{a\}/g, v.a).replace(/\{b\}/g, v.b).replace(/\{couple\}/g, v.b ? `${v.a} & ${v.b}` : v.a);

/**
 * The message for one guest. `seed` (the guest's id or name) picks the variant; `variant` moves to the next ones
 * ("write another"). The result is plain text: no markup, no placeholders left over.
 */
export function composeMessage(o: { kind: RelationKind; locale: string; a: string; b: string; first?: string; seed: string; variant?: number }): string {
  const list = BANK[o.kind][lang(o.locale)];
  const text = list[(hash(`${o.seed}|${o.kind}`) + (o.variant ?? 0)) % list.length];
  return fill(text, o).replace(/\s{2,}/g, " ").trim();
}

// ── the nudge near the RSVP ─────────────────────────────────────────────────
type Tone = "elder" | "peer" | "formal";
const toneOf = (k: RelationKind): Tone => (k === "elder" || k === "uncleaunt" || k === "mentor" ? "elder" : k === "colleague" || k === "default" || k === "family" ? "formal" : "peer");
const NUDGE: Record<Tone, { en: string; ml: string }> = {
  elder: { en: "We are keeping a seat for you, {first}. Please let us know you are coming — it will make us so happy.", ml: "നിങ്ങൾക്കായി ഒരു ഇരിപ്പിടം ഞങ്ങൾ മാറ്റിവച്ചിട്ടുണ്ട്. വരുമെന്ന് അറിയിക്കണേ — ഞങ്ങൾക്ക് വലിയ സന്തോഷമാകും." },
  peer: { en: "Say yes, {first} — it will not be the same without you!", ml: "വരുമെന്ന് പറയൂ — നിങ്ങളില്ലാതെ അത് പഴയതുപോലെ ആകില്ല!" },
  formal: { en: "We would be so happy to see you there, {first}. Please let us know if you can come.", ml: "നിങ്ങളെ അവിടെ കാണാൻ ഞങ്ങൾക്ക് വലിയ സന്തോഷമാണ്. വരാൻ കഴിയുമോ എന്ന് അറിയിക്കണേ." },
};
export const nudgeLine = (kind: RelationKind, locale: string, first: string) => NUDGE[toneOf(kind)][lang(locale)].replace(/\{first\}/g, first);

// ── a short note for a whole group: the "message reel" played when the couple has not recorded their own ───────
export type GroupNoteKind = "family" | "friends" | "colleagues" | "default";
const NOTES: Record<GroupNoteKind, { en: string[]; ml: string[] }> = {
  family: {
    en: ["To our family,", "you gave us our first home and our first courage.", "Come and bless the day two families become one."],
    ml: ["ഞങ്ങളുടെ കുടുംബത്തിന്,", "ആദ്യത്തെ വീടും ആദ്യത്തെ ധൈര്യവും തന്നത് നിങ്ങളാണ്.", "രണ്ടു കുടുംബങ്ങൾ ഒന്നാകുന്ന ദിവസം വന്ന് അനുഗ്രഹിക്കൂ."],
  },
  friends: {
    en: ["To our friends,", "you were there before the rings, the lights and the music.", "Come and laugh with us again — it will not be the same without you."],
    ml: ["ഞങ്ങളുടെ കൂട്ടുകാർക്ക്,", "മോതിരങ്ങൾക്കും വിളക്കുകൾക്കും സംഗീതത്തിനും മുൻപേ നിങ്ങൾ കൂടെയുണ്ടായിരുന്നു.", "വന്ന് ഞങ്ങളോടൊപ്പം ഒരിക്കൽ കൂടി ചിരിക്കൂ — നിങ്ങളില്ലാതെ അത് പഴയതുപോലെ ആകില്ല."],
  },
  colleagues: {
    en: ["To our colleagues,", "thank you for the shared tea, the long days and the kind words.", "We would love to celebrate this day with you."],
    ml: ["ഞങ്ങളുടെ സഹപ്രവർത്തകർക്ക്,", "പങ്കിട്ട ചായയ്ക്കും നീണ്ട ദിവസങ്ങൾക്കും നല്ല വാക്കുകൾക്കും നന്ദി.", "ഈ ദിവസം നിങ്ങളോടൊപ്പം ആഘോഷിക്കാൻ ഞങ്ങൾ ആഗ്രഹിക്കുന്നു."],
  },
  default: {
    en: ["To everyone we love,", "your blessings, your laughter and your presence are the gifts we wish for most.", "We cannot wait to celebrate with you."],
    ml: ["ഞങ്ങൾ സ്നേഹിക്കുന്ന എല്ലാവർക്കും,", "നിങ്ങളുടെ അനുഗ്രഹവും ചിരിയും സാന്നിധ്യവുമാണ് ഞങ്ങൾ ഏറ്റവും ആഗ്രഹിക്കുന്ന സമ്മാനങ്ങൾ.", "നിങ്ങളോടൊപ്പം ആഘോഷിക്കാൻ ഞങ്ങൾ കാത്തിരിക്കുന്നു."],
  },
};

/** Which kind of group a guest group is, from its key ("bride-family", "friends", "office", a custom "college-gang"…). */
export function groupNoteKind(groupKey: string | null | undefined): GroupNoteKind {
  const kind = relationKind(groupKey ? groupKey.replace(/-/g, " ") : "", groupKey);
  if (kind === "elder" || kind === "uncleaunt" || kind === "sibling" || kind === "cousin" || kind === "family") return "family";
  if (kind === "closefriend" || kind === "friend") return "friends";
  if (kind === "colleague") return "colleagues";
  return "default";
}

export const groupNote = (kind: GroupNoteKind, locale: string): string[] => NOTES[kind][lang(locale)];
