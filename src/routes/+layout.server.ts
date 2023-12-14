import { base } from '$app/paths';
import { shouldRedirectToLogin } from '../utilities/login';
import type { LayoutServerLoad } from './$types';
import { goto } from '$app/navigation';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!url.pathname.includes('login') && shouldRedirectToLogin(locals.user)) {
    return goto(`${base}/`);
  }
  return { ...locals };
};
