import '../css/app.css';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  // TODO see if we can preload adaptations server side?
  return { ...data };
};
