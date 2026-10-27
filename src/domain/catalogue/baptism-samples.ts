/**
 * The shop-window facts of each baptism template's sample invitation: who it is for (fictional), when, and where. The full sample
 * (`scripts/demo/baptism.ts`) must agree with this — it throws if a name, date or place differs — so the gallery card and the
 * invitation behind it can never disagree.
 *
 * The photographs of each sample — the baby that opens it, its gallery, its family — are chosen in `src/domain/baptism/story.ts`.
 */
export interface BaptismSample {
  child: string;
  /** ISO date of the service (a Sunday in 2027). */
  date: string;
  church: string;
  city: string;
  denomination: string;
}

export const BAPTISM_SAMPLES: Record<string, BaptismSample> = {
  "heavenly-grace": { child: "Anya Mariam", date: "2027-01-24", church: "Holy Family Church", city: "Kochi", denomination: "Syro-Malabar Catholic" },
  "blessing-from-above": { child: "Nathan Varghese", date: "2027-02-07", church: "St. Gregorios Orthodox Church", city: "Kottayam", denomination: "Malankara Orthodox" },
  "sacred-waters": { child: "Ezra Samuel", date: "2027-02-21", church: "CSI Immanuel Church", city: "Chennai", denomination: "Church of South India" },
  "kerala-christian-heritage": { child: "Maria Elizabeth", date: "2027-03-07", church: "St. Thomas Mar Thoma Church", city: "Thiruvalla", denomination: "Mar Thoma" },
  "little-prince-of-grace": { child: "Aaron Joseph", date: "2027-03-21", church: "Church of the Good Shepherd", city: "Pune", denomination: "Latin Catholic" },
  "little-princess-of-heaven": { child: "Hannah Grace", date: "2027-04-04", church: "Grace Methodist Church", city: "Bengaluru", denomination: "Methodist" },
  "generations-of-faith": { child: "Isaac George", date: "2027-04-18", church: "St. Mary’s Jacobite Church", city: "Pala", denomination: "Jacobite Syrian" },
  "church-of-light": { child: "Elena Rose", date: "2027-05-02", church: "Church of Our Lady of Lights", city: "Mumbai", denomination: "Roman Catholic" },
  "white-dove-blessing": { child: "Gabriel Joseph", date: "2027-05-16", church: "Church of the Holy Spirit", city: "Panaji", denomination: "Goan Catholic" },
  "the-open-bible": { child: "Daniel Abraham", date: "2027-05-30", church: "Grace Community Church", city: "Hyderabad", denomination: "Church of South India" },
  "floral-grace": { child: "Liya Maria", date: "2027-06-13", church: "St. Mary’s Chapel", city: "Ernakulam", denomination: "Syro-Malabar Catholic" },
  "golden-morning": { child: "Ethan Christopher", date: "2027-06-27", church: "Hillview Chapel", city: "Munnar", denomination: "Church of South India" },
  "jesus-and-the-little-child": { child: "Immanuel David", date: "2027-07-11", church: "Holy Cross Church", city: "Thrissur", denomination: "Malankara Orthodox" },
  "garden-of-blessings": { child: "Naomi Ann", date: "2027-07-25", church: "St. Joseph’s Church", city: "Kozhikode", denomination: "Latin Catholic" },
  "royal-catholic-elegance": { child: "Sebastian Xavier", date: "2027-08-08", church: "Cathedral of the Holy Name", city: "Mangaluru", denomination: "Latin Catholic" },
  "modern-minimal-grace": { child: "Noah Philip", date: "2027-08-22", church: "St. Luke’s Church", city: "New Delhi", denomination: "Church of North India" },
  "the-little-blessing": { child: "Ivy Joseph", date: "2027-09-05", church: "Chapel of the Holy Child", city: "Thiruvananthapuram", denomination: "Latin Catholic" },
  "family-in-faith": { child: "Josiah Peter", date: "2027-09-19", church: "Church of the Good Shepherd", city: "Kolkata", denomination: "Baptist Union" },
  "celestial-promise": { child: "Eden Abigail", date: "2027-10-03", church: "CSI All Saints Church", city: "Coimbatore", denomination: "Church of South India" },
  "a-new-beginning": { child: "Elias Abraham", date: "2027-10-17", church: "St. George’s Church", city: "Pala", denomination: "Syro-Malabar Catholic" },
  "candle-of-faith": { child: "Caleb Mathew", date: "2027-10-31", church: "St. Andrew’s Church", city: "Bengaluru", denomination: "Church of North India" },
  "white-roses": { child: "Rebecca Rose", date: "2027-11-14", church: "St. Michael’s Church", city: "Alappuzha", denomination: "Latin Catholic" },
  "little-miracle": { child: "Miriam Joy", date: "2027-11-28", church: "Holy Family Church", city: "Visakhapatnam", denomination: "Roman Catholic" },
  "golden-cross": { child: "Matthew Peter", date: "2027-12-12", church: "Our Lady of Grace Church", city: "Vasai", denomination: "East Indian Catholic" },
  "cloud-nine": { child: "Luke Emmanuel", date: "2027-12-26", church: "Holy Spirit Church", city: "Shillong", denomination: "Roman Catholic" },
};
