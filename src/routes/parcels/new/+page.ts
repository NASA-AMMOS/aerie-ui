import { parcelId } from '../../../stores/sequencing';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent();

  parcelId.set(null);

  return { user };
};
