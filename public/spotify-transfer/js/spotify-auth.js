/**
 * Spotify PKCE OAuth Module
 * 純前端 Authorization Code with PKCE，不需 Client Secret
 */

const CLIENT_ID = '6311e9e594cd4b968047a6b60eed5b52';
const REDIRECT_URI = window.location.origin + '/spotify-transfer/';
const SCOPES = 'playlist-modify-public playlist-modify-private';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// ─── Helpers ────────────────────────────────────────

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, v => chars[v % chars.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── Auth State ─────────────────────────────────────

let accessToken = null;
let tokenExpiry = 0;

export function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  return null;
}

export function isLoggedIn() {
  return !!getToken();
}

export function getUserProfile() {
  const stored = sessionStorage.getItem('spotify_user');
  return stored ? JSON.parse(stored) : null;
}

// ─── Login Flow ─────────────────────────────────────

export async function login() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlEncode(hashed);

  sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `${AUTH_URL}?${params}`;
}

// ─── Handle Callback ────────────────────────────────

export async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    throw new Error(`Spotify 授權失敗：${error}`);
  }

  if (!code) return false;

  const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('找不到驗證碼，請重新登入');
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || 'Token 交換失敗');
  }

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  sessionStorage.removeItem('spotify_code_verifier');

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);

  // Fetch user profile
  const profile = await fetchProfile();
  sessionStorage.setItem('spotify_user', JSON.stringify(profile));

  return true;
}

async function fetchProfile() {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('無法取得使用者資料');
  return res.json();
}

export function logout() {
  accessToken = null;
  tokenExpiry = 0;
  sessionStorage.removeItem('spotify_user');
  sessionStorage.removeItem('spotify_code_verifier');
}
