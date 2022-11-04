import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import effects from '../../../utilities/effects';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, `${base}/login`);
  }

  const { models: initialModels, plans: initialPlans } = await effects.getPlansAndModels();

  return {
    initialModels,
    initialPlans,
  };
};
