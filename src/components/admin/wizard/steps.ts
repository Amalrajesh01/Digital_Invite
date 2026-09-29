export const STEPS = [
  { key: "package", title: "Package", blurb: "Choose what this couple receives. Features, dashboards and limits follow from this choice." },
  { key: "couple", title: "Couple", blurb: "Names, wedding date, the wedding link and the language of the invitation." },
  { key: "events", title: "Events", blurb: "Every ceremony and celebration — with time, place, dress code and rituals." },
  { key: "family", title: "Family", blurb: "The families and the wedding party." },
  { key: "story", title: "Story", blurb: "How they met and the moments that led here." },
  { key: "venue", title: "Venue", blurb: "Where to go, where to park, where to stay." },
  { key: "media", title: "Media", blurb: "Photographs, albums and videos." },
  { key: "music", title: "Music", blurb: "The song guests hear when they open the invitation." },
  { key: "template", title: "Template", blurb: "How the invitation opens and how it is laid out." },
  { key: "theme", title: "Theme", blurb: "Colours, typefaces and feel." },
  { key: "features", title: "Features", blurb: "What this wedding includes — and any favours you want to grant." },
  { key: "guests", title: "Guests", blurb: "How guests reply, and the guest list." },
  { key: "generate", title: "Generate", blurb: "Assemble the invitation and check that nothing is missing." },
  { key: "edit", title: "Edit", blurb: "Fine-tune sections, layouts and copy in the visual editor." },
  { key: "preview", title: "Preview", blurb: "See it on phone, tablet and desktop — in every stage of the wedding." },
  { key: "publish", title: "Publish", blurb: "Go live, share the link and give the couple their dashboard." },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];
export const stepIndex = (k: string) => STEPS.findIndex((s) => s.key === k);
export const isStepKey = (k: string): k is StepKey => STEPS.some((s) => s.key === k);
