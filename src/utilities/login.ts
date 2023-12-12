import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import type { User } from '../types/app';
import { hasNoAuthorization } from './permissions';

export function shouldRedirectToLogin(user: User | null) {
  return !user || hasNoAuthorization(user);
}

export async function logout() {
  if (browser) {
    await fetch(`${base}/auth/logout`, { method: 'POST' });
    await goto(`${base}/`);
  }
}
