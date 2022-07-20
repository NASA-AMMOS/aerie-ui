import { base } from '$app/paths';
import type { RequestHandler } from '@sveltejs/kit';
import effects from '../../utilities/effects';

export const POST: RequestHandler = async event => {
  const body: LoginRequestBody = await event.request.json();
  const { password, username } = body;

  try {
    const loginResponse: ReqLoginResponse = await effects.login(username, password);
    const { message, ssoToken, success, username: id } = loginResponse;

    if (success) {
      const user: User = { id, ssoToken };
      const userStr = JSON.stringify(user);
      const userCookie = Buffer.from(userStr).toString('base64');

      return {
        body: {
          success: true,
          user,
        },
        headers: {
          'set-cookie': `user=${userCookie}; Path=${base}/`,
        },
      };
    } else {
      return {
        body: {
          message,
          success: false,
        },
      };
    }
  } catch (e) {
    console.log(e);
    return {
      body: {
        message: e.message,
        success: false,
      },
    };
  }
};
