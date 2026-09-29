"use client";
import { useEffect, useRef, useState } from "react";
import { Circle, Mic, RotateCcw, Square, Video } from "lucide-react";
import { useInvitation } from "./context";

const pickMime = (kind: "VIDEO" | "VOICE") => {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = kind === "VIDEO" ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"] : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
};

export interface Recorded {
  file: File;
  durationSec: number;
}

/**
 * In-browser recorder for video and voice wishes. Needs the guest's permission (camera/mic);
 * if unavailable it explains and the parent offers a plain file upload instead.
 */
export function Recorder({ kind, onChange, maxSec }: { kind: "VIDEO" | "VOICE"; onChange: (r: Recorded | null) => void; maxSec?: number }) {
  const { t } = useInvitation();
  const limit = maxSec ?? (kind === "VIDEO" ? 60 : 90);
  const [state, setState] = useState<"idle" | "ready" | "recording" | "done">("idle");
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
  }, []);
  const [denied, setDenied] = useState(false);
  const [secs, setSecs] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const liveRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = () => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  };
  useEffect(() => () => {
    stopStream();
    if (timer.current) clearInterval(timer.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    setDenied(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia(kind === "VIDEO" ? { video: { facingMode: "user", width: { ideal: 720 } }, audio: true } : { audio: true });
      stream.current = s;
      if (liveRef.current) {
        liveRef.current.srcObject = s;
        void liveRef.current.play();
      }
      setState("ready");
    } catch {
      setDenied(true);
    }
  };

  const begin = () => {
    if (!stream.current) return;
    const mime = pickMime(kind);
    const r = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      const type = r.mimeType || mime || (kind === "VIDEO" ? "video/webm" : "audio/webm");
      const blob = new Blob(chunks.current, { type });
      const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `${kind.toLowerCase()}-wish.${ext}`, { type });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setState("done");
      stopStream();
      onChange({ file, durationSec: secsRef.current });
    };
    rec.current = r;
    r.start(500);
    secsRef.current = 0;
    setSecs(0);
    setState("recording");
    timer.current = setInterval(() => {
      secsRef.current += 1;
      setSecs(secsRef.current);
      if (secsRef.current >= limit) stop();
    }, 1000);
  };
  const secsRef = useRef(0);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  };
  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSecs(0);
    onChange(null);
    setState("idle");
  };

  if (!supported || denied) return <p className="inv-muted text-[0.95rem]">{t("wishes.noMic")}</p>;
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div className="space-y-3">
      {kind === "VIDEO" && state !== "done" && state !== "idle" && <video ref={liveRef} muted playsInline className="aspect-[3/4] w-full max-w-xs bg-black object-cover" style={{ borderRadius: "var(--r)", transform: "scaleX(-1)" }} />}
      {state === "done" && previewUrl && (kind === "VIDEO" ? <video src={previewUrl} controls playsInline className="aspect-[3/4] w-full max-w-xs bg-black object-cover" style={{ borderRadius: "var(--r)" }} /> : <audio src={previewUrl} controls className="w-full" />)}
      <div className="flex flex-wrap items-center gap-3">
        {state === "idle" && <button type="button" className="inv-btn inv-btn-ghost" onClick={start}>{kind === "VIDEO" ? <Video className="size-4" /> : <Mic className="size-4" />}{kind === "VIDEO" ? t("wishes.recordVideo") : t("wishes.recordVoice")}</button>}
        {state === "ready" && <button type="button" className="inv-btn" onClick={begin}><Circle className="size-4 fill-current text-red-500" /> REC</button>}
        {state === "recording" && (<><button type="button" className="inv-btn" onClick={stop}><Square className="size-4 fill-current" /> {t("wishes.stop")}</button><span className="inv-num flex items-center gap-2 text-lg"><span className="size-2.5 animate-pulse rounded-full bg-red-500" />{mm}<span className="inv-muted text-sm">/ {Math.floor(limit / 60)}:{String(limit % 60).padStart(2, "0")}</span></span></>)}
        {state === "done" && <button type="button" className="inv-btn inv-btn-ghost inv-btn-sm" onClick={retake}><RotateCcw className="size-3.5" /> {t("wishes.retake")}</button>}
      </div>
    </div>
  );
}
