/**
 * The shop-window facts of each cinematic template's sample invitation: who it is for (fictional), when, and where. The full sample
 * (`scripts/demo/cinematic.ts`) must agree with this — it throws if a name, date or place differs — so the gallery card and the
 * invitation behind it can never disagree.
 */
export const CINEMATIC_SAMPLE_FACTS: Record<string, [names: string, date: string, venue: string, city: string]> = {
  "love-story": ["Eleanor & Julian", "2027-05-22", "Château de la Rive", "Amboise"],
  "royal-heritage-wedding": ["Isabelle & Rafael", "2027-02-13", "Palácio da Quinta", "Sintra"],
  "fashion-editorial": ["Camille & Dominic", "2027-04-10", "The Glasshouse", "New York"],
  "enchanted-garden": ["Florence & Theo", "2027-06-05", "Willowmere Gardens", "Cotswolds"],
  "destination-film": ["Nora & Henrik", "2027-09-18", "Villa Lago", "Lake Como"],
  "old-money-romance": ["Charlotte & Edward", "2027-10-02", "Aldersey House", "Oxfordshire"],
  "vintage-film-romance": ["Beatrice & Walter", "2027-03-27", "St Anselm's Chapel & the Old Rectory", "Bath"],
  "celestial-love-story": ["Stella & Aaron", "2027-08-14", "Observatory Hill", "Flagstaff"],
  "french-romantic-escape": ["Amélie & Lucas", "2027-06-26", "Maison des Roses", "Aix-en-Provence"],
  "modern-minimalist": ["Maya & Noah", "2027-05-01", "The White Room", "Berlin"],
  "dreamlike-fairytale": ["Aurelia & Sebastian", "2027-04-24", "The Orangery at Lavender Court", "Surrey"],
  "black-tie-gala": ["Vivienne & Adrian", "2027-12-11", "The Grand Ballroom, Hotel Aurelia", "Chicago"],
  "modern-royal-romance": ["Victoria & Alexander", "2027-01-30", "Castello di Verde", "Siena"],
  "cinematic-proposal": ["Hannah & Elias", "2027-07-10", "The Lighthouse Terrace", "Cornwall"],
  "golden-hour-romance": ["Clara & Matteo", "2027-08-28", "Meadowlark Farm", "Napa"],
  "noir-romance": ["Margot & Felix", "2027-11-06", "The Roxy Hall", "Montréal"],
  "coastal-romance": ["Marina & Leo", "2027-07-24", "Sandpiper Cove", "Varkala"],
  "architectural-wedding": ["Iris & Anton", "2027-09-04", "Pavilion on the Ridge", "Valais"],
  "floral-couture": ["Rosalind & Jasper", "2027-05-15", "The Conservatory at Hartwell Park", "Kent"],
  "animated-storybook": ["Wren & Oliver", "2027-10-23", "Little Tern Library & Barn", "Vermont"],
  "documentary-wedding": ["Josie & Sam", "2027-09-25", "Hollow Creek Farm", "Asheville"],
  "romantic-watercolour": ["Lily & Arthur", "2027-04-17", "The Painter's House", "Giverny"],
  "luxury-destination": ["Valentina & Gabriel", "2027-11-20", "Hotel Marinha", "Lisbon"],
  "epic-premiere": ["Scarlett & Max", "2027-12-04", "The Majestic Theatre", "Los Angeles"],
  "infinite-love": ["Nova & Kai", "2027-08-07", "Orbit Hall", "Reykjavík"],
};
