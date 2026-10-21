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
  /** Cloudinary hosts invitation photographs. Unset = every photograph stays on the STORAGE_DRIVER store (development, tests). */
  cloudinary: {
    get cloudName() { return process.env.CLOUDINARY_CLOUD_NAME || ""; },
    get apiKey() { return process.env.CLOUDINARY_API_KEY || ""; },
    get apiSecret() { return process.env.CLOUDINARY_API_SECRET || ""; },
    get configured() { return !!(this.cloudName && this.apiKey && this.apiSecret); },
    /** Top-level folder (public-id prefix) for everything this app uploads, so one account can serve several products. */
    get folder() { return (process.env.CLOUDINARY_FOLDER || "sbl-invites").replace(/^\/+|\/+$/g, "").toLowerCase(); },
    /** Extra names (plain text, comma-separated) whose invitations the migration must skip, on top of the built-in list. */
    get excludedNames() { return (process.env.CLOUDINARY_EXCLUDE_NAMES || "").split(",").map((s) => s.trim()).filter(Boolean); },
    /** Invitations a person has said must never be moved by a tool: comma-separated wedding ids. */
    get excludedWeddingIds() { return (process.env.CLOUDINARY_EXCLUDE_WEDDING_IDS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean); },
  },
  get resendKey() {
    return process.env.RESEND_API_KEY || "";
  },
  /** Shared secret for /api/cron (Vercel Cron sends it as a Bearer token). */
  get cronSecret() {
    return process.env.CRON_SECRET || "";
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "StackBridge Invites <invites@example.com>";
  },
};
