export const BCRYPT_ROUNDS = 12;

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 min
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Bytes brutos do refresh token (entropia). 32 bytes = 256 bits.
// Token raw entregue como hex (64 chars) no cookie.
export const REFRESH_TOKEN_BYTES = 32;

// Path do cookie de refresh — restrito ao endpoint de refresh+logout
// para reduzir superficie de envio. Endpoints sob /api/auth/* recebem.
export const REFRESH_TOKEN_PATH = "/api/auth";
