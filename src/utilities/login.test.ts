import { env } from '$env/dynamic/public';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { shouldRedirectToLogin } from './login';
import { ADMIN_ROLE } from './permissions';

vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_LOGIN_PAGE: '',
  },
}));

describe('login util functions', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('shouldRedirectToLogin', () => {
    test('Should determine if the route should redirect to the login page when login is enabled', () => {
      vi.mocked(env).PUBLIC_LOGIN_PAGE = 'enabled';

      expect(shouldRedirectToLogin(null)).toEqual(true);
      expect(
        shouldRedirectToLogin({
          activeRole: 'user',
          allowedRoles: [ADMIN_ROLE, 'user'],
          defaultRole: 'user',
          id: 'foo',
          permissibleQueries: {},
          rolePermissions: {},
          token: 'foo',
        }),
      ).toEqual(true);

      expect(
        shouldRedirectToLogin({
          activeRole: 'user',
          allowedRoles: [ADMIN_ROLE, 'user'],
          defaultRole: 'user',
          id: 'foo',
          permissibleQueries: {
            constraints: true,
          },
          rolePermissions: {},
          token: 'foo',
        }),
      ).toEqual(false);
    });

    test('Should not redirect if login is disabled', () => {
      vi.mocked(env).PUBLIC_LOGIN_PAGE = 'disabled';

      expect(shouldRedirectToLogin(null)).toEqual(false);
      expect(
        shouldRedirectToLogin({
          activeRole: 'user',
          allowedRoles: [ADMIN_ROLE, 'user'],
          defaultRole: 'user',
          id: 'foo',
          permissibleQueries: {},
          rolePermissions: {},
          token: 'foo',
        }),
      ).toEqual(false);

      expect(
        shouldRedirectToLogin({
          activeRole: 'user',
          allowedRoles: [ADMIN_ROLE, 'user'],
          defaultRole: 'user',
          id: 'foo',
          permissibleQueries: {
            constraints: true,
          },
          rolePermissions: {},
          token: 'foo',
        }),
      ).toEqual(false);
    });
  });
});
