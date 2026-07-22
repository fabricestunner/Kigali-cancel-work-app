import * as ed from "@noble/ed25519";

/**
 * QR token format, per docs/superpowers/specs/2026-07-21-ticketing-design.md
 * section 3:
 *
 *   KCW1.<base64url(payload)>.<base64url(signature)>
 *
 * The signature is Ed25519 over the exact base64url payload *string* — never
 * over a re-serialized copy of the decoded JSON, since re-serializing can
 * reorder keys and silently invalidate every signature. The full token is
 * ~180 characters; that is expected and must not be "optimised" down by
 * dropping fields.
 */
const TOKEN_PREFIX = "KCW1";

export interface TicketPayload {
  tid: number;
  oid: number;
  sz: string;
  ev: string;
  iat: number;
}

/** Decodes standard base64url (RFC 4648 §5) to raw bytes. Throws on invalid input. */
function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("odd-length hex string");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function isValidPayload(value: unknown): value is TicketPayload {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.tid === "number" &&
    typeof p.oid === "number" &&
    typeof p.sz === "string" &&
    typeof p.ev === "string" &&
    typeof p.iat === "number"
  );
}

/**
 * Splits a raw token into its three dot-separated parts, validating the
 * format prefix. Returns null (never throws) for anything malformed — a
 * scanner reading garbage off a cracked screen must not crash.
 */
function splitToken(raw: string): { body: string; signature: string } | null {
  if (typeof raw !== "string" || raw.length === 0) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [prefix, body, signature] = parts;
  if (prefix !== TOKEN_PREFIX) return null;
  if (!body || !signature) return null;

  return { body, signature };
}

/**
 * Reads the payload out of a token WITHOUT verifying its signature. Useful
 * for display/debugging only — never trust the result for access control.
 * Returns null on any malformed input rather than throwing.
 */
export function decodeTicketToken(raw: string): TicketPayload | null {
  const split = splitToken(raw);
  if (!split) return null;

  try {
    const bytes = base64UrlToBytes(split.body);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Decodes and Ed25519-verifies a ticket token against the given public key,
 * and confirms it belongs to `expectedEvent`. Returns the payload only when
 * every check passes; returns null (never throws) otherwise, so a scanner
 * can treat any failure mode identically as REJECT.
 */
export async function verifyTicketToken(
  raw: string,
  publicKeyHex: string,
  expectedEvent: string,
): Promise<TicketPayload | null> {
  const split = splitToken(raw);
  if (!split) return null;

  const payload = decodeTicketToken(raw);
  if (!payload) return null;

  if (payload.ev !== expectedEvent) return null;

  try {
    const message = new TextEncoder().encode(split.body);
    const signature = base64UrlToBytes(split.signature);
    const publicKey = hexToBytes(publicKeyHex);

    const valid = await ed.verifyAsync(signature, message, publicKey);
    return valid ? payload : null;
  } catch {
    return null;
  }
}
