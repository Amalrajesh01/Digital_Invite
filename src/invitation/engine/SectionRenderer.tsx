"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { SectionConfig } from "@/domain/doc/schema";
import type { SectionType } from "@/domain/doc/constants";
import { useInvitation } from "./context";
import { SECTION_META } from "@/domain/doc/sections";

/**
 * SectionRenderer(type, configuration): the one place that maps a section type to a component.
 * Every section is code-split (`next/dynamic`), so an Essential invitation never downloads the
 * JavaScript of Luxury-only sections such as games, QR pass or the live photo wall.
 */
const REGISTRY: Record<SectionType, React.ComponentType<{ section: SectionConfig }>> = {
  hero: dynamic(() => import("../sections/HeroSection")),
  countdown: dynamic(() => import("../sections/CountdownSection")),
  couple: dynamic(() => import("../sections/CoupleSection")),
  story: dynamic(() => import("../sections/StorySection")),
  timeline: dynamic(() => import("../sections/TimelineSection")),
  family: dynamic(() => import("../sections/FamilySection")),
  events: dynamic(() => import("../sections/EventsSection")),
  ceremonies: dynamic(() => import("../sections/CeremoniesSection")),
  film: dynamic(() => import("../sections/FilmSection")),
  venue: dynamic(() => import("../sections/VenueSection")),
  travel: dynamic(() => import("../sections/TravelSection")),
  gallery: dynamic(() => import("../sections/GallerySection")),
  dresscode: dynamic(() => import("../sections/SmallSections").then((m) => m.DressCodeSection)),
  menu: dynamic(() => import("../sections/SmallSections").then((m) => m.MenuSection)),
  rsvp: dynamic(() => import("../sections/RsvpSection")),
  guestbook: dynamic(() => import("../sections/GuestbookSection")),
  music: dynamic(() => import("../sections/SmallSections").then((m) => m.MusicSection)),
  quiz: dynamic(() => import("../sections/GamesSection").then((m) => m.QuizSection)),
  games: dynamic(() => import("../sections/GamesSection").then((m) => m.GamesSection)),
  scavenger: dynamic(() => import("../sections/GamesSection").then((m) => m.ScavengerSection)),
  photowall: dynamic(() => import("../sections/LiveSections").then((m) => m.PhotoWallSection)),
  guestupload: dynamic(() => import("../sections/ParticipateSections").then((m) => m.GuestUploadSection)),
  wishes: dynamic(() => import("../sections/ParticipateSections").then((m) => m.WishesSection)),
  qrpass: dynamic(() => import("../sections/LiveSections").then((m) => m.QrPassSection)),
  checkin: dynamic(() => import("../sections/LiveSections").then((m) => m.CheckinSection)),
  livesched: dynamic(() => import("../sections/LiveSections").then((m) => m.LiveScheduleSection)),
  liveupdate: dynamic(() => import("../sections/LiveSections").then((m) => m.LiveUpdatesSection)),
  livestream: dynamic(() => import("../sections/SmallSections").then((m) => m.LivestreamSection)),
  timecapsule: dynamic(() => import("../sections/ParticipateSections").then((m) => m.TimeCapsuleSection)),
  memory: dynamic(() => import("../sections/MemorySections").then((m) => m.MemorySection)),
  anniversary: dynamic(() => import("../sections/MemorySections").then((m) => m.AnniversarySection)),
  thankyou: dynamic(() => import("../sections/SmallSections").then((m) => m.ThankYouSection)),
  contact: dynamic(() => import("../sections/SmallSections").then((m) => m.ContactSection)),
  about: dynamic(() => import("../sections/OccasionSections").then((m) => m.AboutSection)),
  tribute: dynamic(() => import("../sections/OccasionSections").then((m) => m.TributeSection)),
  speakers: dynamic(() => import("../sections/OccasionSections").then((m) => m.SpeakersSection)),
  agenda: dynamic(() => import("../sections/OccasionSections").then((m) => m.AgendaSection)),
  sponsors: dynamic(() => import("../sections/OccasionSections").then((m) => m.SponsorsSection)),
  message: dynamic(() => import("../sections/OccasionSections").then((m) => m.MessageSection)),
  people: dynamic(() => import("../sections/OccasionSections").then((m) => m.PeopleSection)),
  prayer: dynamic(() => import("../sections/OccasionSections").then((m) => m.PrayerSection)),
};

export function getVisitorId(): string {
  try {
    let v = localStorage.getItem("inv-vid");
    if (!v) {
      v = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      localStorage.setItem("inv-vid", v);
    }
    return v;
  } catch {
    return "anon" + Math.random().toString(36).slice(2, 12);
  }
}

function useSectionTracking(type: string) {
  const { post, isPreview } = useInvitation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || isPreview || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        void post("/track", { visitorId: getVisitorId(), type: "section", section: type }).catch(() => undefined);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [type, post, isPreview]);
  return ref;
}

export function SectionRenderer({ section }: { section: SectionConfig }) {
  const ref = useSectionTracking(section.type);
  const Comp = REGISTRY[section.type];
  if (!Comp || !SECTION_META[section.type]) return null;
  return (
    <div ref={ref} data-section-id={section.id} data-section-type={section.type}>
      <Comp section={section} />
    </div>
  );
}
