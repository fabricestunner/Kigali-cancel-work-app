const TOKEN_KEY = "authToken";

export type Role = "admin" | "promoter";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Reads the role claim out of the current JWT for display purposes only —
 * e.g. hiding a Sidebar entry a promoter has no use for. This is NOT an
 * access control check: the token is merely base64-decoded, never verified,
 * so nothing here should be trusted for authorization. The server enforces
 * every real permission boundary by rejecting the request outright.
 *
 * Deliberately does not use a JWT library — decoding a claim for display
 * doesn't need one. Malformed or missing tokens resolve to null rather than
 * throwing. A token that predates roles carries no claim; every account that
 * exists today is an administrator, so a missing claim defaults to 'admin'
 * (mirrors the same fallback in the backend's authenticate middleware).
 */
export function getRole(): Role | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    // JWTs use base64url — swap in the standard base64 alphabet and restore
    // padding before handing it to atob.
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };

    if (payload.role === "admin" || payload.role === "promoter") {
      return payload.role;
    }
    return "admin";
  } catch {
    return null;
  }
}
