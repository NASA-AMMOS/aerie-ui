import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import effects from '../../../../../utilities/effects';
import { parseFloatOrNull } from '../../../../../utilities/generic';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, `${base}/login`);
  }

  const { id: goalIdParam } = params;
  const { models = [], plans = [] } = await effects.getPlansAndModelsForScheduling();

  if (goalIdParam !== null && goalIdParam !== undefined) {
    const goalId = parseFloatOrNull(goalIdParam);
    const initialGoal = await effects.getSchedulingGoal(goalId);

    if (initialGoal !== null) {
      return {
        initialGoal,
        models,
        plans,
      };
    }
  }

  throw redirect(302, `${base}/scheduling/goals`);
};
