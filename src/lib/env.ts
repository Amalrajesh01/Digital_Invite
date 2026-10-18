/** Central place for environment configuration. Nothing else reads process.env directly. */
export const env = {
  get appUrl() {
    return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  get appSecret() {
    const s = process.env.APP_SECRET;
    if (!s || s.length < 24) {
      if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET must be set (24+ chars) in production");
      return "dev-only-secret-do-not-use-in-production-0123456789";
    }
    return s;
  },
  get databaseUrl() {
    return process.env.DATABASE_URL || "";
  },
  get storageDriver(): "local" | "s3" {
    return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
  },
  /** Cookies are marked Secure only when the site is served over https (a plain-http IP would drop them). */
  get secureCookies() {
    return this.appUrl.startsWith("https://");
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  s3: {
    get endpoint() { return process.env.S3_ENDPOINT || ""; },
    get region() { return process.env.S3_REGION || "auto"; },
    get bucket() { return process.env.S3_BUCKET || ""; },
    get accessKeyId() { return process.env.S3_ACCESS_KEY_ID || ""; },
    get secretAccessKey() { return process.env.S3_SECRET_ACCESS_KEY || ""; },
    get publicBaseUrl() { return (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, ""); },
  },
  get resendKey() {
    return process.env.RESEND_API_KEY || "";
  },
  /**
   * The Google "service account" key used to write the daily sheets: the JSON file Google gives you, pasted as one line or as base64.
   * Null until it is set; the Daily sheet tab then explains what to do.
   */
  get googleServiceAccount(): { client_email: string; private_key: string } | null {
    const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
    if (!raw) return null;
    try {
      const j = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")) as { client_email?: string; private_key?: string };
      return j.client_email && j.private_key ? { client_email: j.client_email, private_key: j.private_key.replace(/\\n/g, "\n") } : null;
    } catch {
      return null;
    }
  },
  /** Shared secret for /api/cron (Vercel Cron sends it as a Bearer token). */
  get cronSecret() {
    return process.env.CRON_SECRET || "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "StackBridge Invites <invites@example.com>";
  },
};
