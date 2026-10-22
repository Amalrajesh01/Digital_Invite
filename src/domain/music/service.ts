import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "@/lib/errors";
import type { Actor } from "@/domain/auth/access";
import { listTracks, saveTrack, uploadAsUser } from "@/domain/media/service";
import { attribution, libraryTrack } from "./library";

const DIR = path.join(process.cwd(), "assets", "music");

/**
 * Puts a library track into an invitation: the file is copied into the invitation's own media as an ordinary audio upload
 * (so it plays, is cleaned up and is moderated exactly like a customer's song) and recorded as one of its songs, with the
 * licence's credit as the “artist”. Picking the same track again changes nothing except, when asked, which song is the main one.
 */
export async function addLibraryTrack(actor: Actor | null, weddingId: string, trackId: string, opts: { primary?: boolean } = {}) {
  const t = libraryTrack(trackId);
  if (!t) throw notFound();
  const credit = attribution(t);
  const have = (await listTracks(actor, weddingId)).find((x) => x.title === t.title && x.artist === credit);
  if (have) return opts.primary && !have.isPrimary ? saveTrack(actor, weddingId, { id: have.id, title: have.title, artist: have.artist, isPrimary: true, inPlaylist: have.inPlaylist }) : have;
  const asset = await uploadAsUser(actor, weddingId, { buffer: await readFile(path.join(DIR, t.file)), filename: t.file }, { category: "MUSIC", allow: ["AUDIO"], durationSec: t.seconds, title: t.title });
  return saveTrack(actor, weddingId, { assetId: asset.id, title: t.title, artist: credit, isPrimary: opts.primary });
}
