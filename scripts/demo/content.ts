import type { InvitationDoc, LocalizedText } from "../../src/domain/doc/schema";
import { newId } from "../../src/lib/id";
import { PUZZLE_SPOTS } from "./art";

/** Fictional demo couple. Every text has an English and a Malayalam version so the language switch is real. */
const L = (en: string, ml: string): LocalizedText => ({ en, ml });

export interface DemoMedia {
  hero: string; bride: string; groom: string; venue: string;
  gallery: { id: string; caption: LocalizedText; alt: LocalizedText }[];
  story: { cafe: string; corridor: string; train: string; thenA: string; thenB: string };
  puzzleA: string; puzzleB: string; clipA: string; clipB: string; og: string;
  /** Optional slots (filled when real photographs are available). */
  family?: string; storyPhoto?: string;
  milestones?: { umbrella?: string; coffee?: string; train?: string; proposal?: string };
  ceremonies?: { varavelppu?: string; thalikettu?: string; pudava?: string };
}

export const DEMO = {
  slug: "meenakshi-and-aravind",
  title: "Meenakshi & Aravind",
  date: "2027-01-24",
};

export function buildDemoDoc(base: InvitationDoc, m: DemoMedia, opts: { full: boolean }): InvitationDoc {
  const doc = structuredClone(base) as InvitationDoc;

  doc.couple = {
    ...doc.couple,
    bride: {
      name: L("Meenakshi", "മീനാക്ഷി"),
      fullName: L("Meenakshi Nair", "മീനാക്ഷി നായർ"),
      parents: L("Daughter of Mr. Gopalakrishnan Nair & Mrs. Radha Gopalakrishnan, Kottayam", "ശ്രീ ഗോപാലകൃഷ്ണൻ നായരുടെയും ശ്രീമതി രാധ ഗോപാലകൃഷ്ണന്റെയും മകൾ, കോട്ടയം"),
      bio: L("A storyteller with a soft spot for filter coffee, old Malayalam songs and long monsoon walks. She teaches literature — and believes every good day begins with a book and a window.", "ഫിൽട്ടർ കാപ്പിയും പഴയ മലയാള ഗാനങ്ങളും മഴക്കാല നടത്തങ്ങളും ഇഷ്ടപ്പെടുന്ന ഒരു കഥാകാരി. സാഹിത്യം പഠിപ്പിക്കുന്നു — ഒരു പുസ്തകവും ഒരു ജനലും ഉണ്ടെങ്കിൽ ഏത് ദിവസവും നല്ലതാകുമെന്ന് വിശ്വസിക്കുന്നു."),
      photo: m.bride,
    },
    groom: {
      name: L("Aravind", "അരവിന്ദ്"),
      fullName: L("Aravind Menon", "അരവിന്ദ് മേനോൻ"),
      parents: L("Son of Mr. Narayanan Menon & Mrs. Sarala Narayanan, Thrissur", "ശ്രീ നാരായണൻ മേനോന്റെയും ശ്രീമതി സരള നാരായണന്റെയും മകൻ, തൃശ്ശൂർ"),
      bio: L("An architect who sketches on napkins, cooks a fearless sambar and never forgets an anniversary. He designs homes for a living — and has quietly been designing this day for two years.", "നാപ്കിനുകളിൽ വരയ്ക്കുന്ന, ധൈര്യത്തോടെ സാമ്പാർ വയ്ക്കുന്ന, ഒരു വാർഷികവും മറക്കാത്ത ഒരു ആർക്കിടെക്റ്റ്. വീടുകൾ രൂപകൽപ്പന ചെയ്യുന്നു — രണ്ട് വർഷമായി ഈ ദിവസവും നിശ്ശബ്ദമായി രൂപകൽപ്പന ചെയ്യുകയായിരുന്നു."),
      photo: m.groom,
    },
    order: "bride-first",
    tagline: L("Two hearts, one lamp, a lifetime of light.", "രണ്ട് ഹൃദയങ്ങൾ, ഒരു വിളക്ക്, ജീവിതകാലത്തെ വെളിച്ചം."),
    invitation: L("Together with their families", "ഇരു കുടുംബങ്ങളോടൊപ്പം"),
    quote: {
      text: L("Whatever our souls are made of, his and mine are the same — and so they will be, in the light of one lamp.", "നമ്മുടെ ആത്മാക്കൾ എന്തിനാൽ നിർമ്മിതമായാലും, അവന്റേതും എന്റേതും ഒന്നുതന്നെ — ഒരു വിളക്കിന്റെ വെളിച്ചത്തിൽ അവ അങ്ങനെ തന്നെ തുടരും."),
      author: L("Meenakshi & Aravind", "മീനാക്ഷിയും അരവിന്ദും"),
    },
    hashtag: "MeenuWedsAravind",
    monogram: "M&A",
  };
  doc.couple.monogram = "MA";

  // ── venues ─────────────────────────────────────────────────────────────
  const venueMain = newId();
  const venueHome = newId();
  doc.venues = [
    {
      id: venueMain,
      name: L("Vembanad Heritage Pavilion", "വേമ്പനാട് ഹെറിറ്റേജ് പവലിയൻ"),
      address: L("Lake Road, Kumarakom, Kottayam, Kerala 686563", "ലേക്ക് റോഡ്, കുമരകം, കോട്ടയം, കേരളം 686563"),
      city: L("Kumarakom", "കുമരകം"),
      lat: 9.6175, lng: 76.4301,
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Kumarakom+Kerala",
      photo: m.venue,
      parking: {
        info: L("Free valet parking at the north gate for cars; two-wheeler parking beside the boat jetty. Elderly guests can be dropped at the pavilion steps.", "കാറുകൾക്ക് വടക്കേ ഗേറ്റിൽ സൗജന്യ വാലറ്റ് പാർക്കിംഗ്; ഇരുചക്ര വാഹനങ്ങൾക്ക് ബോട്ട് ജെട്ടിക്ക് സമീപം. മുതിർന്നവരെ പവലിയൻ പടികൾക്ക് മുന്നിൽ ഇറക്കാം."),
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Kumarakom+Boat+Jetty",
      },
      directions: {
        airport: L("Cochin International Airport (COK) — about 85 km, roughly 2 hours by car.\nPrepaid taxis are available outside arrivals.\nOur shuttle leaves the airport at 09:00 and 15:00 on 22 and 23 January.", "കൊച്ചി അന്താരാഷ്ട്ര വിമാനത്താവളം (COK) — ഏകദേശം 85 കി.മീ, കാറിൽ ഏകദേശം 2 മണിക്കൂർ.\nഅറൈവൽസിന് പുറത്ത് പ്രീപെയ്ഡ് ടാക്സി ലഭ്യമാണ്.\nജനുവരി 22, 23 തീയതികളിൽ രാവിലെ 9 മണിക്കും ഉച്ചയ്ക്ക് 3 മണിക്കും ഞങ്ങളുടെ ഷട്ടിൽ വിമാനത്താവളത്തിൽ നിന്ന് പുറപ്പെടും."),
        railway: L("Kottayam Railway Station — 16 km, about 30 minutes.\nAuto-rickshaws and taxis wait at the main exit.\nWe will send a volunteer with a board reading ‘Meenu & Aravind’.", "കോട്ടയം റെയിൽവേ സ്റ്റേഷൻ — 16 കി.മീ, ഏകദേശം 30 മിനിറ്റ്.\nപ്രധാന എക്സിറ്റിൽ ഓട്ടോറിക്ഷകളും ടാക്സികളും ലഭ്യമാണ്.\n‘മീനു & അരവിന്ദ്’ എന്നെഴുതിയ ബോർഡുമായി ഒരു സന്നദ്ധപ്രവർത്തകൻ കാത്തുനിൽക്കും."),
        road: L("From Kottayam take the Kumarakom road (KK Road) and follow the signs for the Bird Sanctuary.\nTurn left at the Lake Road junction; the pavilion is 1.2 km ahead on the right.", "കോട്ടയത്തുനിന്ന് കുമരകം റോഡ് (കെ.കെ. റോഡ്) വഴി ബേർഡ് സാങ്ച്വറി ബോർഡുകൾ പിന്തുടരുക.\nലേക്ക് റോഡ് ജംഗ്ഷനിൽ ഇടത്തേക്ക് തിരിയുക; പവലിയൻ 1.2 കി.മീ മുന്നിൽ വലതുവശത്താണ്."),
      },
      landmarkMap: { image: opts.full ? m.venue : undefined, pins: opts.full ? [
        { id: newId(), label: L("Muhurtham pavilion", "മുഹൂർത്ത പവലിയൻ"), x: 50, y: 42 },
        { id: newId(), label: L("Sadhya hall", "സദ്യാലയം"), x: 30, y: 62 },
        { id: newId(), label: L("Boat jetty & two-wheeler parking", "ബോട്ട് ജെട്ടി & ഇരുചക്ര പാർക്കിംഗ്"), x: 85, y: 78 },
        { id: newId(), label: L("Reception lawn", "റിസപ്ഷൻ ലോൺ"), x: 68, y: 55 },
      ] : [] },
      hotels: [
        { id: newId(), name: L("Kettuvallam Retreat", "കെട്ടുവള്ളം റിട്രീറ്റ്"), area: L("Kumarakom lakeside", "കുമരകം തടാകക്കര"), distanceKm: 1.5, priceHint: "₹6,500 / night", phone: "+91 481 000 0101", url: "https://example.com/kettuvallam", note: L("Our family block — mention ‘Meenu & Aravind’ for the wedding rate. Breakfast included.", "ഞങ്ങളുടെ കുടുംബ ബ്ലോക്ക് — വിവാഹ നിരക്കിനായി ‘മീനു & അരവിന്ദ്’ എന്ന് പറയുക. പ്രഭാതഭക്ഷണം ഉൾപ്പെടെ.") },
        { id: newId(), name: L("Vembanad Lake Inn", "വേമ്പനാട് ലേക്ക് ഇൻ"), area: L("Kumarakom", "കുമരകം"), distanceKm: 0.8, priceHint: "₹3,200 / night", phone: "+91 481 000 0102", url: "https://example.com/lakeinn", note: L("Simple, spotless rooms a five-minute walk from the venue.", "വേദിയിൽ നിന്ന് അഞ്ച് മിനിറ്റ് നടക്കാവുന്ന ദൂരത്ത് ലളിതവും വൃത്തിയുള്ളതുമായ മുറികൾ.") },
        { id: newId(), name: L("Backwater Homestay", "ബാക്ക്‌വാട്ടർ ഹോംസ്റ്റേ"), area: L("Cheepunkal", "ചീപ്പുങ്കൽ"), distanceKm: 4.2, priceHint: "₹2,400 / night", phone: "+91 481 000 0103", url: "", note: L("A warm family-run home with Kerala breakfast on the veranda.", "വരാന്തയിൽ കേരള പ്രഭാതഭക്ഷണം ഒരുക്കുന്ന ഊഷ്മളമായ കുടുംബ ഹോംസ്റ്റേ.") },
      ],
      nearby: [
        { id: newId(), name: L("Kumarakom Bird Sanctuary", "കുമരകം പക്ഷിസങ്കേതം"), kind: "Nature", note: L("Best in the early morning; migratory birds arrive in winter.", "അതിരാവിലെയാണ് ഏറ്റവും നല്ലത്; ശൈത്യകാലത്ത് ദേശാടനപ്പക്ഷികൾ എത്തും."), mapUrl: "https://www.google.com/maps/search/?api=1&query=Kumarakom+Bird+Sanctuary" },
        { id: newId(), name: L("Vembanad backwater cruise", "വേമ്പനാട് കായൽ യാത്ര"), kind: "Experience", note: L("A sunset cruise on a kettuvallam houseboat — book at the hotel desk.", "കെട്ടുവള്ളത്തിൽ ഒരു സായാഹ്ന കായൽയാത്ര — ഹോട്ടൽ ഡെസ്കിൽ ബുക്ക് ചെയ്യാം."), mapUrl: "" },
        { id: newId(), name: L("Pathiramanal Island", "പാതിരാമണൽ ദ്വീപ്"), kind: "Nature", note: L("A quiet island by boat — carry water and a hat.", "ബോട്ടിൽ എത്താവുന്ന ശാന്തമായ ദ്വീപ് — വെള്ളവും തൊപ്പിയും കരുതുക."), mapUrl: "" },
        { id: newId(), name: L("Toddy shop lunch (Karimeen fry)", "കള്ളുഷാപ്പ് ഊണ് (കരിമീൻ വറുത്തത്)"), kind: "Food", note: L("A Kuttanad classic — ask the hotel for their favourite.", "ഒരു കുട്ടനാടൻ ക്ലാസിക് — ഹോട്ടലിനോട് അവരുടെ ഇഷ്ട സ്ഥലം ചോദിക്കൂ."), mapUrl: "" },
      ],
      shuttle: {
        info: L("Complimentary shuttles run between the hotels and the pavilion on 23 and 24 January.", "ജനുവരി 23, 24 തീയതികളിൽ ഹോട്ടലുകൾക്കും പവലിയനും ഇടയിൽ സൗജന്യ ഷട്ടിൽ സർവീസ് ഉണ്ടായിരിക്കും."),
        schedule: [
          { id: newId(), time: "07:30", from: L("Kettuvallam Retreat", "കെട്ടുവള്ളം റിട്രീറ്റ്"), to: L("Pavilion (Muhurtham)", "പവലിയൻ (മുഹൂർത്തം)") },
          { id: newId(), time: "08:00", from: L("Vembanad Lake Inn", "വേമ്പനാട് ലേക്ക് ഇൻ"), to: L("Pavilion (Muhurtham)", "പവലിയൻ (മുഹൂർത്തം)") },
          { id: newId(), time: "17:45", from: L("Hotels", "ഹോട്ടലുകൾ"), to: L("Reception lawn", "റിസപ്ഷൻ ലോൺ") },
          { id: newId(), time: "22:30", from: L("Pavilion", "പവലിയൻ"), to: L("Hotels", "ഹോട്ടലുകൾ") },
        ],
      },
      guide: [
        { id: newId(), title: L("Weather in January", "ജനുവരിയിലെ കാലാവസ്ഥ"), body: L("Mornings are cool and misty (around 22°C); afternoons are warm and humid (32°C). Evenings by the lake turn breezy — carry a light shawl.", "പ്രഭാതങ്ങൾ തണുത്തതും മൂടൽമഞ്ഞുള്ളതുമാണ് (ഏകദേശം 22°C); ഉച്ചകൾ ചൂടും ഈർപ്പവുമുള്ളതാണ് (32°C). തടാകക്കരയിലെ സന്ധ്യകൾ കാറ്റുള്ളതായിരിക്കും — ഒരു ലഘു ഷാൾ കരുതുക.") },
        { id: newId(), title: L("What to pack", "എന്തൊക്കെ കരുതണം"), body: L("Comfortable footwear for the lawn and jetty, mosquito repellent, sunscreen, and cash for small local purchases.", "പുൽത്തകിടിക്കും ജെട്ടിക്കും അനുയോജ്യമായ പാദരക്ഷകൾ, കൊതുകുനാശിനി, സൺസ്ക്രീൻ, ചെറിയ പ്രാദേശിക വാങ്ങലുകൾക്ക് പണം.") },
        { id: newId(), title: L("Temple etiquette", "ക്ഷേത്ര മര്യാദകൾ"), body: L("The Muhurtham is held at an open pavilion with a lit lamp. Footwear off, phones on silent, and please stay seated during the thali ceremony.", "തുറന്ന പവലിയനിൽ തെളിഞ്ഞ വിളക്കിന് മുന്നിലാണ് മുഹൂർത്തം. പാദരക്ഷകൾ അഴിച്ചുവയ്ക്കുക, ഫോൺ നിശ്ശബ്ദമാക്കുക, താലികെട്ട് സമയത്ത് ദയവായി ഇരുന്നുതന്നെ ഇരിക്കുക.") },
      ],
    },
    {
      id: venueHome,
      name: L("Kaithavana Tharavad", "കൈതവന തറവാട്"),
      address: L("Near Mannanam Temple, Kottayam", "മാന്നാനം ക്ഷേത്രത്തിന് സമീപം, കോട്ടയം"),
      city: L("Kottayam", "കോട്ടയം"),
      mapUrl: "", parking: { info: L("Parking in the paddy-side compound.", "വയലരികിലെ പറമ്പിൽ പാർക്കിംഗ്."), mapUrl: "" },
      directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [],
    },
  ] as never;

  // ── events ─────────────────────────────────────────────────────────────
  doc.events = [
    { id: "evt-mehendi", name: L("Mehendi & Music", "മെഹന്ദി & സംഗീതം"), date: "2027-01-22", startTime: "17:00", endTime: "21:00", venueId: venueMain, isMain: false, order: 0,
      description: L("An evening of henna, folk songs and laughter on the lawn — with chai and snacks, and a live thiruvathira performance.", "പുൽത്തകിടിയിൽ മെഹന്ദിയും നാടൻപാട്ടുകളും ചിരിയും നിറഞ്ഞ ഒരു സായാഹ്നം — ചായയും ലഘുഭക്ഷണവും ലൈവ് തിരുവാതിരയും ഉണ്ടാകും."),
      dressCode: L("Festive pastels — mint, peach, lemon", "ഉത്സവ പാസ്റ്റൽ നിറങ്ങൾ — പുതിന, പീച്ച്, നാരങ്ങ"), dressColors: ["#BFE3D0", "#F7C9A8", "#F6E7A0"], notes: L("Henna artists will be there from 5 PM for everyone.", "വൈകിട്ട് 5 മണി മുതൽ എല്ലാവർക്കും വേണ്ടി മെഹന്ദി കലാകാരന്മാർ ഉണ്ടാകും."), mapUrl: "",
      visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: L("Mehendi", "മെഹന്ദി"), body: L("Henna is applied to the bride’s hands and feet as a blessing for a joyful marriage; the deeper the colour, the deeper the love, they say.", "സന്തോഷകരമായ ദാമ്പത്യത്തിനുള്ള അനുഗ്രഹമായി വധുവിന്റെ കൈകളിലും കാലുകളിലും മെഹന്ദി അണിയുന്നു; നിറം കടുത്തതാകുന്തോറും സ്നേഹവും കടുത്തതാകുമെന്നാണ് വിശ്വാസം.") } },
    { id: "evt-haldi", name: L("Haldi & Sandalwood Morning", "ഹൽദി & ചന്ദനപ്രഭാതം"), date: "2027-01-23", startTime: "09:30", endTime: "12:00", venueId: venueMain, isMain: false, order: 1,
      description: L("Turmeric, sandalwood and a lot of giggling. Wear something you don’t mind getting golden!", "മഞ്ഞളും ചന്ദനവും ഒരുപാട് ചിരിയും. സ്വർണ്ണനിറമാകാൻ വിരോധമില്ലാത്ത വസ്ത്രം ധരിക്കൂ!"),
      dressCode: L("Old whites or yellows", "പഴയ വെള്ള അല്ലെങ്കിൽ മഞ്ഞ വസ്ത്രങ്ങൾ"), dressColors: ["#F6EFDD", "#F2C94C"], notes: {}, mapUrl: "",
      visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: L("Haldi", "ഹൽദി"), body: L("A paste of turmeric and sandalwood is applied to the couple to bless, cleanse and bring a natural glow before the wedding.", "വിവാഹത്തിന് മുമ്പ് അനുഗ്രഹത്തിനും ശുദ്ധീകരണത്തിനും സ്വാഭാവിക തിളക്കത്തിനുമായി വധൂവരന്മാരെ മഞ്ഞളും ചന്ദനവും ചേർത്ത ലേപനം അണിയിക്കുന്നു.") } },
    { id: "evt-family", name: L("Family Blessing Lunch", "കുടുംബ അനുഗ്രഹ വിരുന്ന്"), date: "2027-01-23", startTime: "13:00", endTime: "15:00", venueId: venueHome, isMain: false, order: 2,
      description: L("A private lunch with elders of both families at the Kaithavana Tharavad, where blessings are exchanged before the wedding.", "വിവാഹത്തിന് മുമ്പ് അനുഗ്രഹങ്ങൾ കൈമാറുന്ന, ഇരു കുടുംബങ്ങളിലെയും മുതിർന്നവർക്കായുള്ള സ്വകാര്യ വിരുന്ന് (കൈതവന തറവാട്ടിൽ)."),
      dressCode: L("Traditional — kasavu", "പരമ്പരാഗതം — കസവ്"), dressColors: ["#F6EFDD", "#C2A04C"], notes: L("By invitation — immediate families only.", "ക്ഷണിക്കപ്പെട്ടവർക്ക് മാത്രം — അടുത്ത കുടുംബാംഗങ്ങൾ."), mapUrl: "",
      visibility: { mode: "GROUPS", groups: ["bride-family", "groom-family"] }, ritual: { title: {}, body: {} } },
    { id: "evt-muhurtham", name: L("Muhurtham — The Wedding", "മുഹൂർത്തം — വിവാഹം"), date: "2027-01-24", startTime: "10:30", endTime: "12:00", venueId: venueMain, isMain: true, order: 3,
      description: L("The heart of the day: the thali is tied at the auspicious hour before the sacred lamp, with garlands, blessings and rice showered by loved ones.", "ദിവസത്തിന്റെ ഹൃദയം: ശുഭമുഹൂർത്തത്തിൽ വിളക്കിന് മുന്നിൽ താലികെട്ട്; മാലകളും അനുഗ്രഹങ്ങളും പ്രിയപ്പെട്ടവർ വർഷിക്കുന്ന അരിയും."),
      dressCode: L("Kasavu — cream & gold", "കസവ് — ക്രീമും സ്വർണ്ണവും"), dressColors: ["#F6EFDD", "#C2A04C", "#1F4D3A"], notes: L("Please be seated by 10:00. The muhurtham is at 10:30 sharp.", "ദയവായി 10:00-ന് മുമ്പ് ഇരിപ്പിടത്തിൽ എത്തുക. മുഹൂർത്തം കൃത്യം 10:30-ന്."), mapUrl: "",
      visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: L("Thalikettu & Pudava Kodukkal", "താലികെട്ടും പുടവ കൊടുക്കലും"), body: L("The groom ties the thali around the bride’s neck as the nadaswaram plays; he then gifts her the pudava — a kasavu set-saree — symbolising a lifetime of care. The couple exchange garlands and walk around the lamp together.", "നാദസ്വരത്തിന്റെ അകമ്പടിയോടെ വരൻ വധുവിന്റെ കഴുത്തിൽ താലി ചാർത്തുന്നു; തുടർന്ന് ജീവിതകാലത്തെ കരുതലിന്റെ പ്രതീകമായി കസവ് സെറ്റ് സാരിയായ പുടവ സമ്മാനിക്കുന്നു. വധൂവരന്മാർ മാലകൾ കൈമാറി ഒരുമിച്ച് വിളക്കിനെ വലംവയ്ക്കുന്നു.") } },
    { id: "evt-sadhya", name: L("Wedding Sadhya", "വിവാഹ സദ്യ"), date: "2027-01-24", startTime: "12:30", endTime: "14:30", venueId: venueMain, isMain: false, order: 4,
      description: L("A traditional 24-dish banana-leaf feast, served in five sittings by family volunteers.", "കുടുംബ സന്നദ്ധപ്രവർത്തകർ അഞ്ച് പന്തികളായി വിളമ്പുന്ന, 24 വിഭവങ്ങളുള്ള പരമ്പരാഗത വാഴയില സദ്യ."),
      dressCode: L("As for the ceremony", "ചടങ്ങിലേത് പോലെ"), dressColors: [], notes: {}, mapUrl: "", visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} } },
    { id: "evt-reception", name: L("Reception Under the Lamps", "വിളക്കുകൾക്ക് കീഴിൽ റിസപ്ഷൻ"), date: "2027-01-24", startTime: "18:30", endTime: "22:00", venueId: venueMain, isMain: false, order: 5,
      description: L("An evening on the lake lawn — live band, toasts, dinner and a lantern send-off.", "തടാകക്കരയിലെ പുൽത്തകിടിയിൽ ഒരു സായാഹ്നം — ലൈവ് ബാൻഡ്, ആശംസകൾ, അത്താഴം, ലാന്റേൺ യാത്രയയപ്പ്."),
      dressCode: L("Evening formal — jewel tones", "സായാഹ്ന ഫോർമൽ — രത്നനിറങ്ങൾ"), dressColors: ["#7A1F2B", "#1F4D3A", "#1F3A5A"], notes: {}, mapUrl: "", visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} } },
  ] as never;

  // ── family ─────────────────────────────────────────────────────────────
  const gp = newId(), gpS = newId(), bf = newId(), bm = newId(), sis = newId(), gf = newId(), gm = newId(), gbro = newId(), ggp = newId();
  doc.family = {
    brideFamilyName: L("The Nair family", "നായർ കുടുംബം"),
    groomFamilyName: L("The Menon family", "മേനോൻ കുടുംബം"),
    members: [
      { id: gp, side: "bride", name: L("Late Sri Krishnan Nair", "പരേതനായ ശ്രീ കൃഷ്ണൻ നായർ"), relation: L("Grandfather", "മുത്തച്ഛൻ"), blurb: L("The family’s storyteller — his blessings are with us always.", "കുടുംബത്തിലെ കഥ പറച്ചിലുകാരൻ — അദ്ദേഹത്തിന്റെ അനുഗ്രഹം എപ്പോഴും ഞങ്ങളോടൊപ്പമുണ്ട്.") },
      { id: gpS, side: "bride", spouseOf: gp, name: L("Smt. Lakshmi Amma", "ശ്രീമതി ലക്ഷ്മിയമ്മ"), relation: L("Grandmother", "മുത്തശ്ശി"), blurb: L("Keeper of recipes and lullabies, and the one who lit the first lamp at every family wedding.", "പാചകക്കുറിപ്പുകളുടെയും താരാട്ടുകളുടെയും കാവൽക്കാരി; ഓരോ കുടുംബ വിവാഹത്തിലും ആദ്യത്തെ വിളക്ക് തെളിച്ചയാൾ.") },
      { id: bf, side: "bride", parentId: gp, name: L("Sri Gopalakrishnan Nair", "ശ്രീ ഗോപാലകൃഷ്ണൻ നായർ"), relation: L("Father of the bride", "വധുവിന്റെ പിതാവ്"), blurb: L("A retired bank manager who still balances the family’s books — and its feelings.", "കുടുംബത്തിലെ കണക്കുകളും വികാരങ്ങളും ഇപ്പോഴും സന്തുലിതമാക്കുന്ന റിട്ടയേർഡ് ബാങ്ക് മാനേജർ.") },
      { id: bm, side: "bride", spouseOf: bf, name: L("Smt. Radha Gopalakrishnan", "ശ്രീമതി രാധ ഗോപാലകൃഷ്ണൻ"), relation: L("Mother of the bride", "വധുവിന്റെ മാതാവ്"), blurb: L("A schoolteacher whose classroom smelled of jasmine — and whose patience became Meenu’s.", "മുല്ലപ്പൂ മണക്കുന്ന ക്ലാസ്മുറിയുടെ ടീച്ചർ; അവരുടെ ക്ഷമയാണ് മീനുവിന് ലഭിച്ചത്.") },
      { id: newId(), side: "bride", parentId: bf, name: L("Meenakshi", "മീനാക്ഷി"), relation: L("The bride", "വധു"), blurb: {} },
      { id: sis, side: "bride", parentId: bf, name: L("Anagha", "അനഘ"), relation: L("Sister of the bride", "വധുവിന്റെ സഹോദരി"), blurb: L("Meenu’s best friend since birth, and the family’s official ‘wedding manager’.", "ജനനം മുതൽ മീനുവിന്റെ ഉറ്റ ചങ്ങാതി; കുടുംബത്തിന്റെ ഔദ്യോഗിക ‘വെഡ്ഡിംഗ് മാനേജർ’.") },
      { id: ggp, side: "groom", name: L("Sri Ramachandra Menon", "ശ്രീ രാമചന്ദ്ര മേനോൻ"), relation: L("Grandfather", "മുത്തച്ഛൻ"), blurb: L("A temple musician whose edakka rhythms still echo through the family.", "എടയ്ക്കയുടെ താളം ഇന്നും കുടുംബത്തിൽ പ്രതിധ്വനിക്കുന്ന ക്ഷേത്ര സംഗീതജ്ഞൻ.") },
      { id: gf, side: "groom", parentId: ggp, name: L("Sri Narayanan Menon", "ശ്രീ നാരായണൻ മേനോൻ"), relation: L("Father of the groom", "വരന്റെ പിതാവ്"), blurb: L("A civil engineer who built the family home — and taught Aravind to love buildings.", "കുടുംബവീട് പണിത സിവിൽ എഞ്ചിനീയർ — കെട്ടിടങ്ങളെ സ്നേഹിക്കാൻ അരവിന്ദിനെ പഠിപ്പിച്ചയാൾ.") },
      { id: gm, side: "groom", spouseOf: gf, name: L("Smt. Sarala Narayanan", "ശ്രീമതി സരള നാരായണൻ"), relation: L("Mother of the groom", "വരന്റെ മാതാവ്"), blurb: L("A gifted cook and the heart of every Menon gathering.", "കഴിവുറ്റ പാചകക്കാരിയും ഓരോ മേനോൻ ഒത്തുചേരലിന്റെയും ഹൃദയവും.") },
      { id: newId(), side: "groom", parentId: gf, name: L("Aravind", "അരവിന്ദ്"), relation: L("The groom", "വരൻ"), blurb: {} },
      { id: gbro, side: "groom", parentId: gf, name: L("Adithya", "ആദിത്യ"), relation: L("Brother of the groom", "വരന്റെ സഹോദരൻ"), blurb: L("Aravind’s partner in every prank — and his best man today.", "അരവിന്ദിന്റെ എല്ലാ കുസൃതികളിലെയും കൂട്ടാളി — ഇന്ന് അദ്ദേഹത്തിന്റെ ബെസ്റ്റ് മാൻ.") },
    ],
    party: [
      { id: newId(), side: "bride", name: L("Anagha", "അനഘ"), role: L("Maid of honour", "മെയ്ഡ് ഓഫ് ഓണർ"), note: {}, photo: undefined },
      { id: newId(), side: "bride", name: L("Divya", "ദിവ്യ"), role: L("Bridesmaid", "ബ്രൈഡ്സ്‌മെയ്ഡ്"), note: {} },
      { id: newId(), side: "groom", name: L("Adithya", "ആദിത്യ"), role: L("Best man", "ബെസ്റ്റ് മാൻ"), note: {} },
      { id: newId(), side: "groom", name: L("Rahul", "രാഹുൽ"), role: L("Groomsman", "ഗ്രൂംസ്മാൻ"), note: {} },
    ],
  } as never;

  // ── story ──────────────────────────────────────────────────────────────
  doc.story = {
    chapters: [
      { id: newId(), when: L("Monsoon 2018", "മഴക്കാലം 2018"), title: L("The borrowed umbrella", "കടം വാങ്ങിയ കുട"), body: L("Orientation day, Kochi. It was pouring, Aravind had no umbrella, and Meenakshi had a spare — a small yellow one with a broken rib. She walked him to the bus stop. Neither remembers what they talked about. Both remember the umbrella.", "ഓറിയന്റേഷൻ ദിവസം, കൊച്ചി. മഴ തകർത്തുപെയ്യുകയായിരുന്നു, അരവിന്ദിന് കുടയില്ല, മീനാക്ഷിയുടെ കയ്യിൽ ഒരു സ്പെയർ കുടയുണ്ടായിരുന്നു — ഒടിഞ്ഞ കമ്പിയുള്ള ചെറിയ മഞ്ഞ കുട. അവൾ അവനെ ബസ് സ്റ്റോപ്പ് വരെ നടത്തിച്ചു. എന്താണ് സംസാരിച്ചതെന്ന് രണ്ടുപേർക്കും ഓർമ്മയില്ല. കുട രണ്ടുപേർക്കും ഓർമ്മയുണ്ട്."), photo: m.story.corridor },
      { id: newId(), when: L("2019", "2019"), title: L("Filter coffee & long answers", "ഫിൽട്ടർ കാപ്പിയും നീണ്ട മറുപടികളും"), body: L("Every afternoon at the campus café, one steel tumbler of filter coffee turned into two, then into three hours. Aravind sketched the café on a napkin; Meenakshi kept it in her diary.", "ഓരോ ഉച്ചയ്ക്കും കാമ്പസ് കഫേയിൽ ഒരു സ്റ്റീൽ ടംബ്ലർ ഫിൽട്ടർ കാപ്പി രണ്ടായി, പിന്നെ മൂന്ന് മണിക്കൂറായി. അരവിന്ദ് കഫേയുടെ ചിത്രം ഒരു നാപ്കിനിൽ വരച്ചു; മീനാക്ഷി അത് തന്റെ ഡയറിയിൽ സൂക്ഷിച്ചു."), photo: m.story.cafe },
      { id: newId(), when: L("2022", "2022"), title: L("The 11:40 night train", "രാത്രി 11:40-ന്റെ ട്രെയിൻ"), body: L("Jobs took them to different cities. Every second Friday, Aravind took the night train to see her, and every Sunday she cried a little at the station. Two hundred and eleven train tickets later, the distance had become a joke between them.", "ജോലി അവരെ വ്യത്യസ്ത നഗരങ്ങളിലേക്ക് കൊണ്ടുപോയി. ഓരോ രണ്ടാം വെള്ളിയാഴ്ചയും അരവിന്ദ് അവളെ കാണാൻ രാത്രി ട്രെയിൻ പിടിച്ചു, ഓരോ ഞായറാഴ്ചയും അവൾ സ്റ്റേഷനിൽ അല്പം കരഞ്ഞു. ഇരുനൂറ്റി പതിനൊന്ന് ടിക്കറ്റുകൾക്ക് ശേഷം ദൂരം അവർക്കിടയിൽ ഒരു തമാശയായി മാറി."), photo: m.story.train },
      { id: newId(), when: L("December 2025", "ഡിസംബർ 2025"), title: L("The question, on the water", "വെള്ളത്തിന്മേൽ ഒരു ചോദ്യം"), body: L("On a quiet kettuvallam at sunset, with the lamp lit and the whole family hiding in the next boat, Aravind asked. Meenakshi said yes before he finished — and then made him ask again, slowly.", "സൂര്യാസ്തമയത്തിൽ ശാന്തമായ ഒരു കെട്ടുവള്ളത്തിൽ, വിളക്ക് തെളിച്ച്, കുടുംബം മുഴുവൻ അടുത്ത ബോട്ടിൽ ഒളിച്ചിരിക്കെ, അരവിന്ദ് ചോദിച്ചു. ചോദ്യം തീരുംമുമ്പേ മീനാക്ഷി സമ്മതിച്ചു — പിന്നെ പതുക്കെ ഒന്നുകൂടി ചോദിപ്പിച്ചു."), photo: m.gallery[2]?.id },
    ],
    howWeMet: { title: L("A yellow umbrella", "ഒരു മഞ്ഞ കുട"), body: L("We met on the wettest day of the year. She had the umbrella; he had the good manners to return it — three years later, on the day he asked her to marry him. She never took it back.", "വർഷത്തിലെ ഏറ്റവും മഴയുള്ള ദിവസമാണ് ഞങ്ങൾ കണ്ടുമുട്ടിയത്. അവളുടെ കയ്യിൽ കുടയുണ്ടായിരുന്നു; അവന് അത് തിരികെ നൽകാനുള്ള മര്യാദയും — മൂന്ന് വർഷത്തിന് ശേഷം, അവളോട് വിവാഹാഭ്യർത്ഥന നടത്തിയ ദിവസം. അവൾ ഒരിക്കലും അത് തിരിച്ചെടുത്തില്ല."), photo: m.story.corridor },
    thenNow: opts.full ? [{ id: newId(), label: L("Corridor, 2018 → Kumarakom, 2026", "ഇടനാഴി, 2018 → കുമരകം, 2026"), then: m.story.thenA, now: m.story.thenB }] : [],
    memoryCards: opts.full ? [
      { id: newId(), title: L("The napkin sketch", "നാപ്കിൻ ചിത്രം"), body: L("Still folded in her diary.", "ഇപ്പോഴും അവളുടെ ഡയറിയിൽ മടക്കി വച്ചിരിക്കുന്നു."), photo: m.story.cafe },
      { id: newId(), title: L("Ticket #211", "ടിക്കറ്റ് #211"), body: L("The last night train — and the first day of forever.", "അവസാനത്തെ രാത്രി ട്രെയിൻ — എന്നെന്നേക്കുമുള്ള ആദ്യദിനം."), photo: m.story.train },
      { id: newId(), title: L("Amma’s first blessing", "അമ്മയുടെ ആദ്യ അനുഗ്രഹം"), body: L("A pinch of sandalwood on both foreheads.", "രണ്ടുപേരുടെയും നെറ്റിയിൽ ഒരു നുള്ള് ചന്ദനം."), photo: m.gallery[0]?.id },
    ] : [],
    personality: opts.full ? {
      bride: [{ id: newId(), label: L("Loves", "ഇഷ്ടം"), value: L("Rain, poetry, second helpings", "മഴ, കവിത, ഒരു തവണ കൂടി വിളമ്പൽ") }, { id: newId(), label: L("Can’t live without", "ഇല്ലാതെ പറ്റില്ല"), value: L("Filter coffee", "ഫിൽട്ടർ കാപ്പി") }, { id: newId(), label: L("Secret talent", "രഹസ്യ കഴിവ്"), value: L("Sings every raga off-key, happily", "എല്ലാ രാഗങ്ങളും സന്തോഷത്തോടെ ശ്രുതിതെറ്റി പാടും") }],
      groom: [{ id: newId(), label: L("Loves", "ഇഷ്ടം"), value: L("Old buildings, long drives, sambar", "പഴയ കെട്ടിടങ്ങൾ, ദീർഘയാത്രകൾ, സാമ്പാർ") }, { id: newId(), label: L("Can’t live without", "ഇല്ലാതെ പറ്റില്ല"), value: L("A pencil in his pocket", "പോക്കറ്റിൽ ഒരു പെൻസിൽ") }, { id: newId(), label: L("Secret talent", "രഹസ്യ കഴിവ്"), value: L("Can identify any raga by its first note", "ആദ്യ സ്വരം കേട്ട് ഏത് രാഗവും തിരിച്ചറിയും") }],
    } : { bride: [], groom: [] },
    voiceStory: { transcript: L("“We had planned to record a voice note for you, but Meenu kept laughing at the first line. So here’s the short version: thank you for being part of our story.”", "“നിങ്ങൾക്കായി ഒരു ശബ്ദസന്ദേശം റെക്കോർഡ് ചെയ്യാൻ ഞങ്ങൾ ആലോചിച്ചു, പക്ഷേ ആദ്യ വരിയിൽ മീനു ചിരിച്ചുകൊണ്ടേയിരുന്നു. അതുകൊണ്ട് ചുരുക്കം ഇതാണ്: ഞങ്ങളുടെ കഥയുടെ ഭാഗമായതിന് നന്ദി.”") },
  } as never;

  // ── details ────────────────────────────────────────────────────────────
  doc.menu = {
    courses: [
      { id: newId(), title: L("Welcome", "സ്വാഗതം"), items: [{ id: newId(), name: L("Sambharam (spiced buttermilk)", "സംഭാരം"), note: {}, veg: true }, { id: newId(), name: L("Tender coconut", "ഇളനീർ"), note: {}, veg: true }] },
      { id: newId(), title: L("The Sadhya", "സദ്യ"), items: [
        { id: newId(), name: L("Parippu, Sambar & Rasam", "പരിപ്പ്, സാമ്പാർ, രസം"), note: L("with ghee and pappadam", "നെയ്യും പപ്പടവും ചേർത്ത്"), veg: true },
        { id: newId(), name: L("Avial, Thoran & Olan", "അവിയൽ, തോരൻ, ഓലൻ"), note: {}, veg: true },
        { id: newId(), name: L("Pachadi, Kichadi & Achar", "പച്ചടി, കിച്ചടി, അച്ചാർ"), note: {}, veg: true },
        { id: newId(), name: L("Banana chips & Sharkara upperi", "ഉപ്പേരിയും ശർക്കര വരട്ടിയും"), note: {}, veg: true },
      ] },
      { id: newId(), title: L("Payasam", "പായസം"), items: [{ id: newId(), name: L("Ada Pradhaman", "അട പ്രഥമൻ"), note: L("Grandmother’s recipe", "മുത്തശ്ശിയുടെ പാചകക്കുറിപ്പ്"), veg: true }, { id: newId(), name: L("Palada Payasam", "പാലട പായസം"), note: {}, veg: true }] },
      { id: newId(), title: L("Reception dinner", "റിസപ്ഷൻ അത്താഴം"), items: [{ id: newId(), name: L("Karimeen Pollichathu", "കരിമീൻ പൊള്ളിച്ചത്"), note: L("Pearl spot fish in banana leaf", "വാഴയിലയിൽ പൊള്ളിച്ച കരിമീൻ"), veg: false }, { id: newId(), name: L("Kerala Chicken Roast", "കേരള ചിക്കൻ റോസ്റ്റ്"), note: {}, veg: false }, { id: newId(), name: L("Vegetable Stew & Appam", "വെജിറ്റബിൾ സ്റ്റൂവും അപ്പവും"), note: {}, veg: true }] },
    ],
    note: L("Every dish is prepared fresh by Kottayam’s Sri Devi Caterers. Please tell us about allergies when you reply.", "എല്ലാ വിഭവങ്ങളും കോട്ടയത്തെ ശ്രീദേവി കേറ്റററേഴ്സ് പുതുതായി തയ്യാറാക്കുന്നു. മറുപടി നൽകുമ്പോൾ അലർജികളെക്കുറിച്ച് അറിയിക്കൂ."),
  } as never;

  doc.palette = {
    colors: [
      { id: newId(), hex: "#F6EFDD", name: L("Ivory", "ആനക്കൊമ്പ്") }, { id: newId(), hex: "#C2A04C", name: L("Kasavu gold", "കസവ് സ്വർണ്ണം") },
      { id: newId(), hex: "#1F4D3A", name: L("Forest green", "കാട്ടുപച്ച") }, { id: newId(), hex: "#7A1F2B", name: L("Maroon", "മറൂൺ") }, { id: newId(), hex: "#E9B7A0", name: L("Blush", "ബ്ലഷ്") },
    ],
    note: L("Ivory and gold for the ceremony; jewel tones for the evening.", "ചടങ്ങിന് ആനക്കൊമ്പും സ്വർണ്ണവും; സായാഹ്നത്തിന് രത്നനിറങ്ങൾ."),
  } as never;

  doc.dressGuide = {
    looks: [
      { id: newId(), title: L("Set-saree or half-saree", "സെറ്റ് സാരി അല്ലെങ്കിൽ ഹാഫ് സാരി"), forWhom: "women", description: L("Cream kasavu set-saree with a gold border, or a half-saree in jewel tones for the reception.", "സ്വർണ്ണ അരികുള്ള ക്രീം കസവ് സെറ്റ് സാരി, അല്ലെങ്കിൽ റിസപ്ഷന് രത്നനിറങ്ങളിലെ ഹാഫ് സാരി."), colors: ["#F6EFDD", "#C2A04C"], photo: m.gallery[7]?.id },
      { id: newId(), title: L("Mundu & shirt", "മുണ്ടും ഷർട്ടും"), forWhom: "men", description: L("A crisp cream mundu with a kasavu border and a light shirt or kurta; a dark suit for the reception.", "കസവ് അരികുള്ള ക്രീം മുണ്ടും ലഘു ഷർട്ടോ കുർത്തയോ; റിസപ്ഷന് ഇരുണ്ട സ്യൂട്ട്."), colors: ["#F6EFDD", "#1F4D3A"], photo: m.gallery[6]?.id },
      { id: newId(), title: L("Comfortable & cool", "സുഖപ്രദവും തണുപ്പുള്ളതും"), forWhom: "everyone", description: L("Breathable cotton or silk-cotton. The lawn is soft — flats or kolhapuris beat heels.", "വായുസഞ്ചാരമുള്ള കോട്ടൺ അല്ലെങ്കിൽ സിൽക്ക്-കോട്ടൺ. പുൽത്തകിടി മൃദുവാണ് — ഹീലുകളെക്കാൾ ഫ്ലാറ്റുകൾ നല്ലത്."), colors: [], photo: m.gallery[3]?.id },
    ],
    avoid: L("Black for the ceremony and very bright reds (reserved for the bride).", "ചടങ്ങിന് കറുപ്പ്, വധുവിനായി മാറ്റിവച്ച കടും ചുവപ്പ് എന്നിവ ഒഴിവാക്കുക."),
  } as never;

  doc.rsvp = {
    ...doc.rsvp,
    deadline: "2027-01-05",
    askMeal: true,
    askAccommodation: true,
    askTransport: true,
    askEventResponses: true,
    allowCompanions: true,
    pickupLocations: [
      { id: newId(), label: L("Cochin Airport (COK)", "കൊച്ചി വിമാനത്താവളം (COK)") },
      { id: newId(), label: L("Kottayam Railway Station", "കോട്ടയം റെയിൽവേ സ്റ്റേഷൻ") },
      { id: newId(), label: L("Ernakulam Junction", "എറണാകുളം ജംഗ്ഷൻ") },
    ],
    whatsappNumber: "919846000000",
    thankYou: L("Thank you, {name}. We can’t wait to celebrate with you.", "നന്ദി, {name}. നിങ്ങളോടൊപ്പം ആഘോഷിക്കാൻ ഞങ്ങൾ കാത്തിരിക്കുന്നു."),
  } as never;

  doc.contacts = [
    { id: newId(), name: L("Anagha (wedding coordinator)", "അനഘ (വെഡ്ഡിംഗ് കോർഡിനേറ്റർ)"), role: L("Travel, stay & anything on the day", "യാത്ര, താമസം, ആ ദിവസത്തെ എന്തും"), phone: "+91 98460 00001" },
    { id: newId(), name: L("Sri Gopalakrishnan Nair", "ശ്രീ ഗോപാലകൃഷ്ണൻ നായർ"), role: L("Father of the bride", "വധുവിന്റെ പിതാവ്"), phone: "+91 98460 00002" },
    { id: newId(), name: L("Adithya", "ആദിത്യ"), role: L("Reception & music", "റിസപ്ഷനും സംഗീതവും"), phone: "+91 98460 00003" },
  ] as never;

  doc.guestGreetings = {
    default: L("Dear {name}, we would love to celebrate this special day with you.", "പ്രിയപ്പെട്ട {name}, ഈ പ്രത്യേക ദിവസം നിങ്ങളോടൊപ്പം ആഘോഷിക്കാൻ ഞങ്ങൾ ആഗ്രഹിക്കുന്നു."),
    byRelationship: [
      { id: newId(), match: "aunt", text: L("Dear {name}, your blessings and your laugh have shaped our childhood. We would be honoured to have you beside us.", "പ്രിയപ്പെട്ട {name}, നിങ്ങളുടെ അനുഗ്രഹങ്ങളും ചിരിയുമാണ് ഞങ്ങളുടെ ബാല്യത്തെ രൂപപ്പെടുത്തിയത്. ഞങ്ങളോടൊപ്പം നിങ്ങളുണ്ടാകുന്നത് ഒരു ബഹുമതിയായിരിക്കും.") },
      { id: newId(), match: "uncle", text: L("Dear {name}, your blessings mean the world to us. Please walk us through this new chapter.", "പ്രിയപ്പെട്ട {name}, നിങ്ങളുടെ അനുഗ്രഹം ഞങ്ങൾക്ക് ലോകത്തോളം വിലപ്പെട്ടതാണ്. ഈ പുതിയ അധ്യായത്തിൽ ഞങ്ങളെ നയിക്കണം.") },
      { id: newId(), match: "friend", text: L("Dear {name}, you were there for the umbrella, the coffee and the train tickets — you have to be there for this one too!", "പ്രിയപ്പെട്ട {name}, കുടയിലും കാപ്പിയിലും ട്രെയിൻ ടിക്കറ്റുകളിലും നിങ്ങൾ ഒപ്പമുണ്ടായിരുന്നു — ഇതിലും ഉണ്ടാകണം!") },
      { id: newId(), match: "colleague", text: L("Dear {name}, thank you for the late-night pep talks and the early-morning coffee. Come dance at our wedding!", "പ്രിയപ്പെട്ട {name}, രാത്രി വൈകിയുള്ള പ്രോത്സാഹനങ്ങൾക്കും അതിരാവിലത്തെ കാപ്പിക്കും നന്ദി. ഞങ്ങളുടെ വിവാഹത്തിന് വന്ന് നൃത്തം ചെയ്യൂ!") },
    ],
  } as never;

  // ── games ──────────────────────────────────────────────────────────────
  const q = (en: string, ml: string, options: [string, string][], answer: number) => ({ id: newId(), q: L(en, ml), options: options.map(([a, b]) => L(a, b)), answer });
  doc.games = {
    trivia: {
      title: L("How well do you know Meenu & Aravind?", "മീനുവിനെയും അരവിന്ദിനെയും നിങ്ങൾക്ക് എത്ര അറിയാം?"),
      questions: [
        q("Where did Meenakshi and Aravind first meet?", "മീനാക്ഷിയും അരവിന്ദും ആദ്യം എവിടെയാണ് കണ്ടുമുട്ടിയത്?", [["A wedding", "ഒരു വിവാഹത്തിൽ"], ["Their college orientation", "കോളേജ് ഓറിയന്റേഷനിൽ"], ["A bookshop", "ഒരു പുസ്തകശാലയിൽ"], ["A temple festival", "ഒരു ക്ഷേത്രോത്സവത്തിൽ"]], 1),
        q("What did Meenakshi lend Aravind that day?", "അന്ന് മീനാക്ഷി അരവിന്ദിന് എന്താണ് കടം നൽകിയത്?", [["A pen", "ഒരു പേന"], ["A yellow umbrella", "ഒരു മഞ്ഞ കുട"], ["A scarf", "ഒരു സ്കാർഫ്"], ["Her notes", "അവളുടെ നോട്ടുകൾ"]], 1),
        q("What is Aravind’s job?", "അരവിന്ദിന്റെ ജോലി എന്താണ്?", [["Doctor", "ഡോക്ടർ"], ["Architect", "ആർക്കിടെക്റ്റ്"], ["Pilot", "പൈലറ്റ്"], ["Chef", "ഷെഫ്"]], 1),
        q("How many night-train tickets did they collect?", "അവർ എത്ര രാത്രി ട്രെയിൻ ടിക്കറ്റുകൾ ശേഖരിച്ചു?", [["21", "21"], ["111", "111"], ["211", "211"], ["500", "500"]], 2),
        q("Where did Aravind propose?", "അരവിന്ദ് എവിടെയാണ് വിവാഹാഭ്യർത്ഥന നടത്തിയത്?", [["On a kettuvallam", "ഒരു കെട്ടുവള്ളത്തിൽ"], ["At a temple", "ഒരു ക്ഷേത്രത്തിൽ"], ["On a train", "ഒരു ട്രെയിനിൽ"], ["At a café", "ഒരു കഫേയിൽ"]], 0),
      ],
    },
    bingo: { squares: ["Someone cries happy tears", "Nadaswaram plays", "A saree gets pulled", "Uncle dances", "Kids steal the garland", "Selfie with the couple", "Someone asks for payasam twice", "Jasmine in every hair", "‘When is your turn?’"].map((en, i) => ({ id: newId(), text: L(en, ["ആരെങ്കിലും ആനന്ദാശ്രു പൊഴിക്കും", "നാദസ്വരം മുഴങ്ങും", "ഒരു സാരി വലിഞ്ഞുപോകും", "അങ്കിൾ നൃത്തം ചെയ്യും", "കുട്ടികൾ മാല കട്ടെടുക്കും", "വധൂവരന്മാരുമൊത്ത് സെൽഫി", "ആരെങ്കിലും പായസം രണ്ടാമതും ചോദിക്കും", "എല്ലാ മുടിയിലും മുല്ലപ്പൂ", "‘അടുത്തത് നിങ്ങളുടെ ഊഴം?’"][i]) })) },
    wheel: { prizes: [["A big hug", "ഒരു വലിയ ആലിംഗനം"], ["Extra payasam", "അധിക പായസം"], ["Dance with the groom", "വരനൊപ്പം നൃത്തം"], ["Blessing from Ammamma", "അമ്മമ്മയുടെ അനുഗ്രഹം"], ["A selfie with the bride", "വധുവിനൊപ്പം സെൽഫി"], ["Song request", "പാട്ട് ആവശ്യപ്പെടാം"]].map(([en, ml]) => ({ id: newId(), label: L(en, ml), detail: L("Claim it at the reception!", "റിസപ്ഷനിൽ ഇത് ആവശ്യപ്പെടാം!") })) },
    scratch: { prizes: [["Sweet treat", "മധുരം"], ["Front-row seat", "മുൻനിരയിൽ ഇരിപ്പിടം"], ["Ice-cream voucher", "ഐസ്ക്രീം വൗച്ചർ"], ["Best-dressed shout-out", "മികച്ച വസ്ത്രധാരണ പ്രഖ്യാപനം"]].map(([en, ml]) => ({ id: newId(), label: L(en, ml), detail: L("Show this at the dessert counter.", "ഡെസേർട്ട് കൗണ്ടറിൽ ഇത് കാണിക്കൂ.") })) },
    fortune: { messages: [["A beautiful year awaits you.", "മനോഹരമായ ഒരു വർഷം നിങ്ങളെ കാത്തിരിക്കുന്നു."], ["Someone in this room is thinking of you fondly.", "ഈ മുറിയിലുള്ള ആരോ നിങ്ങളെ സ്നേഹത്തോടെ ഓർക്കുന്നു."], ["Say yes to the second payasam.", "രണ്ടാമത്തെ പായസത്തിന് സമ്മതം പറയൂ."], ["Your next dance will be unforgettable.", "നിങ്ങളുടെ അടുത്ത നൃത്തം അവിസ്മരണീയമായിരിക്കും."], ["Love is patient; so is the sadhya queue.", "സ്നേഹം ക്ഷമയുള്ളതാണ്; സദ്യയുടെ വരിയും."], ["A wedding invitation is coming your way soon.", "ഉടൻ തന്നെ ഒരു വിവാഹക്ഷണം നിങ്ങളെ തേടിയെത്തും."]].map(([en, ml]) => ({ id: newId(), text: L(en, ml) })) },
    findDiff: { a: m.puzzleA, b: m.puzzleB, spots: PUZZLE_SPOTS.map((s) => ({ id: newId(), ...s })) },
    guessSong: { rounds: [
      { id: newId(), clue: L("Which of these is Meenu’s favourite melody?", "ഇവയിൽ മീനുവിന്റെ ഇഷ്ട ഈണം ഏതാണ്?"), audio: m.clipA, options: [L("The rain song", "മഴപ്പാട്ട്"), L("The lamp lullaby", "വിളക്ക് താരാട്ട്"), L("The boat song", "വള്ളപ്പാട്ട്")], answer: 1 },
      { id: newId(), clue: L("Which tune played when Aravind proposed?", "അരവിന്ദ് വിവാഹാഭ്യർത്ഥന നടത്തിയപ്പോൾ ഏത് ഈണമാണ് മുഴങ്ങിയത്?"), audio: m.clipB, options: [L("The rain song", "മഴപ്പാട്ട്"), L("The lamp lullaby", "വിളക്ക് താരാട്ട്"), L("The boat song", "വള്ളപ്പാട്ട്")], answer: 2 },
    ] },
    crossword: { words: [["KASAVU", "The golden border of a Kerala set-mundu", "കേരള സെറ്റ് മുണ്ടിന്റെ സ്വർണ്ണ അരിക്"], ["SADHYA", "The banana-leaf feast", "വാഴയില സദ്യ"], ["VALLAM", "A traditional boat", "പരമ്പരാഗത വള്ളം"], ["PAYASAM", "Sweet milk pudding", "മധുരമുള്ള പായസം"], ["MUNDU", "What the groom wears", "വരൻ ധരിക്കുന്നത്"], ["MULLA", "Jasmine, in Malayalam", "മലയാളത്തിൽ ജാസ്മിൻ"]].map(([answer, en, ml]) => ({ id: newId(), answer, clue: L(en, ml) })) },
    scavenger: { tasks: [["Take a photo with someone wearing your favourite colour", "നിങ്ങളുടെ ഇഷ്ട നിറം ധരിച്ച ഒരാളോടൊപ്പം ഫോട്ടോ എടുക്കൂ", 10], ["Find the oldest guest and ask for a blessing", "ഏറ്റവും മുതിർന്ന അതിഥിയെ കണ്ടെത്തി അനുഗ്രഹം വാങ്ങൂ", 20], ["Spot the nilavilakku and take a photo beside it", "നിലവിളക്ക് കണ്ടെത്തി അതിനടുത്ത് ഫോട്ടോ എടുക്കൂ", 10], ["Get a group selfie with 5 new people", "5 പുതിയ ആളുകളോടൊപ്പം ഗ്രൂപ്പ് സെൽഫി", 15], ["Learn one Malayalam wedding blessing", "ഒരു മലയാള വിവാഹാശംസ പഠിക്കൂ", 15]].map(([en, ml, points]) => ({ id: newId(), title: L(en as string, ml as string), hint: {}, points: points as number })) },
  } as never;

  doc.opening = { variant: "envelope", sealText: "M", dateReveal: true, showInitials: true, locationAware: true, invitedLine: L("You are invited to the wedding of", "വിവാഹത്തിലേക്ക് നിങ്ങളെ ക്ഷണിക്കുന്നു") } as never;
  doc.timeCapsule = { unlockDate: "2028-01-24", prompt: L("Write to us for our first anniversary — we will open it together.", "ഞങ്ങളുടെ ആദ്യ വാർഷികത്തിന് ഞങ്ങൾക്ക് എഴുതൂ — ഞങ്ങൾ ഒരുമിച്ച് തുറന്നു വായിക്കും."), allowPhoto: true, allowVideo: true, allowVoice: true } as never;
  doc.thankYou = { message: L("From the bottom of our hearts — thank you for travelling, blessing, dancing and making our day complete. Every one of you is now part of our story.\n\nWith love and gratitude,", "ഞങ്ങളുടെ ഹൃദയത്തിന്റെ അടിത്തട്ടിൽ നിന്ന് — യാത്ര ചെയ്തതിനും അനുഗ്രഹിച്ചതിനും നൃത്തം ചെയ്തതിനും ഞങ്ങളുടെ ദിവസം പൂർണ്ണമാക്കിയതിനും നന്ദി. നിങ്ങളോരോരുത്തരും ഇപ്പോൾ ഞങ്ങളുടെ കഥയുടെ ഭാഗമാണ്.\n\nസ്നേഹത്തോടെയും കൃതജ്ഞതയോടെയും,"), signature: L("Meenu & Aravind", "മീനുവും അരവിന്ദും"), photo: m.hero } as never;
  doc.anniversary = { message: L("Twelve months, one lamp, a thousand small joys. Thank you for being part of the beginning.", "പന്ത്രണ്ട് മാസം, ഒരു വിളക്ക്, ആയിരം ചെറിയ സന്തോഷങ്ങൾ. തുടക്കത്തിന്റെ ഭാഗമായതിന് നന്ദി."), highlightPhotos: [] } as never;
  doc.live = { streamUrl: "", streamLabel: L("Watch the Muhurtham live", "മുഹൂർത്തം തത്സമയം കാണുക") } as never;
  doc.seo = { title: L("Meenakshi & Aravind — Wedding Invitation", "മീനാക്ഷി & അരവിന്ദ് — വിവാഹ ക്ഷണം"), description: L("Together with our families, we invite you to celebrate our wedding on 24 January 2027 at Kumarakom, Kerala.", "ഇരു കുടുംബങ്ങളോടൊപ്പം, 2027 ജനുവരി 24-ന് കേരളത്തിലെ കുമരകത്ത് നടക്കുന്ന ഞങ്ങളുടെ വിവാഹത്തിൽ പങ്കുചേരാൻ നിങ്ങളെ ക്ഷണിക്കുന്നു."), ogImage: m.og } as never;

  // ── the new storytelling layer ───────────────────────────────────────────
  doc.eventType = "hindu_wedding";
  doc.journey = { enabled: true, style: "kerala" };
  doc.images = { couple: m.hero, story: m.storyPhoto ?? m.story.cafe, family: m.family, ceremony: undefined, coupleWide: undefined };
  doc.story.intro = L("Two paths.\nOne yellow umbrella.\nA thousand cups of filter coffee.\nAnd now, forever.", "രണ്ട് വഴികൾ.\nഒരു മഞ്ഞ കുട.\nആയിരം കപ്പ് ഫിൽട്ടർ കാപ്പി.\nഇനി, എന്നെന്നേക്കും.");
  doc.story.introPhoto = m.storyPhoto ?? m.story.cafe;
  const ms = m.milestones ?? {};
  doc.story.milestones = [
    { id: newId(), year: "2018", title: L("The borrowed umbrella", "കടം വാങ്ങിയ കുട"), caption: L("A downpour in Kochi, one yellow umbrella with a broken rib, and a walk to the bus stop neither of them remembers.", "കൊച്ചിയിൽ ഒരു പെരുമഴ, ഒടിഞ്ഞ കമ്പിയുള്ള ഒരു മഞ്ഞ കുട, ഇരുവരും ഓർക്കാത്ത ബസ് സ്റ്റോപ്പ് വരെയുള്ള ഒരു നടത്തം."), photo: ms.umbrella },
    { id: newId(), year: "2019", title: L("Filter coffee, long answers", "ഫിൽട്ടർ കാപ്പി, നീണ്ട മറുപടികൾ"), caption: L("One steel tumbler became two, then three hours. A café sketched on a napkin, kept in a diary.", "ഒരു സ്റ്റീൽ ടംബ്ലർ രണ്ടായി, പിന്നെ മൂന്ന് മണിക്കൂറായി. ഒരു നാപ്കിനിൽ വരച്ച കഫേ, ഡയറിയിൽ സൂക്ഷിച്ചത്."), photo: ms.coffee },
    { id: newId(), year: "2022", title: L("The 11:40 night train", "രാത്രി 11:40-ന്റെ ട്രെയിൻ"), caption: L("Two cities, two hundred and eleven tickets. The distance became a joke between them.", "രണ്ട് നഗരങ്ങൾ, ഇരുനൂറ്റി പതിനൊന്ന് ടിക്കറ്റുകൾ. ദൂരം അവർക്കിടയിൽ ഒരു തമാശയായി."), photo: ms.train },
    { id: newId(), year: "2025", title: L("The question, on the water", "വെള്ളത്തിന്മേൽ ഒരു ചോദ്യം"), caption: L("A quiet kettuvallam at sunset, a lamp lit, the whole family hiding in the next boat.", "സൂര്യാസ്തമയത്തിൽ ശാന്തമായ ഒരു കെട്ടുവള്ളം, തെളിഞ്ഞ വിളക്ക്, അടുത്ത ബോട്ടിൽ ഒളിച്ചിരിക്കുന്ന കുടുംബം."), photo: ms.proposal },
    { id: newId(), year: "2027", title: L("Muhurtham", "മുഹൂർത്തം"), caption: L("24 January, 10:30 — beside a lamp that is already lit, with everyone they love.", "ജനുവരി 24, 10:30 — ഇതിനകം തെളിഞ്ഞ ഒരു വിളക്കിനരികെ, അവർ സ്നേഹിക്കുന്ന എല്ലാവരോടുമൊപ്പം.") },
  ];
  doc.ceremonies = {
    intro: L("A Kerala wedding is short and spare — a lamp, a thread, a garland, a saree — and every part of it means something. A few of the moments you will see:", "ഒരു കേരള വിവാഹം ലളിതവും ചുരുക്കവുമാണ് — ഒരു വിളക്ക്, ഒരു ചരട്, ഒരു മാല, ഒരു സാരി — അതിലെ ഓരോ ഭാഗത്തിനും അർത്ഥമുണ്ട്. നിങ്ങൾ കാണാനിരിക്കുന്ന ചില നിമിഷങ്ങൾ:"),
    items: [
      { id: newId(), name: L("Ganapathi Pooja", "ഗണപതി പൂജ"), when: L("At dawn, at home", "പുലർച്ചെ, വീട്ടിൽ"), description: L("The day begins with a prayer to Ganapathi before the lit nilavilakku, for a beginning free of obstacles.", "തടസ്സങ്ങളില്ലാത്ത തുടക്കത്തിനായി, തെളിഞ്ഞ നിലവിളക്കിന് മുന്നിൽ ഗണപതിയെ പ്രാർത്ഥിച്ചുകൊണ്ട് ദിവസം ആരംഭിക്കുന്നു."), glyph: "kalash" },
      { id: newId(), name: L("Varavelppu", "വരവേൽപ്പ്"), when: L("9:30 am, at the gate", "രാവിലെ 9:30, ഗേറ്റിൽ"), description: L("The groom’s family is welcomed with a lamp, garlands and sandalwood — the first embrace of the two families.", "വരന്റെ കുടുംബത്തെ വിളക്കും മാലയും ചന്ദനവും കൊണ്ട് വരവേൽക്കുന്നു — രണ്ട് കുടുംബങ്ങളുടെയും ആദ്യ ആലിംഗനം."), photo: m.ceremonies?.varavelppu, glyph: "flower" },
      { id: newId(), name: L("Thalikettu", "താലികെട്ട്"), when: L("10:30 am, the muhurtham", "രാവിലെ 10:30, മുഹൂർത്തം"), description: L("As the nadaswaram rises, the groom ties the thali around the bride’s neck. The heart of the day, in a single breath.", "നാദസ്വരം ഉയരുമ്പോൾ വരൻ വധുവിന്റെ കഴുത്തിൽ താലി ചാർത്തുന്നു. ഒരൊറ്റ ശ്വാസത്തിൽ ദിവസത്തിന്റെ ഹൃദയം."), photo: m.ceremonies?.thalikettu, glyph: "knot" },
      { id: newId(), name: L("Pudava Kodukkal", "പുടവ കൊടുക്കൽ"), when: L("Just after the thali", "താലിക്ക് തൊട്ടുപിന്നാലെ"), description: L("The groom gifts the bride a kasavu pudava — a lifetime of care, folded in cream and gold.", "വരൻ വധുവിന് കസവ് പുടവ സമ്മാനിക്കുന്നു — ക്രീമിലും സ്വർണ്ണത്തിലും മടക്കിയ ജീവിതകാലത്തെ കരുതൽ."), photo: m.ceremonies?.pudava, glyph: "bowl" },
      { id: newId(), name: L("Sadhya", "സദ്യ"), when: L("12:30 pm", "ഉച്ചയ്ക്ക് 12:30"), description: L("Twenty-four dishes on a banana leaf, served by family. Ask for the payasam twice — everyone does.", "വാഴയിലയിൽ ഇരുപത്തിനാല് വിഭവങ്ങൾ, കുടുംബം വിളമ്പുന്നത്. പായസം രണ്ടാമതും ചോദിക്കൂ — എല്ലാവരും ചോദിക്കും."), glyph: "bowl" },
      { id: newId(), name: L("Griha Pravesham", "ഗൃഹപ്രവേശം"), when: L("Evening, the new home", "സന്ധ്യയ്ക്ക്, പുതിയ വീട്ടിൽ"), description: L("The bride steps into her new home carrying a lit lamp — light entering light.", "വധു തെളിഞ്ഞ വിളക്കുമായി പുതിയ വീട്ടിലേക്ക് കടക്കുന്നു — വെളിച്ചത്തിലേക്ക് വെളിച്ചം."), glyph: "lamp" },
    ],
  } as never;
  doc.whatsapp = { number: "919846000000", message: L("Hello! I’m writing about {title}.", "നമസ്കാരം! {title} സംബന്ധിച്ചാണ് ഞാൻ എഴുതുന്നത്.") };
  doc.film = { url: "", video: undefined, poster: undefined, title: {}, caption: {} };

  // section content: friendly headings, and the story reads as chapters of the timeline instead of twice
  for (const s of doc.sections) {
    if (s.type === "story") s.settings = { ...s.settings, showChapters: false };
    if (s.type === "venue" && opts.full) s.variant = "map";
    if (s.type === "travel" && opts.full) s.variant = "planner";
    if (s.type === "family") s.variant = opts.full ? "tree" : "editorial";
  }
  return doc;
}
