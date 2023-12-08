import type { Handle } from '@sveltejs/kit';
import { parse, type CookieSerializeOptions } from 'cookie';
import jwtDecode from 'jwt-decode';
import type { BaseUser, ParsedUserToken, User } from './types/app';
import effects from './utilities/effects';
import { isLoginEnabled } from './utilities/login';
import { ADMIN_ROLE } from './utilities/permissions';
import type { ReqAuthResponse, ReqSessionResponse } from './types/auth';
import { reqGatewayForwardCookies } from './utilities/requests';
import { base } from '$app/paths';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    if (!isLoginEnabled()) {
      const permissibleQueries = await effects.getUserQueries(null);
      const rolePermissions = await effects.getRolePermissions(null);
      event.locals.user = {
        activeRole: ADMIN_ROLE,
        allowedRoles: [ADMIN_ROLE],
        defaultRole: ADMIN_ROLE,
        id: 'unknown',
        permissibleQueries,
        rolePermissions,
        token: '',
      };

      return await resolve(event);
    }

    const cookieHeader = event.request.headers.get('cookie') ?? '';
    const cookies = parse(cookieHeader);
    const { activeRole: activeRoleCookie = null, user: userCookie = null } = cookies;

    // try to get role with current JWT
    if (userCookie) {
      const user = await computeRolesFromCookies(userCookie, activeRoleCookie);
      if (user) {
        event.locals.user = user;
        return await resolve(event);
      }
    }

    console.log(`trying SSO, since JWT was invalid`);

    // pass all cookies to the gateway, who can determine if we have any valid SSO tokens
    const validationData = await reqGatewayForwardCookies<ReqSessionResponse>('/auth/validateSSO', cookieHeader);

    if (!validationData.success) {
      console.log('Invalid SSO token, redirecting to login UI page');
      // if we're already on the login page, don't redirect
      // otherwise we get stuck in a redirect loop
      return event.url.pathname.startsWith('/login')
        ? await resolve(event)
        : new Response(null, {
            headers: {
              // message field from gateway response will contain our login UI URL
              location: `${validationData.message}`,
            },
            status: 307,
          });
    }

    // otherwise, if we have a valid token, login with token to generate new JWT
    const loginData = await reqGatewayForwardCookies<ReqAuthResponse>('/auth/loginSSO', cookieHeader);

    if (loginData.success) {
      const user: BaseUser = {
        id: loginData.message,
        token: loginData.token ?? '',
      };

      const roles = await computeRolesFromJWT(user, activeRoleCookie);

      if (roles) {
        console.log(`successfully SSO'd for user ${user.id}`);

        event.locals.user = roles;

        // create and set cookies
        const userStr = JSON.stringify(user);
        const userCookie = Buffer.from(userStr).toString('base64');
        const cookieOpts: CookieSerializeOptions = {
          httpOnly: false,
          path: `${base}/`,
          sameSite: 'none',
        };
        event.cookies.set('user', userCookie, cookieOpts);
        event.cookies.set('activeRole', roles.defaultRole, cookieOpts);

        return await resolve(event);
      }
    }

    // otherwise, we can't auth
    console.log('unable to auth with JWT or SSO token');
    event.locals.user = null;
  } catch (e) {
    console.log(e);
    event.locals.user = null;
  }

  return await resolve(event);
};

async function computeRolesFromCookies(
  userCookie: string | null,
  activeRoleCookie: string | null,
): Promise<User | null> {
  const userBuffer = Buffer.from(userCookie ?? '', 'base64');
  const userStr = userBuffer.toString('utf-8');
  const baseUser: BaseUser = JSON.parse(userStr);

  return computeRolesFromJWT(baseUser, activeRoleCookie);
}

async function computeRolesFromJWT(baseUser: BaseUser, activeRole: string | null): Promise<User | null> {
  const { success } = await effects.session(baseUser);
  if (!success) {
    return null;
  }

  const decodedToken: ParsedUserToken = jwtDecode(baseUser.token);

  const allowedRoles = decodedToken['https://hasura.io/jwt/claims']['x-hasura-allowed-roles'];
  const defaultRole = decodedToken['https://hasura.io/jwt/claims']['x-hasura-default-role'];
  activeRole ??= defaultRole;
  const user: User = {
    ...baseUser,
    activeRole,
    allowedRoles,
    defaultRole,
    permissibleQueries: null,
    rolePermissions: null,
  };
  const permissibleQueries = await effects.getUserQueries(user);

  const rolePermissions = await effects.getRolePermissions(user);
  return {
    ...user,
    permissibleQueries,
    rolePermissions,
  };
}
