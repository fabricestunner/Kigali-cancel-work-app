const TOKEN_KEY = "authToken";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
}
