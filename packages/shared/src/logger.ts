/**
 * Shared structured logger (pino) with the mandatory redaction list (KP-ENG-11 §2, KP-HBK-17).
 * Secrets, personal data and hole cards must never reach logs (CLAUDE.md non-negotiables 5 and 8).
 */
import { pino, type DestinationStream, type Logger, type LoggerOptions } from "pino";

export type { Logger } from "pino";

/** Field names removed from every log line, at any of the listed depths. */
export const REDACTED_KEYS = [
  "password",
  "newPassword",
  "otp",
  "pin",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "secret",
  "apiKey",
  "authorization",
  "cookie",
  "set-cookie",
  "phone",
  "msisdn",
  "phoneNumber",
  "instrument",
  "accountNumber",
  "cardNumber",
  "iban",
  "hole",
  "holeCards",
  "cards",
  "deck",
  "seed",
] as const;

function redactPaths(): string[] {
  const paths: string[] = [];
  for (const key of REDACTED_KEYS) {
    const k = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `["${key}"]`;
    const dot = k.startsWith("[") ? "" : ".";
    paths.push(k, `*${dot}${k}`, `*.*${dot}${k}`, `req.headers${dot}${k}`);
  }
  // OTP request bodies use `code`; error objects also carry `code`, so only body.code is redacted.
  paths.push("body.code", "*.body.code");
  return paths;
}

export const REDACT_CENSOR = "[REDACTED]";

export interface CreateLoggerOptions {
  service: string;
  level?: string;
  mode?: string;
  /** Test hook: write to a custom stream instead of stdout. */
  destination?: DestinationStream;
}

export function createLogger(opts: CreateLoggerOptions): Logger {
  const options: LoggerOptions = {
    level: opts.level ?? "info",
    base: { service: opts.service, ...(opts.mode ? { mode: opts.mode } : {}) },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: redactPaths(), censor: REDACT_CENSOR },
    formatters: { level: (label) => ({ level: label }) },
  };
  return opts.destination ? pino(options, opts.destination) : pino(options);
}
