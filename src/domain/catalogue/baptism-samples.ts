/**
 * The shop-window facts of each baptism template's sample invitation: who it is for (fictional), when, and where. The full sample
 * (`scripts/demo/baptism.ts`) must agree with this — it throws if a name, date or place differs — so the gallery card and the
 * invitation behind it can never disagree.
 *
 * `photo` is the one bundled photograph the sample uses as its main picture, when there is a genuinely relevant one (a church, a window,
 * a flower, a garden, a baby’s hand). Templates without one are shown with their drawn scene alone: see `src/domain/baptism/images.ts`.
 */
export interface BaptismSample {
  child: string;
  /** ISO date of the service (a Sunday in 2027). */
  date: string;
  church: string;
  city: string;
  denomination: string;
  /** A bundled stock photograph (assets/stock) used as the main picture of the sample, if a relevant one exists. */
  photo?: string;
}

export const BAPTISM_SAMPLES: Record<string, BaptismSample> = {
  "heavenly-grace": { child: "Anya Mariam", date: "2027-01-24", church: "Holy Family Church", city: "Kochi", denomination: "Syro-Malabar Catholic" },
  "blessing-from-above": { child: "Nathan Varghese", date: "2027-02-07", church: "St. Gregorios Orthodox Church", city: "Kottayam", denomination: "Malankara Orthodox" },
  "sacred-waters": { child: "Ezra Samuel", date: "2027-02-21", church: "CSI Immanuel Church", city: "Chennai", denomination: "Church of South India" },
  "kerala-christian-heritage": { child: "Maria Elizabeth", date: "2027-03-07", church: "St. Thomas Mar Thoma Church", city: "Thiruvalla", denomination: "Mar Thoma", photo: "ouh94xUqOHk" },
  "little-prince-of-grace": { child: "Aaron Joseph", date: "2027-03-21", church: "Church of the Good Shepherd", city: "Pune", denomination: "Latin Catholic" },
  "little-princess-of-heaven": { child: "Hannah Grace", date: "2027-04-04", church: "Grace Methodist Church", city: "Bengaluru", denomination: "Methodist" },
  "generations-of-faith": { child: "Isaac George", date: "2027-04-18", church: "St. Mary’s Jacobite Church", city: "Pala", denomination: "Jacobite Syrian", photo: "y0OAmd_COUM" },
  "church-of-light": { child: "Elena Rose", date: "2027-05-02", church: "Church of Our Lady of Lights", city: "Mumbai", denomination: "Roman Catholic", photo: "G5a1RNy55pw" },
  "white-dove-blessing": { child: "Gabriel Joseph", date: "2027-05-16", church: "Church of the Holy Spirit", city: "Panaji", denomination: "Goan Catholic" },
  "the-open-bible": { child: "Daniel Abraham", date: "2027-05-30", church: "Grace Community Church", city: "Hyderabad", denomination: "Church of South India" },
  "floral-grace": { child: "Liya Maria", date: "2027-06-13", church: "St. Mary’s Chapel", city: "Ernakulam", denomination: "Syro-Malabar Catholic", photo: "aauHMskRPa8" },
  "golden-morning": { child: "Ethan Christopher", date: "2027-06-27", church: "Hillview Chapel", city: "Munnar", denomination: "Church of South India", photo: "R9tPheZuGnA" },
  "jesus-and-the-little-child": { child: "Immanuel David", date: "2027-07-11", church: "Holy Cross Church", city: "Thrissur", denomination: "Malankara Orthodox" },
  "garden-of-blessings": { child: "Naomi Ann", date: "2027-07-25", church: "St. Joseph’s Church", city: "Kozhikode", denomination: "Latin Catholic", photo: "4KkTFccuZ0M" },
  "royal-catholic-elegance": { child: "Sebastian Xavier", date: "2027-08-08", church: "Cathedral of the Holy Name", city: "Mangaluru", denomination: "Latin Catholic", photo: "QPL_171Kf5Q" },
  "modern-minimal-grace": { child: "Noah Philip", date: "2027-08-22", church: "St. Luke’s Church", city: "New Delhi", denomination: "Church of North India", photo: "zx0Xt9u1ekw" },
  "the-little-blessing": { child: "Ivy Joseph", date: "2027-09-05", church: "Chapel of the Holy Child", city: "Thiruvananthapuram", denomination: "Latin Catholic", photo: "ybvTwLSBtSY" },
  "family-in-faith": { child: "Josiah Peter", date: "2027-09-19", church: "Church of the Good Shepherd", city: "Kolkata", denomination: "Baptist Union", photo: "ZLmLOclfeE4" },
  "celestial-promise": { child: "Eden Abigail", date: "2027-10-03", church: "CSI All Saints Church", city: "Coimbatore", denomination: "Church of South India", photo: "3pW91fGAKiE" },
  "a-new-beginning": { child: "Elias Abraham", date: "2027-10-17", church: "St. George’s Church", city: "Pala", denomination: "Syro-Malabar Catholic", photo: "UpNwL3hTcRg" },
};
