/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side JWT Auth Module
 * =============================
 *
 * Access Token:  15 minute expiry — sent as Bearer header
 * Refresh Token: 30 days expiry — stored for silent refresh
 *
 * Token refresh is automatic:
 *   - Before each request, checks if access token is expired
 *   - On 401 response, tries to refresh
 *   - If refresh fails, redirects to login
 */

const ACCESS_TOKEN_KEY = "arcadia_access_token";
const REFRESH_TOKEN_KEY = "arcadia_refresh_token";
const TOKEN_EXPIRY_KEY = "arcadia_token_expires_at";
const USER_KEY = "arcadia_logged_parent";
const USER_EMAIL_KEY = "arcadia_logged_parent_email";

// ─── Token Storage ───────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenExpiry(): number | null {
  const val = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return val ? parseInt(val, 10) : null;
}

export function storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // expiresIn comes from server in seconds — store absolute timestamp
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem("arcadia_state");
  localStorage.removeItem("arcadia_parent_authorized");
  localStorage.removeItem("arcadia_active_tab");
}

export function isLoggedIn(): boolean {
  return !!getAccessToken() && !!localStorage.getItem(USER_KEY);
}

// ─── Check if token needs refresh ───────────────────────────────────
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  // Refresh 2 minutes before actual expiry to be safe
  return Date.now() >= expiry - 120_000;
}

// ─── Silent Token Refresh ───────────────────────────────────────────
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const doFetch = originalFetch || fetch;
    const res = await doFetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    if (data.success) {
      storeTokens(data.accessToken, data.refreshToken, data.expiresIn);
      return true;
    }
    return false;
  } catch {
    // Network error — keep existing tokens and try again later
    return false;
  }
}

// ─── Ensure valid token before fetch ────────────────────────────────
export async function ensureValidToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;

  if (isTokenExpired()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
    return getAccessToken();
  }

  return token;
}

// ─── Verifică dacă URL-ul țintă este același origin ────────────────
function isSameOrigin(input: RequestInfo | URL): boolean {
  if (typeof input === "string") {
    // Relative URL — same origin
    if (input.startsWith("/")) return true;
    try {
      return new URL(input, location.origin).origin === location.origin;
    } catch { return false; }
  }
  if (input instanceof URL) {
    return input.origin === location.origin;
  }
  // Request object — check its URL
  try {
    return new URL(input.url, location.origin).origin === location.origin;
  } catch { return false; }
}

// ─── Auth-Aware Fetch ────────────────────────────────────────────────
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const doFetch = originalFetch || fetch;

  // Pentru request-uri cross-origin (ex: Open-Meteo API), nu adăuga headere de auth
  if (!isSameOrigin(input)) {
    return doFetch(input, init);
  }

  // Ensure we have a valid token first
  const token = await ensureValidToken();
  const loggedEmail = localStorage.getItem(USER_EMAIL_KEY);

  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (loggedEmail) {
    headers.set("x-parent-email", loggedEmail);
  }
  // Correlation ID — urmărire end-to-end (dacă nu e deja setat de apelant)
  if (!headers.has("X-Correlation-ID")) {
    try {
      headers.set("X-Correlation-ID", crypto.randomUUID());
    } catch {
      headers.set("X-Correlation-ID", `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);
    }
  }

  const response = await doFetch(input, {
    ...init,
    headers,
  });

  // If 401, try refreshing once and retry
  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      headers.set("Authorization", `Bearer ${newToken}`);
      return doFetch(input, { ...init, headers });
    }
  }

  return response;
}

// ─── Original fetch reference (captured before interceptor) ──────────
let originalFetch: typeof window.fetch | null = null;

// ─── Install global fetch interceptor ────────────────────────────────
export function installAuthInterceptor(): void {
  if (typeof window === "undefined") return;
  if ((window.fetch as any).__authInstalled) return;

  originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return authFetch(input, init);
  };
  (window.fetch as any).__authInstalled = true;
}
