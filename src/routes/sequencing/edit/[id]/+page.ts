import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { UserSequence } from '../../../../types/sequencing';
import effects from '../../../../utilities/effects';
import { parseFloatOrNull } from '../../../../utilities/generic';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
  const { user } = await parent();

  const { id: sequenceIdParam } = params;

  if (sequenceIdParam !== null && sequenceIdParam !== undefined) {
    const sequenceIdAsNumber = parseFloatOrNull(sequenceIdParam);

    if (sequenceIdAsNumber !== null) {
      const initialSequence: UserSequence | null = await effects.getUserSequence(sequenceIdAsNumber, user);
      const adaptation = await effects.getSequenceAdaptation(user);

      if (initialSequence !== null) {
        return {
          adaptation,
          initialSequence,
          user,
        };
      }
    }
  }

  redirect(302, `${base}/sequencing`);
};
