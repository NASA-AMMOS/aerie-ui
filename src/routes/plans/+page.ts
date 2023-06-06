import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import effects from '../../utilities/effects';
import { hasNoAuthorization } from '../../utilities/permissions';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user, permissibleQueries } = await parent();

  if (!user || hasNoAuthorization(permissibleQueries)) {
    throw redirect(302, `${base}/login`);
  }

  const { models = [], plans = [] } = await effects.getPlansAndModels();

  return {
    models,
    plans,
  };
};
