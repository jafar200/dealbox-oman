/**
 * Client session storage (login token + profile).
 *
 * `ClientAuthView` writes both keys right after a successful
 * `/api/v1/auth/login`, `/api/v1/auth/register` or Google sign-in, so every
 * caller reads them through this module instead of touching localStorage.
 */

const TOKEN_STORAGE_KEY = 'dealbox_auth_token_v1';
const USER_STORAGE_KEY = 'dealbox_user_v1';

export interface ClientSession {
  token: string;
  name?: string;
  email?: string;
  phone?: string;
  picture?: string;
}

export const readClientSession = (): ClientSession | null => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;

    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    const profile = rawUser ? (JSON.parse(rawUser) as Partial<ClientSession>) : {};

    return {
      token,
      name: typeof profile.name === 'string' ? profile.name : undefined,
      email: typeof profile.email === 'string' ? profile.email : undefined,
      phone: typeof profile.phone === 'string' ? profile.phone : undefined,
      picture: typeof profile.picture === 'string' ? profile.picture : undefined,
    };
  } catch {
    return null;
  }
};

/** Drops the token and the cached profile so the next visit starts at login. */
export const clearClientSession = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
};
