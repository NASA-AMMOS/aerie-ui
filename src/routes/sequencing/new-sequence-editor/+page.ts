import effects from '../../../utilities/effects';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent();

  const adaptation = await effects.getSequenceAdaptation(user);

  return { adaptation, user };
};
