export interface LocalAuthSession {
  userId: string;
  displayName: string;
  email: string;
  avatarText: string;
  loggedInAt: string;
}

const AUTH_STORAGE_KEY = "movie-claw-auth-session";

export function loadAuthSession(): LocalAuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAuthSession;
    if (!parsed?.userId || !parsed.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(input: {
  displayName?: string;
  email: string;
}): LocalAuthSession {
  const email = input.email.trim().toLowerCase();
  const nameFromEmail = email.split("@")[0] || "创作者";
  const displayName = input.displayName?.trim() || nameFromEmail;
  const session: LocalAuthSession = {
    userId: `user-${email}`,
    displayName,
    email,
    avatarText: displayName.slice(0, 1).toUpperCase(),
    loggedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthStorageKey() {
  return AUTH_STORAGE_KEY;
}
