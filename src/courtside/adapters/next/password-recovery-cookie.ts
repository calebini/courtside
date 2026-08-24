import 'server-only';

import {cookies} from 'next/headers';

import {getCourtsideSiteUrl} from '@/courtside/adapters/config/auth-config';
import {PASSWORD_RECOVERY_AUTHORIZATION_TTL_MS} from '@/courtside/services/password-recovery-authorization';

const COOKIE_NAME = 'courtside_password_recovery';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: getCourtsideSiteUrl().protocol === 'https:',
    path: '/',
    priority: 'high' as const
  };
}

export async function readPasswordRecoveryCookie() {
  return (await cookies()).get(COOKIE_NAME)?.value ?? null;
}

export async function setPasswordRecoveryCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: Math.floor(PASSWORD_RECOVERY_AUTHORIZATION_TTL_MS / 1000)
  });
}

export async function clearPasswordRecoveryCookie() {
  (await cookies()).set(COOKIE_NAME, '', {...cookieOptions(), maxAge: 0});
}
