/**
 * The verses a baptism invitation can quote. Every entry is the exact wording of one translation — the King James Version, which is in
 * the public domain — checked word for word against an independent source on the date below (`npm run baptism:scripture` repeats the
 * check). Nothing here is paraphrased: where only part of a verse is quoted, `excerpt` says so and the quoted words are a contiguous
 * stretch of the verse.
 *
 * A family can always type a verse of their own (or a different translation) into the invitation; this list only saves them looking
 * one up, and what they type is never altered or "verified" by us — the invitation shows the reference they give.
 */
export const TRANSLATION = { id: "kjv", name: "King James Version", abbr: "KJV", licence: "Public domain" } as const;

export const VERIFIED = { source: "https://bible-api.com/ (translation=kjv)", on: "2026-10-26" } as const;

export interface Verse {
  id: string;
  /** "Psalm 127:3" — as it is printed on the invitation. */
  ref: string;
  /** The words, as in the translation. */
  text: string;
  /** Only part of the verse is quoted. */
  excerpt?: boolean;
  themes: string[];
}

export const VERSES: Verse[] = [
  { id: "eph-2-8", ref: "Ephesians 2:8", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:", themes: ["grace","faith"] },
  { id: "num-6-24", ref: "Numbers 6:24–26", text: "The LORD bless thee, and keep thee: The LORD make his face shine upon thee, and be gracious unto thee: The LORD lift up his countenance upon thee, and give thee peace.", themes: ["blessing"] },
  { id: "rom-6-4", ref: "Romans 6:4", text: "Therefore we are buried with him by baptism into death: that like as Christ was raised up from the dead by the glory of the Father, even so we also should walk in newness of life.", themes: ["baptism","new life"] },
  { id: "ps-127-3", ref: "Psalm 127:3", text: "Lo, children are an heritage of the LORD: and the fruit of the womb is his reward.", themes: ["child","heritage"] },
  { id: "1sam-1-27", ref: "1 Samuel 1:27", text: "For this child I prayed; and the LORD hath given me my petition which I asked of him:", themes: ["prayer answered","child"] },
  { id: "ps-139-14", ref: "Psalm 139:14", text: "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.", themes: ["child","creation"] },
  { id: "ps-145-4", ref: "Psalm 145:4", text: "One generation shall praise thy works to another, and shall declare thy mighty acts.", themes: ["generations","family"] },
  { id: "john-8-12", ref: "John 8:12", text: "Then spake Jesus again unto them, saying, I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.", themes: ["light"] },
  { id: "matt-3-16", ref: "Matthew 3:16", text: "And Jesus, when he was baptized, went up straightway out of the water: and, lo, the heavens were opened unto him, and he saw the Spirit of God descending like a dove, and lighting upon him:", themes: ["baptism","dove"] },
  { id: "ps-119-105", ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", themes: ["word","light"] },
  { id: "matt-6-28", ref: "Matthew 6:28", text: "And why take ye thought for raiment? Consider the lilies of the field, how they grow; they toil not, neither do they spin:", themes: ["lilies","flowers"] },
  { id: "lam-3-22", ref: "Lamentations 3:22–23", text: "It is of the LORD’S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", themes: ["morning","mercy"] },
  { id: "matt-19-14", ref: "Matthew 19:14", text: "But Jesus said, Suffer little children, and forbid them not, to come unto me: for of such is the kingdom of heaven.", themes: ["child","kingdom"] },
  { id: "ps-1-3", ref: "Psalm 1:3", text: "And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper.", themes: ["growth","garden"] },
  { id: "matt-28-19", ref: "Matthew 28:19", text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:", themes: ["baptism","name"] },
  { id: "isa-43-1", ref: "Isaiah 43:1", text: "Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.", excerpt: true, themes: ["named","called"] },
  { id: "mark-10-16", ref: "Mark 10:16", text: "And he took them up in his arms, put his hands upon them, and blessed them.", themes: ["blessing","child"] },
  { id: "josh-24-15", ref: "Joshua 24:15", text: "but as for me and my house, we will serve the LORD.", excerpt: true, themes: ["family","faith"] },
  { id: "gen-9-13", ref: "Genesis 9:13", text: "I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.", themes: ["promise","covenant"] },
  { id: "2cor-5-17", ref: "2 Corinthians 5:17", text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.", themes: ["new beginning"] },
  { id: "prov-22-6", ref: "Proverbs 22:6", text: "Train up a child in the way he should go: and when he is old, he will not depart from it.", themes: ["upbringing","family"] },
  { id: "jer-1-5", ref: "Jeremiah 1:5", text: "Before I formed thee in the belly I knew thee", excerpt: true, themes: ["known by God"] },
];

const BY_ID = new Map(VERSES.map((v) => [v.id, v]));
export const verseById = (id: string): Verse | undefined => BY_ID.get(id);

/** The words as they are set on the invitation: a closing colon becomes a full stop, and a quotation that starts mid-sentence opens with an ellipsis. */
export const verseText = (v: Verse): string => {
  const t = v.text.replace(/:$/, ".");
  const closed = /[.!?]$/.test(t) ? t : `${t}.`;
  return /^[a-z]/.test(closed) ? `…${closed}` : closed;
};
/** "Psalm 127:3 · KJV" */
export const verseSource = (v: Verse): string => `${v.ref} · ${TRANSLATION.abbr}`;
