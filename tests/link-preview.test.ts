import { describe, expect, it } from "vitest";
import { emptyDoc } from "@/domain/doc/schema";
import { customShareMessage, linkPreview } from "@/domain/wedding/link-preview";

const base = () => {
  const d = emptyDoc();
  d.eventType = "hindu_wedding";
  d.venues = [{ id: "v1", name: { en: "The Lotus Pavilion" }, address: {}, city: {}, mapUrl: "", parking: { info: {}, mapUrl: "" }, directions: { airport: {}, railway: {}, road: {} }, landmarkMap: { pins: [] }, hotels: [], nearby: [], shuttle: { info: {}, schedule: [] }, guide: [] } as never];
  d.events = [{ id: "e1", name: { en: "Wedding" }, date: "2027-03-14", startTime: "10:00", endTime: "12:00", venueId: "v1", isMain: true, order: 0, description: {}, dressCode: {}, dressColors: [], notes: {}, mapUrl: "", visibility: { mode: "EVERYONE", groups: [] }, ritual: { title: {}, body: {} } } as never];
  return d;
};

describe("the link preview", () => {
  it("is written for you from the names, the date and the venue until you write your own", () => {
    const p = linkPreview(base(), "Divya & Rahul", null);
    expect(p.title).toBe("Divya & Rahul — Wedding Invitation");
    expect(p.description).toBe("Together with our families, we joyfully invite you to celebrate our wedding on Sunday, 14 March 2027 at The Lotus Pavilion.");
    expect(p.message).toBe("You are invited to Divya & Rahul");
  });

  it("uses exactly what was typed for the heading, the sub-heading and the message, and puts the name in {title}", () => {
    const d = base();
    d.seo.title = { en: "Divya weds Rahul" };
    d.seo.description = { en: "Join us in Kochi" };
    d.seo.shareMessage = { en: "Please come to {title}, we would love to see you!" };
    expect(linkPreview(d, "Divya & Rahul", null)).toEqual({ title: "Divya weds Rahul", description: "Join us in Kochi", message: "Please come to Divya & Rahul, we would love to see you!" });
    expect(customShareMessage(d, "Divya & Rahul")).toBe("Please come to Divya & Rahul, we would love to see you!");
  });

  it("only reports a custom message when there is one", () => {
    expect(customShareMessage(base(), "Divya & Rahul")).toBeNull();
  });
});
