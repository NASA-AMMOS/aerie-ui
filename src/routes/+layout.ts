import '../css/app.css';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch }) => {
  // TODO could do this only on plans and plan pages
  const timePluginPath = await (await fetch('/plugins')).text();
  return { ...data, timePluginPath };
};
