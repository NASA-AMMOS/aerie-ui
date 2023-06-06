import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import effects from '../../../utilities/effects';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user, permissibleQueries } = await parent();

  if (!user || (permissibleQueries && !Object.keys(permissibleQueries))) {
    throw redirect(302, `${base}/login`);
  }

  const { models: initialModels, plans: initialPlans } = await effects.getPlansAndModels();

  return {
    initialModels,
    initialPlans,
  };
};
