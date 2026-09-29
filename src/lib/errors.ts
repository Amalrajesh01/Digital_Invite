/**
 * Typed application errors. Services throw these; routes/actions translate them into friendly,
 * non-leaky responses. Raw stack traces and database errors never reach the user.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "FEATURE_UNAVAILABLE"
  | "LOCKED"
  | "EXPIRED"
  | "UPLOAD_REJECTED"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  FEATURE_UNAVAILABLE: 403,
  LOCKED: 423,
  EXPIRED: 410,
  UPLOAD_REJECTED: 415,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;
  constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.fields = fields;
  }
}

export const unauthorized = (m = "Please sign in to continue.") => new AppError("UNAUTHORIZED", m);
export const forbidden = (m = "You don't have access to this.") => new AppError("FORBIDDEN", m);
export const notFound = (m = "We couldn't find that.") => new AppError("NOT_FOUND", m);
export const invalid = (m: string, fields?: Record<string, string>) => new AppError("VALIDATION", m, fields);
export const conflict = (m: string) => new AppError("CONFLICT", m);
export const locked = (m: string) => new AppError("LOCKED", m);
export const expired = (m: string) => new AppError("EXPIRED", m);
export const rateLimited = (m = "Too many attempts. Please wait a moment and try again.") => new AppError("RATE_LIMITED", m);
export const uploadRejected = (m: string) => new AppError("UPLOAD_REJECTED", m);

export interface UserFacingError {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
}

/** Converts anything thrown into something safe to show. Unknown errors become a generic message. */
export function toUserError(e: unknown): UserFacingError {
  if (e instanceof AppError) return { code: e.code, message: e.message, fields: e.fields };
  if (e && typeof e === "object" && (e as { name?: string }).name === "FeatureNotAvailableError") {
    return { code: "FEATURE_UNAVAILABLE", message: "This feature isn't included in the wedding's package." };
  }
  if (e && typeof e === "object" && (e as { name?: string }).name === "ZodError") {
    const issues = (e as { issues?: { path: (string | number)[]; message: string }[] }).issues ?? [];
    const fields: Record<string, string> = {};
    for (const i of issues) fields[i.path.join(".")] ||= i.message;
    return { code: "VALIDATION", message: "Please check the highlighted fields.", fields };
  }
  return { code: "INTERNAL", message: "Something went wrong on our side. Please try again in a moment." };
}

export type ActionResult<T = undefined> = ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T })) | { ok: false; error: UserFacingError };
