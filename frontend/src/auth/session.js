// Camada mínima de sessão (fora do React) para:
// - centralizar leitura/escrita do accessToken
// - permitir "logout forçado" (ex.: refresh falhou) a partir de interceptors
//
// Mantemos o access token em memória (mais rápido) e persistimos em localStorage
// para restaurar a sessão no reload. O refresh token fica no cookie httpOnly do backend.

const ACCESS_TOKEN_KEY = "accessToken";

let inMemoryAccessToken = null;

/** @type {Set<(event: { type: string, reason?: string }) => void>} */
const listeners = new Set();

function safeGetLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const ls = safeGetLocalStorage();
  const token = ls?.getItem(ACCESS_TOKEN_KEY) || null;
  inMemoryAccessToken = token;
  return token;
}

export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
  const ls = safeGetLocalStorage();
  if (!ls) return;
  if (token) ls.setItem(ACCESS_TOKEN_KEY, token);
  else ls.removeItem(ACCESS_TOKEN_KEY);
}

export function clearSession() {
  setAccessToken(null);
}

export function emitAuthEvent(event) {
  for (const cb of listeners) cb(event);
}

export function subscribeAuthEvents(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

