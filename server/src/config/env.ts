import crypto from 'crypto';

let cachedSecret: string | null = null;

/**
 * Returns the JWT signing secret.
 *
 * - In production a missing JWT_SECRET is a fatal configuration error that
 *   fails fast instead of silently using an insecure default.
 * - In development a fresh random secret is generated per boot so the app
 *   keeps working out-of-the-box, but the running server still verifies any
 *   previously-issued token exactly once (its own lifetime).
 */
export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.trim().length > 0) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }

  cachedSecret = crypto.randomBytes(32).toString('hex');
  return cachedSecret;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}